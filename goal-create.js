function buildGoalCreateRequest(title, description, successDescription) {
  return {
    p_title: (title || "").trim(),
    p_description: (description || "").trim(),
    p_success_description: (successDescription || "").trim()
  };
}

function rememberDevelopmentPage(storage) {
  if (!storage || typeof storage.setItem !== "function") return false;
  storage.setItem("kronangReturnPage", "developmentPage");
  return true;
}

function restoreDevelopmentPage(storage, doc) {
  if (!storage || !doc || typeof storage.getItem !== "function") return false;
  if (storage.getItem("kronangReturnPage") !== "developmentPage") return false;

  const button = doc.querySelector('[data-page="developmentPage"]');
  if (!button) return false;

  if (typeof storage.removeItem === "function") {
    storage.removeItem("kronangReturnPage");
  }

  button.click();
  return true;
}

function setupGoalCreate() {
  if (!window.kronangSupabase) return false;

  const summary = document.getElementById("developmentGoalSummary");
  if (!summary) return false;

  async function prepareEmptyGoalState() {
    const { data: sessionData } = await window.kronangSupabase.auth.getSession();
    const user = sessionData.session ? sessionData.session.user : null;
    if (!user) return true;

    const { data: profile, error: profileError } = await window.kronangSupabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profile || profile.role !== "player") return true;

    const { data: activeGoal, error: goalError } = await window.kronangSupabase
      .from("development_goals")
      .select("id")
      .eq("status", "active")
      .limit(1)
      .maybeSingle();

    if (goalError || activeGoal) return true;
    if (summary.querySelector("[data-create-goal-button]")) return true;

    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "SKAPA NYTT MÅL";
    button.setAttribute("data-create-goal-button", "true");
    summary.appendChild(document.createElement("br"));
    summary.appendChild(button);

    button.addEventListener("click", renderCreateForm);
    return true;
  }

  function renderEmptyState() {
    const heading = document.createElement("h3");
    const text = document.createElement("p");
    const button = document.createElement("button");

    heading.textContent = "Mitt huvudmål";
    text.textContent = "Du har inget mål ännu.";
    button.type = "button";
    button.textContent = "SKAPA NYTT MÅL";
    button.setAttribute("data-create-goal-button", "true");

    summary.replaceChildren(heading, text, button);
    summary.hidden = false;
    button.addEventListener("click", renderCreateForm);
  }

  function renderCreateForm() {
    const heading = document.createElement("h2");
    const titleLabel = document.createElement("strong");
    const title = document.createElement("input");
    const descriptionLabel = document.createElement("strong");
    const description = document.createElement("textarea");
    const successLabel = document.createElement("strong");
    const success = document.createElement("textarea");
    const errorText = document.createElement("p");
    const saveButton = document.createElement("button");
    const cancelButton = document.createElement("button");

    heading.textContent = "Skapa nytt mål";
    titleLabel.textContent = "Vad vill du utveckla?";
    title.type = "text";
    title.maxLength = 120;
    title.placeholder = "Exempel: Bli modigare i mitt spel";
    title.setAttribute("aria-label", "Målets titel");

    descriptionLabel.textContent = "Beskriv ditt mål";
    description.rows = 4;
    description.maxLength = 1000;
    description.placeholder = "Vad vill du bli bättre på?";
    description.setAttribute("aria-label", "Målets beskrivning");

    successLabel.textContent = "Så märker jag utveckling";
    success.rows = 4;
    success.maxLength = 1000;
    success.placeholder = "Hur märker du att du har utvecklats?";
    success.setAttribute("aria-label", "Så märker jag utveckling");

    errorText.hidden = true;
    saveButton.type = "button";
    saveButton.textContent = "SPARA MÅL";
    saveButton.disabled = true;
    cancelButton.type = "button";
    cancelButton.textContent = "AVBRYT";

    summary.replaceChildren(
      heading,
      titleLabel, document.createElement("br"), title,
      document.createElement("br"), document.createElement("br"),
      descriptionLabel, document.createElement("br"), description,
      document.createElement("br"), document.createElement("br"),
      successLabel, document.createElement("br"), success,
      errorText,
      saveButton,
      document.createTextNode(" "),
      cancelButton
    );
    summary.hidden = false;
    title.focus();

    function updateSaveState() {
      const request = buildGoalCreateRequest(title.value, description.value, success.value);
      saveButton.disabled = !request.p_title || !request.p_description || !request.p_success_description;
    }

    title.addEventListener("input", updateSaveState);
    description.addEventListener("input", updateSaveState);
    success.addEventListener("input", updateSaveState);
    cancelButton.addEventListener("click", renderEmptyState);

    saveButton.addEventListener("click", async function () {
      const request = buildGoalCreateRequest(title.value, description.value, success.value);
      if (!request.p_title || !request.p_description || !request.p_success_description) return;

      title.disabled = true;
      description.disabled = true;
      success.disabled = true;
      saveButton.disabled = true;
      cancelButton.disabled = true;
      errorText.hidden = true;

      const { error } = await window.kronangSupabase.rpc("create_my_development_goal", request);

      if (error) {
        console.error("Kunde inte skapa målet:", error);
        errorText.textContent = "Målet kunde inte sparas. Försök igen.";
        errorText.hidden = false;
        title.disabled = false;
        description.disabled = false;
        success.disabled = false;
        cancelButton.disabled = false;
        updateSaveState();
        return;
      }

      rememberDevelopmentPage(window.sessionStorage);
      window.location.reload();
    });
  }

  prepareEmptyGoalState();
  return true;
}

function waitForGoalCreate() {
  if (setupGoalCreate()) return;
  setTimeout(waitForGoalCreate, 100);
}

function waitForDevelopmentRestore() {
  if (!window.sessionStorage || window.sessionStorage.getItem("kronangReturnPage") !== "developmentPage") return;
  if (restoreDevelopmentPage(window.sessionStorage, document)) return;
  setTimeout(waitForDevelopmentRestore, 100);
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { buildGoalCreateRequest, rememberDevelopmentPage, restoreDevelopmentPage };
}

if (typeof window !== "undefined" && typeof document !== "undefined") {
  setTimeout(waitForGoalCreate, 300);
  setTimeout(waitForDevelopmentRestore, 500);
}
