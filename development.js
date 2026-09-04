function setupKronangDevelopment() {
  const developmentPage = document.getElementById("developmentPage");
  const developmentGrid = developmentPage ? developmentPage.querySelector(".development-grid") : null;
  if (!developmentGrid) return;

  const areas = [
    { title: "Teknik", selfField: "technique_self", reflectionField: "technique_reflection", coachField: "technique_coach", coachCommentField: "technique_coach_comment" },
    { title: "Spelförståelse", selfField: "game_understanding_self", reflectionField: "game_understanding_reflection", coachField: "game_understanding_coach", coachCommentField: "game_understanding_coach_comment" },
    { title: "Fys", subtitle: "kondition, snabbhet och styrka", selfField: "physical_self", reflectionField: "physical_reflection", coachField: "physical_coach", coachCommentField: "physical_coach_comment" },
    { title: "Mentalitet", subtitle: "inställning, vilja och psyke", selfField: "mentality_self", reflectionField: "mentality_reflection", coachField: "mentality_coach", coachCommentField: "mentality_coach_comment" }
  ];

  const selfRatings = [null, null, null, null];
  const selfReflections = ["", "", "", ""];
  let currentRole = null;

  function canEditSelfAssessment() {
    return typeof window.canEditSelfAssessment === "function" ? window.canEditSelfAssessment(currentRole) : currentRole === "player";
  }
  function formatRating(value) { if (value === null || value === undefined) return "—"; return "★".repeat(value) + "☆".repeat(5 - value); }
  function renderSelfRating(value, areaIndex) {
    let html = '<div class="self-rating-stars">';
    for (let i = 1; i <= 5; i++) {
      const selected = value !== null && value !== undefined && i <= value;
      html += `<button type="button" class="rating-star ${selected ? "selected" : ""}" data-area="${areaIndex}" data-rating="${i}" aria-label="${i} av 5">${selected ? "★" : "☆"}</button>`;
    }
    return html + "</div>";
  }
  function renderDevelopmentAreaIcon(index) {
    const common = 'viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"';
    if (index === 0) return `<span class="development-icon" data-development-area-icon="technique"><svg ${common}><circle cx="12" cy="12" r="9"></circle><path d="M8.5 7.5 12 5l3.5 2.5-1.3 4.1H9.8L8.5 7.5Z"></path><path d="m9.8 11.6-3.5 2.6M14.2 11.6l3.5 2.6M8.5 7.5 5.8 6.7M15.5 7.5l2.7-.8M8.3 17.9l1.5-6.3M15.7 17.9l-1.5-6.3M8.3 17.9h7.4"></path></svg></span>`;
    if (index === 1) return `<span class="development-icon" data-development-area-icon="game-understanding"><svg ${common}><path d="M9.5 4.5A3.5 3.5 0 0 0 6 8v.5A3.5 3.5 0 0 0 4 11.7 3.3 3.3 0 0 0 6.2 15a3.4 3.4 0 0 0 3.3 4.5"></path><path d="M14.5 4.5A3.5 3.5 0 0 1 18 8v.5a3.5 3.5 0 0 1 2 3.2 3.3 3.3 0 0 1-2.2 3.3 3.4 3.4 0 0 1-3.3 4.5"></path><path d="M12 4v16M9.5 8.5A2.5 2.5 0 0 1 12 11M14.5 8.5A2.5 2.5 0 0 0 12 11M9.5 15.5A2.5 2.5 0 0 0 12 13M14.5 15.5A2.5 2.5 0 0 1 12 13"></path></svg></span>`;
    if (index === 2) return `<span class="development-icon" data-development-area-icon="physical"><svg ${common}><path d="m13 2-8 12h6l-1 8 9-13h-6l0-7Z"></path></svg></span>`;
    return `<span class="development-icon" data-development-area-icon="mentality"><svg ${common}><path d="M12 3c1.5 3 4.8 4.7 4.8 8.6A4.8 4.8 0 0 1 12 16.4a4.8 4.8 0 0 1-4.8-4.8c0-2.4 1.1-4 2.7-5.6.2 2 1.1 3 2.1 3.8.7-1.5.8-3.7 0-6.8Z"></path><path d="M9.6 17.1A4.2 4.2 0 0 0 12 21a4.2 4.2 0 0 0 2.4-3.9c0-1.6-.8-2.8-2.4-4.1-1.6 1.3-2.4 2.5-2.4 4.1Z"></path></svg></span>`;
  }
  function removeSaveButton() { const existing = document.getElementById("saveDevelopmentButton"); if (existing && existing.closest(".development-save-card")) existing.closest(".development-save-card").remove(); }
  function renderSaveButton() {
    if (!canEditSelfAssessment()) { removeSaveButton(); return; }
    if (document.getElementById("saveDevelopmentButton")) return;
    const saveSection = document.createElement("section"); saveSection.className = "card development-save-card";
    saveSection.innerHTML = `<button id="saveDevelopmentButton" type="button">SPARA SJÄLVSKATTNING</button><p id="developmentSaveMessage"></p>`;
    developmentGrid.parentElement.appendChild(saveSection);
  }
  function renderCards(assessment) {
    const cards = developmentGrid.querySelectorAll(".development-card");
    cards.forEach(function (card, index) {
      const area = areas[index]; if (!area) return;
      const selfRating = assessment ? assessment[area.selfField] : null;
      const reflection = assessment ? assessment[area.reflectionField] || "" : "";
      selfRatings[index] = selfRating; selfReflections[index] = reflection;
      const coachRating = assessment ? assessment[area.coachField] : null;
      const editable = canEditSelfAssessment();
      const subtitle = area.subtitle ? ` <span class="development-area-subtitle" style="font-size:.62em;font-weight:500;color:#6f6f6f;white-space:normal;">(${area.subtitle})</span>` : "";
      card.innerHTML = `${renderDevelopmentAreaIcon(index)}
        <h3>${area.title}${subtitle}</h3><p>Din självskattning</p>${renderSelfRating(selfRating, index)}
        <p>Din reflektion</p><textarea class="self-reflection" data-area="${index}" rows="3" placeholder="Skriv kort om hur du upplever din utveckling..." ${editable ? "" : "readonly"}></textarea>
        <p>Tränarens bedömning</p><strong>${formatRating(coachRating)}</strong>
        <p>Tränarens kommentar</p><p class="coach-comment-display">${assessment ? assessment[area.coachCommentField] || "Ingen kommentar ännu." : "Ingen kommentar ännu."}</p>`;
      const textarea = card.querySelector(".self-reflection"); if (textarea) textarea.value = reflection;
      if (!editable) card.querySelectorAll(".rating-star").forEach(function (star) { star.disabled = true; });
    });
    renderSaveButton();
  }
  async function loadDevelopment() {
    if (!window.kronangSupabase) return;
    const { data: sessionData } = await window.kronangSupabase.auth.getSession(); if (!sessionData.session || !sessionData.session.user) return;
    const user = sessionData.session.user;
    const { data: profile, error: profileError } = await window.kronangSupabase.from("profiles").select("full_name, role, team").eq("id", user.id).maybeSingle();
    if (profileError) { console.error("Profilfel i utveckling:", profileError); return; }
    currentRole = profile ? profile.role : null; if (!canEditSelfAssessment()) removeSaveButton();
    const heading = developmentPage.querySelector(".page-heading h2"); const subtitle = developmentPage.querySelector(".page-heading p");
    const headingContent = typeof window.getDevelopmentHeading === "function" ? window.getDevelopmentHeading(currentRole, profile ? profile.full_name : "") : { title: profile && profile.full_name ? "Din utveckling, " + profile.full_name : "Din utveckling", subtitle: "Träna smart. Utvecklas varje dag." };
    if (heading) heading.textContent = headingContent.title; if (subtitle) subtitle.textContent = headingContent.subtitle;
    const { data: assessment, error: assessmentError } = await window.kronangSupabase.from("development_assessments").select("*").eq("player_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (assessmentError) { console.error("Utvecklingsfel:", assessmentError); return; } renderCards(assessment);
  }
  developmentGrid.addEventListener("click", function (event) {
    if (!canEditSelfAssessment()) return; const button = event.target.closest(".rating-star"); if (!button) return;
    const areaIndex = Number(button.dataset.area); const rating = Number(button.dataset.rating); selfRatings[areaIndex] = rating;
    const card = button.closest(".development-card"); if (!card) return;
    card.querySelectorAll(".rating-star").forEach(function (star, index) { const selected = index + 1 <= rating; star.textContent = selected ? "★" : "☆"; star.classList.toggle("selected", selected); });
  });
  developmentGrid.addEventListener("input", function (event) { if (!canEditSelfAssessment()) return; const textarea = event.target.closest(".self-reflection"); if (!textarea) return; selfReflections[Number(textarea.dataset.area)] = textarea.value; });
  developmentPage.addEventListener("click", async function (event) {
    const button = event.target.closest("#saveDevelopmentButton"); if (!button || !canEditSelfAssessment()) return;
    const message = document.getElementById("developmentSaveMessage");
    if (selfRatings.some(function (rating) { return rating === null; })) { message.textContent = "Välj en nivå 1–5 för alla fyra områden."; return; }
    button.disabled = true; button.textContent = "SPARAR...";
    const { error } = await window.kronangSupabase.rpc("save_player_self_assessment", { p_technique_self: selfRatings[0], p_technique_reflection: selfReflections[0], p_game_understanding_self: selfRatings[1], p_game_understanding_reflection: selfReflections[1], p_physical_self: selfRatings[2], p_physical_reflection: selfReflections[2], p_mentality_self: selfRatings[3], p_mentality_reflection: selfReflections[3] });
    if (error) { console.error("Fel vid sparande:", error); message.textContent = "Det gick inte att spara. Försök igen."; } else message.textContent = "Självskattningen är sparad.";
    button.disabled = false; button.textContent = "SPARA SJÄLVSKATTNING";
  });
  window.kronangSupabase.auth.onAuthStateChange(function (_event, session) { if (session) loadDevelopment(); }); loadDevelopment();
}
function waitForKronangDevelopment() { if (window.kronangSupabase) { setupKronangDevelopment(); return; } setTimeout(waitForKronangDevelopment, 100); }
waitForKronangDevelopment();
