function buildCoachLayoutModel() {
  return {
    overviewTitle: "Spelaröversikt",
    contextTitle: "Mål & fokus",
    feedbackTitle: "Tränarens återkoppling",
    assessmentTitle: "Självskattning & tränarbedömning",
    cardClass: "coach-tool-card"
  };
}

function setupCoachLayout() {
  const coachView = document.getElementById("coachDevelopmentView");
  const playerList = document.getElementById("coachPlayerList");
  const development = document.getElementById("coachPlayerDevelopment");
  if (!coachView || !playerList || !development) return false;

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
