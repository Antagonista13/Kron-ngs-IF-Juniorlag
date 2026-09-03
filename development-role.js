function canEditSelfAssessment(role) {
  return role === "player";
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { canEditSelfAssessment };
}

if (typeof window !== "undefined") {
  window.canEditSelfAssessment = canEditSelfAssessment;
}
