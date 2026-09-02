function buildCoachLayoutModel() {
  return {
    overviewTitle: "Spelaröversikt",
    contextTitle: "Mål & fokus",
    feedbackTitle: "Tränarens återkoppling",
    assessmentTitle: "Självskattning & tränarbedömning",
    cardClass: "coach-tool-card"
  };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { buildCoachLayoutModel };
}

if (typeof window !== "undefined") {
  window.KronangCoachLayout = { buildCoachLayoutModel };
}
