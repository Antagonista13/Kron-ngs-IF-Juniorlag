function buildCoachAssessmentHistoryModel(rows) {
  if (!Array.isArray(rows) || rows.length < 2) return [];
  return rows.slice(1, 4);
}

function formatCoachHistoryDate(value) {
  if (!value) return "Okänt datum";
  return new Intl.DateTimeFormat("sv-SE", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date(value));
}

function coachHistoryStars(value) {
  if (value === null || value === undefined) return "☆☆☆☆☆";
  return "★".repeat(value) + "☆".repeat(5 - value);
}

function renderCoachAssessmentHistory(rows) {
  const history = buildCoachAssessmentHistoryModel(rows);
  if (!history.length) return "";

  const areas = [
    ["Teknik", "technique_self", "technique_coach", "technique_coach_comment"],
    ["Spelförståelse", "game_understanding_self", "game_understanding_coach", "game_understanding_coach_comment"],
    ["Fys", "physical_self", "physical_coach", "physical_coach_comment"],
    ["Mentalitet", "mentality_self", "mentality_coach", "mentality_coach_comment"]
  ];

  return `
    <section class="coach-history-section">
      <button type="button" class="coach-history-toggle" aria-expanded="false">VISA TIDIGARE BEDÖMNINGAR</button>
      <div class="coach-history-list" hidden>
        <h3>Tidigare bedömningar</h3>
        ${history.map(function (assessment) {
          return `
            <article class="coach-history-card">
              <h4>${formatCoachHistoryDate(assessment.created_at)}</h4>
              ${areas.map(function (area) {
                return `
                  <div class="coach-history-area">
                    <strong>${area[0]}</strong>
                    <p>Spelaren: ${coachHistoryStars(assessment[area[1]])}</p>
                    <p>Tränaren: ${coachHistoryStars(assessment[area[2]])}</p>
                    ${assessment[area[3]] ? `<p class="coach-history-comment">${assessment[area[3]]}</p>` : ""}
                  </div>
                `;
              }).join("")}
            </article>
          `;
        }).join("")}
      </div>
    </section>
  `;
}

async function loadCoachAssessmentHistory(playerId) {
  if (!window.kronangSupabase || !playerId) return;
  const container = document.getElementById("coachPlayerDevelopment");
  if (!container) return;

  const { data, error } = await window.kronangSupabase
    .from("development_assessments")
    .select("*")
    .eq("player_id", playerId)
    .order("created_at", { ascending: false })
    .limit(4);

  if (error || !data) return;
  const old = container.querySelector(".coach-history-section");
  if (old) old.remove();
  const html = renderCoachAssessmentHistory(data);
  if (!html) return;
  container.insertAdjacentHTML("beforeend", html);
}

function setupCoachAssessmentHistory() {
  const list = document.getElementById("coachPlayerList");
  const development = document.getElementById("coachPlayerDevelopment");
  if (!list || !development) return false;

  list.addEventListener("click", function (event) {
    const button = event.target.closest(".coach-player-button");
    if (!button) return;
    setTimeout(function () { loadCoachAssessmentHistory(button.dataset.playerId); }, 250);
  });

  development.addEventListener("click", function (event) {
    const toggle = event.target.closest(".coach-history-toggle");
    if (!toggle) return;
    const section = toggle.closest(".coach-history-section");
    const historyList = section.querySelector(".coach-history-list");
    const opening = historyList.hidden;
    historyList.hidden = !opening;
    toggle.setAttribute("aria-expanded", opening ? "true" : "false");
    toggle.textContent = opening ? "DÖLJ TIDIGARE BEDÖMNINGAR" : "VISA TIDIGARE BEDÖMNINGAR";
  });
  return true;
}

function waitForCoachAssessmentHistory() {
  if (setupCoachAssessmentHistory()) return;
  setTimeout(waitForCoachAssessmentHistory, 100);
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { buildCoachAssessmentHistoryModel, coachHistoryStars };
}
if (typeof window !== "undefined" && typeof document !== "undefined") waitForCoachAssessmentHistory();
