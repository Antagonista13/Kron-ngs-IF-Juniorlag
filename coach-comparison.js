function buildCoachComparisonModel(rows) {
  if (!Array.isArray(rows) || rows.length < 2) return [];

  const current = rows[0];
  const previous = rows[1];
  const areas = [
    ["Teknik", "technique_coach"],
    ["Spelförståelse", "game_understanding_coach"],
    ["Fys", "physical_coach"],
    ["Mentalitet", "mentality_coach"]
  ];

  return areas.map(function (area) {
    return {
      label: area[0],
      current: current[area[1]] ?? null,
      previous: previous[area[1]] ?? null
    };
  });
}

function shouldWaitForCoachAssessmentRender(saveButtonExists, attempt) {
  return !saveButtonExists && attempt < 30;
}

function comparisonStars(value) {
  if (value === null || value === undefined) return "—";
  return "★".repeat(value) + "☆".repeat(5 - value);
}

function renderCoachComparison(rows) {
  const comparison = buildCoachComparisonModel(rows);
  if (!comparison.length) return "";

  return `
    <section class="coach-comparison-card">
      <h3>Jämförelse mot föregående bedömning</h3>
      <div class="coach-comparison-grid">
        ${comparison.map(function (item) {
          return `
            <div class="coach-comparison-row">
              <strong>${item.label}</strong>
              <div>
                <span>Nu: ${comparisonStars(item.current)}</span>
                <span class="coach-comparison-previous">Tidigare: ${comparisonStars(item.previous)}</span>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    </section>
  `;
}

async function loadCoachComparison(playerId) {
  if (!window.kronangSupabase || !playerId) return;

  const container = document.getElementById("coachPlayerDevelopment");
  if (!container) return;

  const { data, error } = await window.kronangSupabase
    .from("development_assessments")
    .select("technique_coach, game_understanding_coach, physical_coach, mentality_coach, created_at")
    .eq("player_id", playerId)
    .order("created_at", { ascending: false })
    .limit(2);

  if (error || !data) return;

  const old = container.querySelector(".coach-comparison-card");
  if (old) old.remove();

  const html = renderCoachComparison(data);
  if (!html) return;

  const history = container.querySelector(".coach-history-section");
  if (history) {
    history.insertAdjacentHTML("beforebegin", html);
  } else {
    container.insertAdjacentHTML("beforeend", html);
  }
}

function mountCoachComparisonWhenReady(playerId, attempt) {
  const container = document.getElementById("coachPlayerDevelopment");
  if (!container) return;

  const saveButtonExists = Boolean(container.querySelector("#saveCoachAssessment"));
  if (shouldWaitForCoachAssessmentRender(saveButtonExists, attempt)) {
    setTimeout(function () {
      mountCoachComparisonWhenReady(playerId, attempt + 1);
    }, 100);
    return;
  }

  if (!saveButtonExists) return;
  loadCoachComparison(playerId);
}

function setupCoachComparison() {
  const list = document.getElementById("coachPlayerList");
  if (!list) return false;

  list.addEventListener("click", function (event) {
    const button = event.target.closest(".coach-player-button");
    if (!button) return;

    mountCoachComparisonWhenReady(button.dataset.playerId, 0);
  });

  return true;
}

function waitForCoachComparison() {
  if (setupCoachComparison()) return;
  setTimeout(waitForCoachComparison, 100);
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { buildCoachComparisonModel, shouldWaitForCoachAssessmentRender };
}

if (typeof window !== "undefined" && typeof document !== "undefined") {
  waitForCoachComparison();
}
