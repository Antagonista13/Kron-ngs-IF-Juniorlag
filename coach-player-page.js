function buildCoachPlayerPageViewModel(name) {
  return {
    title: (name || "").trim() || "Spelare",
    backLabel: "← Tillbaka till spelaröversikten",
    subtitle: "Mål · Fokus · Bedömning · Jämförelse · Historik"
  };
}

function buildCoachPlayerNavigation() {
  return [
    { label: "Mål", target: "coachPlayerContext" },
    { label: "Fokus", target: "coachPlayerContext" },
    { label: "Bedömning", target: "coachPlayerDevelopment" },
    { label: "Jämförelse", target: "coachComparisonCard" },
    { label: "Historik", target: "coachHistorySection" }
  ];
}

function ensureCoachPlayerPageHeader() {
  const coachView = document.getElementById("coachDevelopmentView");
  const development = document.getElementById("coachPlayerDevelopment");
  if (!coachView || !development) return null;

  let header = document.getElementById("coachPlayerPageHeader");
  if (header) return header;

  header = document.createElement("section");
  header.id = "coachPlayerPageHeader";
  header.className = "coach-player-page-header";
  header.hidden = true;
  development.parentNode.insertBefore(header, development);
  return header;
}

function scrollToCoachPlayerSection(targetId) {
  let target = document.getElementById(targetId);
  if (!target && targetId === "coachComparisonCard") target = document.querySelector(".coach-comparison-card");
  if (!target && targetId === "coachHistorySection") target = document.querySelector(".coach-history-section");
  if (!target) return false;
  target.scrollIntoView({ behavior: "smooth", block: "start" });
  return true;
}

function openCoachPlayerPage(button) {
  const coachView = document.getElementById("coachDevelopmentView");
  const header = ensureCoachPlayerPageHeader();
  if (!coachView || !header || !button) return;

  const model = buildCoachPlayerPageViewModel(button.textContent);
  const navigation = buildCoachPlayerNavigation();
  header.innerHTML = `
    <button type="button" class="coach-player-page-back">${model.backLabel}</button>
    <h2>${model.title}</h2>
    <nav class="coach-player-section-nav" aria-label="Spelarens utvecklingsdelar">
      ${navigation.map(function (item) {
        return `<button type="button" data-target="${item.target}">${item.label}</button>`;
      }).join("")}
    </nav>
  `;
  header.hidden = false;
  coachView.classList.add("coach-player-detail-open");

  const back = header.querySelector(".coach-player-page-back");
  if (back) back.addEventListener("click", closeCoachPlayerPage, { once: true });

  header.querySelectorAll(".coach-player-section-nav button").forEach(function (navButton) {
    navButton.addEventListener("click", function () {
      scrollToCoachPlayerSection(navButton.dataset.target);
    });
  });

  header.scrollIntoView({ behavior: "smooth", block: "start" });
}

function closeCoachPlayerPage() {
  const coachView = document.getElementById("coachDevelopmentView");
  const header = document.getElementById("coachPlayerPageHeader");
  const development = document.getElementById("coachPlayerDevelopment");
  if (!coachView) return;

  coachView.classList.remove("coach-player-detail-open");
  if (header) {
    header.hidden = true;
    header.replaceChildren();
  }
  if (development) development.replaceChildren();

  const search = document.getElementById("coachRosterSearch");
  if (search) search.focus();
  coachView.scrollIntoView({ behavior: "smooth", block: "start" });
}

function setupCoachPlayerPage() {
  const list = document.getElementById("coachPlayerList");
  if (!list || list.dataset.playerPageReady === "true") return false;

  list.dataset.playerPageReady = "true";
  list.addEventListener("click", function (event) {
    const button = event.target.closest(".coach-player-button");
    if (!button) return;
    openCoachPlayerPage(button);
  });

  ensureCoachPlayerPageHeader();
  return true;
}

function waitForCoachPlayerPage() {
  if (setupCoachPlayerPage()) return;
  setTimeout(waitForCoachPlayerPage, 100);
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { buildCoachPlayerPageViewModel, buildCoachPlayerNavigation };
}

if (typeof window !== "undefined" && typeof document !== "undefined") {
  waitForCoachPlayerPage();
}
