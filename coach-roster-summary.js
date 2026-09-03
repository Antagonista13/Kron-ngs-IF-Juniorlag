function hasCompleteRosterCoachAssessment(row) {
  if (!row) return false;
  return [
    "technique_coach",
    "game_understanding_coach",
    "physical_coach",
    "mentality_coach"
  ].every(function (field) {
    return row[field] !== null && row[field] !== undefined;
  });
}

function formatRosterAssessmentDate(value) {
  if (!value) return "Ingen tränarbedömning";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Ingen tränarbedömning";
  return new Intl.DateTimeFormat("sv-SE", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Stockholm"
  }).format(date);
}

function latestByPlayer(rows, playerId, predicate) {
  return (rows || [])
    .filter(function (row) {
      return row.player_id === playerId && (!predicate || predicate(row));
    })
    .sort(function (a, b) {
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    })[0] || null;
}

function buildCoachRosterSummary(players, goals, focuses, assessments) {
  return (players || [])
    .map(function (player) {
      const goal = latestByPlayer(goals, player.id, function (row) {
        return row.status === "active";
      });
      const focus = latestByPlayer(focuses, player.id, function (row) {
        return row.lifecycle_status === "active";
      });
      const assessment = latestByPlayer(assessments, player.id, hasCompleteRosterCoachAssessment);

      return {
        id: player.id,
        name: player.full_name || "Namnlös spelare",
        goal: goal && goal.title ? goal.title : "Inget aktivt mål",
        focus: focus && focus.focus_text ? focus.focus_text : "Inget aktivt fokus",
        latestAssessment: assessment
          ? formatRosterAssessmentDate(assessment.created_at)
          : "Ingen tränarbedömning"
      };
    })
    .sort(function (a, b) {
      return a.name.localeCompare(b.name, "sv");
    });
}

function renderCoachRosterSummary(items) {
  const list = document.getElementById("coachPlayerList");
  if (!list) return;

  items.forEach(function (item) {
    const button = list.querySelector(`.coach-player-button[data-player-id="${item.id}"]`);
    if (!button || button.closest(".coach-roster-player")) return;

    const card = document.createElement("article");
    card.className = "coach-roster-player";

    const details = document.createElement("div");
    details.className = "coach-roster-details";
    details.innerHTML = `
      <p><strong>Mål:</strong> ${item.goal}</p>
      <p><strong>Fokus:</strong> ${item.focus}</p>
      <p><strong>Senaste bedömning:</strong> ${item.latestAssessment}</p>
    `;

    button.parentNode.insertBefore(card, button);
    card.appendChild(button);
    card.appendChild(details);
  });
}

async function loadCoachRosterSummary() {
  if (!window.kronangSupabase) return;

  const list = document.getElementById("coachPlayerList");
  if (!list) return;

  const buttons = Array.from(list.querySelectorAll(".coach-player-button"));
  if (!buttons.length) return;

  const playerIds = buttons.map(function (button) { return button.dataset.playerId; }).filter(Boolean);
  const players = buttons.map(function (button) {
    return { id: button.dataset.playerId, full_name: button.textContent.trim() };
  });

  const [goalsResult, focusesResult, assessmentsResult] = await Promise.all([
    window.kronangSupabase
      .from("development_goals")
      .select("player_id, title, status, created_at")
      .in("player_id", playerIds)
      .eq("status", "active"),
    window.kronangSupabase
      .from("development_focuses")
      .select("player_id, focus_text, lifecycle_status, created_at")
      .in("player_id", playerIds)
      .eq("lifecycle_status", "active"),
    window.kronangSupabase
      .from("development_assessments")
      .select("player_id, technique_coach, game_understanding_coach, physical_coach, mentality_coach, created_at")
      .in("player_id", playerIds)
      .order("created_at", { ascending: false })
  ]);

  if (goalsResult.error) console.error("Kunde inte hämta spelaröversiktens mål:", goalsResult.error);
  if (focusesResult.error) console.error("Kunde inte hämta spelaröversiktens fokus:", focusesResult.error);
  if (assessmentsResult.error) console.error("Kunde inte hämta spelaröversiktens bedömningar:", assessmentsResult.error);

  const items = buildCoachRosterSummary(
    players,
    goalsResult.data || [],
    focusesResult.data || [],
    assessmentsResult.data || []
  );

  renderCoachRosterSummary(items);
}

function waitForCoachRosterSummary(attempt) {
  const list = document.getElementById("coachPlayerList");
  const hasPlayers = list && list.querySelector(".coach-player-button");

  if (hasPlayers) {
    loadCoachRosterSummary();
    return;
  }

  if ((attempt || 0) >= 40) return;
  setTimeout(function () {
    waitForCoachRosterSummary((attempt || 0) + 1);
  }, 100);
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { buildCoachRosterSummary, formatRosterAssessmentDate, hasCompleteRosterCoachAssessment };
}

if (typeof window !== "undefined" && typeof document !== "undefined") {
  waitForCoachRosterSummary(0);
}
