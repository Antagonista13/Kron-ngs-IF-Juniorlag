function buildCoachLayoutModel() {
  return {
    overviewTitle: "Spelaröversikt",
    contextTitle: "Mål & fokus",
    feedbackTitle: "Tränarens återkoppling",
    assessmentTitle: "Självskattning & tränarbedömning",
    cardClass: "coach-tool-card"
  };
}

function ensureCoachLayoutStyles() {
  if (document.getElementById("coachLayoutStyles")) return;
  const style = document.createElement("style");
  style.id = "coachLayoutStyles";
  style.textContent = `
    #coachDevelopmentView.coach-workspace {
      background: transparent;
      box-shadow: none;
      padding: 0;
    }
    .coach-workspace > h2 { margin-bottom: 6px; }
    .coach-workspace > p { color: #666; margin-top: 0; margin-bottom: 18px; }
    .coach-tool-card {
      background: #fff;
      border: 1px solid #e5e5e5;
      border-radius: 18px;
      padding: 20px;
      margin: 0 0 18px;
      box-shadow: 0 5px 16px rgba(0,0,0,0.06);
    }
    .coach-tool-card > h3 { margin-top: 0; margin-bottom: 18px; font-size: 22px; }
    .coach-overview-card #coachPlayerList { display: flex; gap: 8px; flex-wrap: wrap; }
    .coach-player-button {
      border: 1px solid #111;
      background: #fff;
      color: #111;
      border-radius: 10px;
      padding: 10px 14px;
      font-weight: 700;
      cursor: pointer;
    }
    .coach-player-button:hover, .coach-player-button:focus { background: #111; color: #fff; }
    .coach-context-card p { line-height: 1.5; }
    .coach-feedback-block {
      margin-top: 20px;
      padding-top: 18px;
      border-top: 1px solid #d8d8d8;
    }
    .coach-feedback-block h4 { font-size: 18px; margin: 0 0 12px; }
    .coach-feedback-block textarea, .coach-comment {
      width: 100%;
      border: 1px solid #cfcfcf;
      border-radius: 10px;
      padding: 11px;
      font: inherit;
      resize: vertical;
      margin-bottom: 10px;
    }
    .coach-feedback-block button, #saveCoachAssessment {
      border: none;
      background: #111;
      color: #fff;
      border-radius: 10px;
      padding: 10px 13px;
      font-weight: 700;
      margin: 0 6px 6px 0;
      cursor: pointer;
    }
    .coach-assessment-card > hr { display: none; }
    .coach-assessment-card .coach-development-area {
      border-top: 1px solid #e5e5e5;
      padding: 18px 0 8px;
    }
    .coach-assessment-card .coach-development-area:first-of-type { border-top: none; }
    .coach-rating-star {
      border: none;
      background: transparent;
      font-size: 28px;
      padding: 0 3px;
      cursor: pointer;
    }
    @media (max-width: 600px) {
      .coach-tool-card { padding: 16px; border-radius: 15px; }
      .coach-feedback-block button { width: 100%; margin-right: 0; }
    }
  `;
  document.head.appendChild(style);
}

function setupCoachLayout() {
  const coachView = document.getElementById("coachDevelopmentView");
  const playerList = document.getElementById("coachPlayerList");
  const development = document.getElementById("coachPlayerDevelopment");
  if (!coachView || !playerList || !development) return false;

  ensureCoachLayoutStyles();
  const model = buildCoachLayoutModel();
  coachView.classList.add("coach-workspace");

  if (!document.getElementById("coachOverviewCard")) {
    const overview = document.createElement("section");
    const heading = document.createElement("h3");
    overview.id = "coachOverviewCard";
    overview.className = model.cardClass + " coach-overview-card";
    heading.textContent = model.overviewTitle;
    overview.appendChild(heading);
    playerList.parentElement.insertBefore(overview, playerList);
    overview.appendChild(playerList);
  }

  function decorate() {
    const context = development.querySelector("#coachPlayerContext");
    if (context) {
      context.classList.add(model.cardClass, "coach-context-card");
      const firstHeading = context.querySelector("h3");
      if (firstHeading) firstHeading.textContent = model.contextTitle;
    }

    const feedback = development.querySelector("#coachFocusFeedbackControls");
    if (feedback) {
      feedback.classList.add("coach-feedback-block");
      const feedbackHeading = feedback.querySelector("h4");
      if (feedbackHeading) feedbackHeading.textContent = model.feedbackTitle;
    }

    let assessment = development.querySelector("#coachAssessmentCard");
    const saveButton = development.querySelector("#saveCoachAssessment");
    const noAssessmentText = Array.from(development.querySelectorAll("p")).find(function (p) {
      return p.textContent === "Det finns ingen utvecklingsbedömning ännu.";
    });

    if (!assessment && (saveButton || noAssessmentText)) {
      assessment = document.createElement("section");
      const heading = document.createElement("h3");
      assessment.id = "coachAssessmentCard";
      assessment.className = model.cardClass + " coach-assessment-card";
      heading.textContent = model.assessmentTitle;
      assessment.appendChild(heading);

      const nodes = Array.from(development.childNodes).filter(function (node) {
        return !(node.nodeType === 1 && node.id === "coachPlayerContext");
      });
      nodes.forEach(function (node) { assessment.appendChild(node); });
      development.appendChild(assessment);
    }
  }

  const observer = new MutationObserver(decorate);
  observer.observe(development, { childList: true, subtree: true });
  decorate();
  return true;
}

function waitForCoachLayout() {
  if (setupCoachLayout()) return;
  setTimeout(waitForCoachLayout, 100);
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { buildCoachLayoutModel };
}

if (typeof window !== "undefined") {
  window.KronangCoachLayout = { buildCoachLayoutModel };
  if (typeof document !== "undefined") waitForCoachLayout();
}
