function buildFocusSummaryViewModel(focus, feedback) {
  const areaLabels = { technique: "Teknik", game_understanding: "Spelförståelse", physical: "Fys", mentality: "Mentalitet" };
  const statusLabels = { active: "Aktivt", following_up: "Följs upp", follow_up_complete: "Uppföljning klar" };
  if (!focus) return { empty: true, areaLabel: "", focusText: "Du har inget fokus ännu.", attentionText: "", statusLabel: "", coachFeedback: "", canComplete: false };
  return {
    empty: false,
    areaLabel: areaLabels[focus.development_area] || "",
    focusText: focus.focus_text || "",
    attentionText: focus.attention_text || "",
    statusLabel: statusLabels[focus.follow_up_status] || "",
    coachFeedback: feedback ? (feedback.comment || "") : "",
    canComplete: focus.follow_up_status === "follow_up_complete"
  };
}

function buildCompleteFocusRequest(focusId, reflection) {
  return { p_focus_id: focusId, p_end_reflection: (reflection || "").trim() };
}

function setupKronangFocusSummary() {
  const developmentPage = document.getElementById("developmentPage");
  const developmentGrid = developmentPage ? developmentPage.querySelector(".development-grid") : null;
  if (!developmentPage || !developmentGrid) return;

  let summary = document.getElementById("developmentFocusSummary");
  if (!summary) {
    summary = document.createElement("section");
    summary.id = "developmentFocusSummary";
    summary.className = "card development-focus-summary";
    summary.hidden = true;
    developmentGrid.parentElement.insertBefore(summary, developmentGrid);
  }

  function clearSummary() { summary.replaceChildren(); summary.hidden = true; }

  function renderFocus(focus, feedback) {
    const model = buildFocusSummaryViewModel(focus, feedback);
    const heading = document.createElement("h3"); heading.textContent = "Mitt fokus";
    summary.replaceChildren(heading);
    if (model.empty) {
      const p = document.createElement("p"); p.textContent = model.focusText; summary.appendChild(p); summary.hidden = false; return;
    }
    if (model.areaLabel) { const el=document.createElement("strong"); el.textContent=model.areaLabel; summary.appendChild(el); }
    const title=document.createElement("h2"); title.textContent=model.focusText; summary.appendChild(title);
    if (model.statusLabel) { const el=document.createElement("p"); el.textContent="Status: "+model.statusLabel; summary.appendChild(el); }
    if (model.attentionText) {
      const label=document.createElement("strong"); label.textContent="Det här ska jag tänka på";
      const text=document.createElement("p"); text.textContent=model.attentionText; summary.append(label,text);
    }
    if (model.coachFeedback) {
      const label=document.createElement("strong"); label.textContent="Tränarens återkoppling";
      const text=document.createElement("p"); text.textContent=model.coachFeedback; summary.append(label,text);
    }
    if (model.canComplete) {
      const button=document.createElement("button"); button.type="button"; button.textContent="AVSLUTA FOKUS"; button.className="primary-button";
      button.addEventListener("click", function () { renderCompletionForm(focus, feedback); });
      summary.appendChild(button);
    }
    summary.hidden=false;
  }

  function renderCompletionForm(focus, feedback) {
    renderFocus(focus, feedback);
    const existing=summary.querySelector("#focusCompletionForm"); if(existing) existing.remove();
    const form=document.createElement("div"); form.id="focusCompletionForm";
    const question=document.createElement("strong"); question.textContent="Vad har blivit bättre sedan du började arbeta med detta fokus?";
    const textarea=document.createElement("textarea"); textarea.rows=4; textarea.placeholder="Skriv din reflektion...";
    const save=document.createElement("button"); save.type="button"; save.textContent="SPARA OCH AVSLUTA FOKUS"; save.className="primary-button";
    const cancel=document.createElement("button"); cancel.type="button"; cancel.textContent="AVBRYT";
    const message=document.createElement("p");
    save.addEventListener("click", async function () {
      const request=buildCompleteFocusRequest(focus.id, textarea.value);
      if(!request.p_end_reflection){ message.textContent="Skriv en kort reflektion innan du avslutar fokuset."; return; }
      save.disabled=true;
      const { error }=await window.kronangSupabase.rpc("complete_my_development_focus", request);
      if(error){ console.error("Kunde inte avsluta fokus:", error); message.textContent="Fokuset kunde inte avslutas."; save.disabled=false; return; }
      message.textContent="FOKUS AVSLUTAT!";
      setTimeout(loadFocusSummary, 500);
    });
    cancel.addEventListener("click", function(){ renderFocus(focus, feedback); });
    form.append(question, textarea, save, cancel, message); summary.appendChild(form);
  }

  async function loadFocusSummary() {
    if (!window.kronangSupabase) return;
    const { data: sessionData }=await window.kronangSupabase.auth.getSession();
    const user=sessionData.session ? sessionData.session.user : null;
    if(!user){ clearSummary(); return; }
    const { data: profile, error: profileError }=await window.kronangSupabase.from("profiles").select("role").eq("id",user.id).maybeSingle();
    if(profileError || !profile || profile.role!=="player"){ clearSummary(); return; }
    const { data: focus, error: focusError }=await window.kronangSupabase.from("development_focuses").select("id, development_area, focus_text, attention_text, follow_up_status, created_at").eq("lifecycle_status","active").order("created_at",{ascending:false}).limit(1).maybeSingle();
    if(focusError){ console.error("Fokusfel i utveckling:",focusError); clearSummary(); return; }
    let feedback=null;
    if(focus){
      const { data: feedbackData, error: feedbackError }=await window.kronangSupabase.from("development_focus_coach_feedback").select("comment, created_at").eq("focus_id",focus.id).order("created_at",{ascending:false}).limit(1).maybeSingle();
      if(feedbackError) console.error("Kunde inte hämta tränarens fokusåterkoppling:",feedbackError); else feedback=feedbackData||null;
    }
    renderFocus(focus,feedback);
  }

  window.kronangSupabase.auth.onAuthStateChange(function(_event,session){ if(session) loadFocusSummary(); else clearSummary(); });
  loadFocusSummary();
}

function waitForKronangFocusSummary(){ if(window.kronangSupabase){ setupKronangFocusSummary(); return; } setTimeout(waitForKronangFocusSummary,100); }
function loadGoalCreateScript(){ if(document.querySelector('script[data-goal-create-script]')) return; const script=document.createElement("script"); script.src="goal-create.js?v=2"; script.setAttribute("data-goal-create-script","true"); document.body.appendChild(script); }
if(typeof module!=="undefined" && module.exports) module.exports={ buildFocusSummaryViewModel, buildCompleteFocusRequest };
if(typeof window!=="undefined" && typeof document!=="undefined"){ waitForKronangFocusSummary(); loadGoalCreateScript(); }
