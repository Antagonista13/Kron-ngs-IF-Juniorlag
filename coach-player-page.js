function buildCoachPlayerProfile(player) {
  const data = player || {};
  const title = String(data.name || "").trim() || "Spelare";
  const position = String(data.position || "").trim();
  const normalizedPosition = position.toLocaleLowerCase("sv-SE");
  const badges = [];
  if (normalizedPosition.includes("målvakt")) badges.push("MÅLVAKT");
  if (data.isCaptain) badges.push("KAPTEN");
  return {
    title: title,
    shirtNumber: String(data.shirtNumber || "").trim(),
    position: position,
    badges: badges,
    avatarUrl: String(data.avatarUrl || "").trim()
  };
}

function buildCoachPlayerPageViewModel(name) {
  const profile = buildCoachPlayerProfile({ name: name });
  return {
    title: profile.title,
    backLabel: "← Tillbaka till spelaröversikten",
    subtitle: "Utveckling just nu · Återkoppling · Bedömning · Historik"
  };
}

function buildCoachPlayerNavigation() {
  return [
    { label: "Utveckling just nu", target: "coachPlayerContext" },
    { label: "Återkoppling", target: "coachFocusFeedbackControls" },
    { label: "Bedömning", target: "coachPlayerDevelopment" },
    { label: "Historik", target: "coachHistorySection" }
  ];
}

function buildCoachPlayerLeaderTools() {
  return [
    { label: "NYTT FOKUS", target: "coachPlayerContext" },
    { label: "GE FEEDBACK", target: "coachFocusFeedbackControls" },
    { label: "HANTERA MÅL", target: "coachPlayerContext" }
  ];
}

function playerProfileFromButton(button) {
  if (!button) return buildCoachPlayerProfile({});
  const card = button.closest && button.closest("[data-player-id]");
  const data = button.dataset || {};
  const cardData = card && card.dataset ? card.dataset : {};
  return buildCoachPlayerProfile({
    name: button.textContent,
    shirtNumber: data.shirtNumber || cardData.shirtNumber || "",
    position: data.position || cardData.position || "",
    isCaptain: data.isCaptain === "true" || cardData.isCaptain === "true",
    avatarUrl: data.avatarUrl || cardData.avatarUrl || ""
  });
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
  if (!target && targetId === "coachHistorySection") target = document.querySelector(".coach-history-section");
  if (!target) return false;
  target.scrollIntoView({ behavior: "smooth", block: "start" });
  return true;
}

function openCoachPlayerPage(button) {
  const coachView = document.getElementById("coachDevelopmentView");
  const header = ensureCoachPlayerPageHeader();
  if (!coachView || !header || !button) return;

  const profile = playerProfileFromButton(button);
  const navigation = buildCoachPlayerNavigation();
  const leaderTools = buildCoachPlayerLeaderTools();
  const meta = [profile.shirtNumber ? "#" + profile.shirtNumber : "", profile.position].filter(Boolean).join(" · ");
  const avatar = profile.avatarUrl
    ? `<img class="coach-player-profile-avatar" src="${profile.avatarUrl}" alt="">`
    : '<div class="coach-player-profile-avatar coach-player-profile-avatar-empty" aria-hidden="true">BILD<br>KOMMER</div>';

  header.innerHTML = `
    <button type="button" class="coach-player-page-back">← Tillbaka</button>
    <div class="coach-player-profile-hero">
      ${avatar}
      <div class="coach-player-profile-copy">
        <span class="coach-player-profile-kicker">SPELARPROFIL</span>
        <h2>${profile.title}</h2>
        ${meta ? `<p class="coach-player-profile-meta">${meta}</p>` : ""}
        ${profile.badges.length ? `<div class="coach-player-profile-badges">${profile.badges.map(function (badge) { return `<span>${badge}</span>`; }).join("")}</div>` : ""}
      </div>
    </div>
    <section class="coach-player-leader-tools" aria-label="Ledarverktyg">
      <span>LEDARVERKTYG</span>
      <div>${leaderTools.map(function (item) { return `<button type="button" data-target="${item.target}">${item.label}</button>`; }).join("")}</div>
    </section>
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

  header.querySelectorAll("[data-target]").forEach(function (navButton) {
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
  module.exports = { buildCoachPlayerProfile, buildCoachPlayerPageViewModel, buildCoachPlayerNavigation, buildCoachPlayerLeaderTools };
}

if (typeof window !== "undefined" && typeof document !== "undefined") {
  waitForCoachPlayerPage();
}
