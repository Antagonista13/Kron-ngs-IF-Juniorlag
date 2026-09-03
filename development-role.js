function canEditSelfAssessment(role) {
  return role === "player";
}

function shouldShowPlayerDevelopmentCards(role) {
  return role === "player";
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { canEditSelfAssessment, shouldShowPlayerDevelopmentCards };
}

if (typeof window !== "undefined") {
  window.canEditSelfAssessment = canEditSelfAssessment;
  window.shouldShowPlayerDevelopmentCards = shouldShowPlayerDevelopmentCards;
}
