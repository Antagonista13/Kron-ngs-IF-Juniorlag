function buildCoachPlayerContext(goal, subgoals, focus) {
  const areaLabels = {
    technique: "Teknik",
    game_understanding: "Spelförståelse",
    physical: "Fys",
    mentality: "Mentalitet"
  };

  const statusLabels = {
    active: "Aktivt",
    following_up: "Följs upp",
    follow_up_complete: "Uppföljning klar"
  };

  const visibleSubgoals = (subgoals || []).filter(function (item) {
    return item.status !== "archived";
  });

  const completedCount = visibleSubgoals.filter(function (item) {
    return item.status === "completed";
  }).length;

  return {
    goalTitle: goal ? (goal.title || "") : "Inget aktivt huvudmål.",
    goalProgress: goal && visibleSubgoals.length > 0
      ? completedCount + " av " + visibleSubgoals.length + " delmål klara"
      : "",
    focusArea: focus ? (areaLabels[focus.development_area] || "") : "",
    focusText: focus ? (focus.focus_text || "") : "Inget aktivt fokus.",
    focusStatus: focus ? (statusLabels[focus.follow_up_status] || "") : ""
  };
}

function setupCoachPlayerContext() {
  if (!window.kronangSupabase) return false;

  const playerList = document.getElementById("coachPlayerList");
  const developmentContainer = document.getElementById("coachPlayerDevelopment");
  if (!playerList || !developmentContainer) return false;

  let selectedPlayerId = null;
  let selectedContext = null;

  function renderContext() {
    if (!selectedPlayerId || !selectedContext) return;
    if (developmentContainer.querySelector("#coachPlayerContext")) return;

    const section = document.createElement("section");
    const heading = document.createElement("h3");
    const goalLabel = document.createElement("strong");
    const goalText = document.createElement("p");
    const focusLabel = document.createElement("strong");
    const focusText = document.createElement("p");

    section.id = "coachPlayerContext";
    section.className = "coach-player-context";
    heading.textContent = "Spelarens aktuella utvecklingsfokus";
    goalLabel.textContent = "Huvudmål";
    goalText.textContent = selectedContext.goalTitle;
    focusLabel.textContent = "Fokus";
    focusText.textContent = selectedContext.focusArea
      ? selectedContext.focusArea + ": " + selectedContext.focusText
      : selectedContext.focusText;

    section.appendChild(heading);
    section.appendChild(goalLabel);
    section.appendChild(goalText);

    if (selectedContext.goalProgress) {
      const progress = document.createElement("p");
      progress.textContent = selectedContext.goalProgress;
      section.appendChild(progress);
    }

    section.appendChild(focusLabel);
    section.appendChild(focusText);

    if (selectedContext.focusStatus) {
      const status = document.createElement("p");
      status.textContent = "Status: " + selectedContext.focusStatus;
      section.appendChild(status);
    }

    const note = document.createElement("p");
    note.textContent = "Visas skrivskyddat. Spelaren äger sitt mål och fokus.";
    section.appendChild(note);

    developmentContainer.prepend(section);
  }

  async function loadContext(playerId) {
    selectedPlayerId = playerId;
    selectedContext = null;

    const { data: goal, error: goalError } = await window.kronangSupabase
      .from("development_goals")
      .select("id, title")
      .eq("player_id", playerId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (goalError) {
      console.error("Kunde inte hämta spelarens mål i coachläge:", goalError);
      return;
    }

    let subgoals = [];
    if (goal) {
      const { data, error } = await window.kronangSupabase
        .from("development_subgoals")
        .select("status")
        .eq("goal_id", goal.id);

      if (error) {
        console.error("Kunde inte hämta spelarens delmål i coachläge:", error);
      } else {
        subgoals = data || [];
      }
    }

    const { data: focus, error: focusError } = await window.kronangSupabase
      .from("development_focuses")
      .select("development_area, focus_text, follow_up_status")
      .eq("player_id", playerId)
      .eq("lifecycle_status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (focusError) {
      console.error("Kunde inte hämta spelarens fokus i coachläge:", focusError);
      return;
    }

    selectedContext = buildCoachPlayerContext(goal, subgoals, focus);
    renderContext();
  }

  playerList.addEventListener("click", function (event) {
    const button = event.target.closest(".coach-player-button");
    if (!button) return;
    loadContext(button.dataset.playerId);
  });

  const observer = new MutationObserver(function () {
    if (selectedContext && !developmentContainer.querySelector("#coachPlayerContext")) {
      renderContext();
    }
  });

  observer.observe(developmentContainer, { childList: true, subtree: false });
  return true;
}

function waitForCoachPlayerContext() {
  if (setupCoachPlayerContext()) return;
  setTimeout(waitForCoachPlayerContext, 100);
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { buildCoachPlayerContext };
}

if (typeof window !== "undefined" && typeof document !== "undefined") {
  waitForCoachPlayerContext();
}
