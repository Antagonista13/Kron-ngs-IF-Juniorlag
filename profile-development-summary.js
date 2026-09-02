function buildProfileDevelopmentSummary(goal, subgoals, focus) {
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
  const completed = visibleSubgoals.filter(function (item) {
    return item.status === "completed";
  }).length;

  return {
    goalTitle: goal ? (goal.title || "") : "Du har inget mål ännu.",
    goalProgress: goal && visibleSubgoals.length > 0
      ? completed + " av " + visibleSubgoals.length + " delmål klara"
      : "",
    focusArea: focus ? (areaLabels[focus.development_area] || "") : "",
    focusText: focus ? (focus.focus_text || "") : "Du har inget fokus ännu.",
    focusStatus: focus ? (statusLabels[focus.follow_up_status] || "") : ""
  };
}

function setupProfileDevelopmentSummary() {
  const profilePage = document.getElementById("profilePage");
  if (!profilePage || !window.kronangSupabase) return;

  const cards = profilePage.querySelectorAll(".card");
  if (cards.length < 2) return;

  const focusCard = cards[0];
  const goalCard = cards[cards.length - 1];

  function goToDevelopment() {
    const button = document.querySelector('.nav-item[data-page="developmentPage"]');
    if (button) button.click();
  }

  function renderSummary(model) {
    const focusHeading = document.createElement("h3");
    focusHeading.textContent = "Mitt fokus just nu";
    focusCard.replaceChildren(focusHeading);

    if (model.focusArea) {
      const area = document.createElement("strong");
      area.textContent = model.focusArea;
      focusCard.appendChild(area);
    }

    const focusText = document.createElement("p");
    focusText.className = "profile-focus";
    focusText.textContent = model.focusText;
    focusCard.appendChild(focusText);

    if (model.focusStatus) {
      const status = document.createElement("p");
      status.textContent = "Status: " + model.focusStatus;
      focusCard.appendChild(status);
    }

    const focusButton = document.createElement("button");
    focusButton.type = "button";
    focusButton.textContent = model.focusArea ? "GÅ TILL UTVECKLING" : "VÄLJ MITT FOKUS";
    focusButton.addEventListener("click", goToDevelopment);
    focusCard.appendChild(focusButton);

    const goalHeading = document.createElement("h3");
    const goalText = document.createElement("p");
    const goalButton = document.createElement("button");
    goalHeading.textContent = "Mitt mål";
    goalText.textContent = model.goalTitle;
    goalButton.type = "button";
    goalButton.textContent = model.goalProgress || model.goalTitle !== "Du har inget mål ännu."
      ? "GÅ TILL UTVECKLING"
      : "SKAPA MITT MÅL";
    goalButton.addEventListener("click", goToDevelopment);

    goalCard.replaceChildren(goalHeading, goalText);

    if (model.goalProgress) {
      const progress = document.createElement("p");
      progress.textContent = model.goalProgress;
      goalCard.appendChild(progress);
    }

    goalCard.appendChild(goalButton);
  }

  async function loadSummary() {
    const { data: sessionData } = await window.kronangSupabase.auth.getSession();
    const user = sessionData.session ? sessionData.session.user : null;
    if (!user) return;

    const { data: profile, error: profileError } = await window.kronangSupabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profile || profile.role !== "player") return;

    const { data: goal, error: goalError } = await window.kronangSupabase
      .from("development_goals")
      .select("id, title")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (goalError) {
      console.error("Profilfel för mål:", goalError);
      return;
    }

    let subgoals = [];
    if (goal) {
      const { data, error } = await window.kronangSupabase
        .from("development_subgoals")
        .select("status")
        .eq("goal_id", goal.id);

      if (error) console.error("Profilfel för delmål:", error);
      else subgoals = data || [];
    }

    const { data: focus, error: focusError } = await window.kronangSupabase
      .from("development_focuses")
      .select("development_area, focus_text, follow_up_status")
      .eq("lifecycle_status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (focusError) {
      console.error("Profilfel för fokus:", focusError);
      return;
    }

    renderSummary(buildProfileDevelopmentSummary(goal, subgoals, focus));
  }

  window.kronangSupabase.auth.onAuthStateChange(function (_event, session) {
    if (session) loadSummary();
  });

  loadSummary();
}

function waitForProfileDevelopmentSummary() {
  if (window.kronangSupabase) {
    setupProfileDevelopmentSummary();
    return;
  }
  setTimeout(waitForProfileDevelopmentSummary, 100);
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { buildProfileDevelopmentSummary };
}

if (typeof window !== "undefined" && typeof document !== "undefined") {
  waitForProfileDevelopmentSummary();
}
