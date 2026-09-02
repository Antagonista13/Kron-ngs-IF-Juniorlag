function getFocusAreaLabel(area) {
  const areaLabels = { technique: "Teknik", game_understanding: "Spelförståelse", physical: "Fys", mentality: "Mentalitet" };
  return areaLabels[area] || "";
}

function buildFocusSummaryViewModel(focus, feedback) {
  const statusLabels = { active: "Aktivt", following_up: "Följs upp", follow_up_complete: "Uppföljning klar" };
  if (!focus) return { empty: true, areaLabel: "", focusText: "Du har inget fokus ännu.", attentionText: "", statusLabel: "", coachFeedback: "", canComplete: false };
  return {
    empty: false,
    areaLabel: getFocusAreaLabel(focus.development_area),
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

function buildFocusCreateRequest(area, focusText, attentionText) {
  return {
    p_development_area: area,
    p_focus_text: (focusText || "").trim(),
    p_attention_text: (attentionText || "").trim()
  };
}

function validateFocusCreateFields(area, focusText, attentionText) {
  const errors = {};
  if (!(area || "").trim()) errors.area = "Välj ett utvecklingsområde.";
  if (!(focusText || "").trim()) errors.focusText = "Skriv vad du vill fokusera på.";
  if (!(attentionText || "").trim()) errors.attentionText = "Skriv vad du ska tänka på.";
  return { valid: Object.keys(errors).length === 0, errors: errors };
}

function buildFocusHistoryViewModel(focuses, feedbackByFocus) {
  return (focuses || []).map(function (focus) {
    const feedback = feedbackByFocus && feedbackByFocus[focus.id];
    return {
      id: focus.id,
      areaLabel: getFocusAreaLabel(focus.development_area),
      focusText: focus.focus_text || "",
      attentionText: focus.attention_text || "",
      reflection: focus.player_reflection || "",
      coachFeedback: feedback ? (feedback.comment || "") : "",
      endedAt: focus.ended_at || ""
    };
  });
}

function formatFocusHistoryDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("sv-SE", { year: "numeric", month: "long", day: "numeric" }).format(date);
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

  let history = document.getElementById("developmentFocusHistory");
  if (!history) {
    history = document.createElement("section");
    history.id = "developmentFocusHistory";
    history.className = "card development-focus-history";
    history.hidden = true;
    developmentGrid.parentElement.insertBefore(history, developmentGrid);
  }

  function clearSummary() { summary.replaceChildren(); summary.hidden = true; }
  function clearHistory() { history.replaceChildren(); history.hidden = true; }

  function renderFocus(focus, feedback) {
    const model = buildFocusSummaryViewModel(focus, feedback);
    const heading = document.createElement("h3"); heading.textContent = "Mitt fokus";
    summary.replaceChildren(heading);
    if (model.empty) {
      const p = document.createElement("p");
      const createButton = document.createElement("button");
      p.textContent = model.focusText;
      createButton.type = "button";
      createButton.textContent = "SKAPA NYTT FOKUS";
      createButton.className = "primary-button";
      createButton.addEventListener("click", renderCreateFocusForm);
      summary.append(p, createButton);
      summary.hidden = false;
      return;
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

  function renderCreateFocusForm() {
    const heading = document.createElement("h3");
    const intro = document.createElement("p");
    const form = document.createElement("div");
    const areaGroup = document.createElement("div");
    const areaLabel = document.createElement("label");
    const area = document.createElement("select");
    const areaError = document.createElement("p");
    const focusGroup = document.createElement("div");
    const focusLabel = document.createElement("label");
    const focusText = document.createElement("input");
    const focusError = document.createElement("p");
    const attentionGroup = document.createElement("div");
    const attentionLabel = document.createElement("label");
    const attentionText = document.createElement("textarea");
    const attentionError = document.createElement("p");
    const actions = document.createElement("div");
    const save = document.createElement("button");
    const cancel = document.createElement("button");
    const message = document.createElement("p");

    heading.textContent = "Skapa nytt fokus";
    intro.textContent = "Fält markerade med * är obligatoriska.";
    intro.style.color = "#555";
    intro.style.marginBottom = "18px";

    form.style.display = "flex";
    form.style.flexDirection = "column";
    form.style.gap = "18px";

    [areaGroup, focusGroup, attentionGroup].forEach(function (group) {
      group.style.display = "flex";
      group.style.flexDirection = "column";
      group.style.gap = "7px";
    });

    function setRequiredLabel(label, text) {
      label.textContent = text + " ";
      label.style.fontWeight = "700";
      const star = document.createElement("span");
      star.textContent = "*";
      star.style.color = "#b00020";
      star.setAttribute("aria-hidden", "true");
      label.appendChild(star);
    }

    function styleField(field) {
      field.style.width = "100%";
      field.style.padding = "12px";
      field.style.border = "1px solid #bdbdbd";
      field.style.borderRadius = "10px";
      field.style.font = "inherit";
      field.style.background = "#fff";
    }

    function styleError(error) {
      error.style.color = "#b00020";
      error.style.fontSize = "13px";
      error.style.fontWeight = "700";
      error.style.margin = "0";
      error.hidden = true;
    }

    function clearErrors() {
      [area, focusText, attentionText].forEach(function (field) { field.style.border = "1px solid #bdbdbd"; field.removeAttribute("aria-invalid"); });
      [areaError, focusError, attentionError].forEach(function (error) { error.hidden = true; error.textContent = ""; });
      message.textContent = "";
    }

    function showFieldError(field, errorElement, text) {
      field.style.border = "2px solid #b00020";
      field.setAttribute("aria-invalid", "true");
      errorElement.textContent = text;
      errorElement.hidden = false;
    }

    setRequiredLabel(areaLabel, "Utvecklingsområde");
    areaLabel.htmlFor = "focusCreateArea";
    area.id = "focusCreateArea";
    [
      ["", "Välj utvecklingsområde"],
      ["technique", "Teknik"],
      ["game_understanding", "Spelförståelse"],
      ["physical", "Fys"],
      ["mentality", "Mentalitet"]
    ].forEach(function (item) {
      const option = document.createElement("option");
      option.value = item[0];
      option.textContent = item[1];
      area.appendChild(option);
    });

    setRequiredLabel(focusLabel, "Vad vill du fokusera på?");
    focusLabel.htmlFor = "focusCreateText";
    focusText.id = "focusCreateText";
    focusText.type = "text";
    focusText.maxLength = 160;
    focusText.placeholder = "Till exempel: Bättre första touch";

    setRequiredLabel(attentionLabel, "Vad ska du tänka på?");
    attentionLabel.htmlFor = "focusCreateAttention";
    attentionText.id = "focusCreateAttention";
    attentionText.rows = 4;
    attentionText.maxLength = 1000;
    attentionText.placeholder = "Beskriv vad du vill påminna dig själv om...";

    [area, focusText, attentionText].forEach(styleField);
    [areaError, focusError, attentionError].forEach(styleError);

    save.type = "button";
    save.textContent = "SPARA FOKUS";
    save.className = "primary-button";
    cancel.type = "button";
    cancel.textContent = "AVBRYT";
    actions.style.display = "flex";
    actions.style.gap = "10px";
    actions.style.flexWrap = "wrap";
    message.style.margin = "0";

    areaGroup.append(areaLabel, area, areaError);
    focusGroup.append(focusLabel, focusText, focusError);
    attentionGroup.append(attentionLabel, attentionText, attentionError);
    actions.append(save, cancel);
    form.append(areaGroup, focusGroup, attentionGroup, actions, message);
    summary.replaceChildren(heading, intro, form);
    summary.hidden = false;

    cancel.addEventListener("click", function () { renderFocus(null, null); });
    save.addEventListener("click", async function () {
      clearErrors();
      const validation = validateFocusCreateFields(area.value, focusText.value, attentionText.value);
      if (!validation.valid) {
        if (validation.errors.area) showFieldError(area, areaError, validation.errors.area);
        if (validation.errors.focusText) showFieldError(focusText, focusError, validation.errors.focusText);
        if (validation.errors.attentionText) showFieldError(attentionText, attentionError, validation.errors.attentionText);
        if (validation.errors.area) area.focus();
        else if (validation.errors.focusText) focusText.focus();
        else attentionText.focus();
        return;
      }

      const request = buildFocusCreateRequest(area.value, focusText.value, attentionText.value);
      save.disabled = true;
      cancel.disabled = true;
      const { error } = await window.kronangSupabase.rpc("create_my_development_focus", request);
      if (error) {
        console.error("Kunde inte skapa fokus:", error);
        message.textContent = "Fokuset kunde inte sparas.";
        message.style.color = "#b00020";
        save.disabled = false;
        cancel.disabled = false;
        return;
      }
      message.textContent = "Fokuset är sparat.";
      message.style.color = "inherit";
      await loadFocusSummary();
      await loadFocusHistory();
    });
  }

  function renderCompletionForm(focus, feedback) {
    renderFocus(focus, feedback);
    const existing=summary.querySelector("#focusCompletionForm"); if(existing) existing.remove();
    const form=document.createElement("div"); form.id="focusCompletionForm";
    const question=document.createElement("strong"); question.textContent="Vad har blivit bättre sedan du började arbeta med detta fokus?";
    const textarea=document.createElement("textarea"); textarea.rows=4; textarea.maxLength=2000; textarea.placeholder="Skriv din reflektion...";
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
      setTimeout(async function () { await loadFocusSummary(); await loadFocusHistory(); }, 1200);
    });
    cancel.addEventListener("click", function(){ renderFocus(focus, feedback); });
    form.append(question, textarea, save, cancel, message); summary.appendChild(form);
  }

  function renderFocusHistory(focuses, feedbackByFocus) {
    const model = buildFocusHistoryViewModel(focuses, feedbackByFocus);
    const heading = document.createElement("h3");
    heading.textContent = "Fokushistorik";
    history.replaceChildren(heading);

    if (model.length === 0) {
      const empty = document.createElement("p");
      empty.textContent = "Du har inga avslutade fokus ännu.";
      history.appendChild(empty);
      history.hidden = false;
      return;
    }

    const toggleButton = document.createElement("button");
    const list = document.createElement("div");
    toggleButton.type = "button";
    toggleButton.textContent = "VISA FOKUSHISTORIK";
    list.hidden = true;
    history.append(toggleButton, list);

    model.forEach(function (item) {
      const article = document.createElement("article");
      const area = document.createElement("strong");
      const title = document.createElement("h3");
      const date = document.createElement("p");
      area.textContent = item.areaLabel;
      title.textContent = item.focusText;
      date.textContent = item.endedAt ? "Avslutat " + formatFocusHistoryDate(item.endedAt) : "Avslutat fokus";
      article.append(area, title, date);

      if (item.attentionText) {
        const attentionHeading = document.createElement("strong");
        const attention = document.createElement("p");
        attentionHeading.textContent = "Det här skulle jag tänka på";
        attention.textContent = item.attentionText;
        article.append(attentionHeading, attention);
      }

      const reflectionHeading = document.createElement("strong");
      const reflection = document.createElement("p");
      reflectionHeading.textContent = "Min reflektion";
      reflection.textContent = item.reflection || "Ingen reflektion sparad.";
      article.append(reflectionHeading, reflection);

      if (item.coachFeedback) {
        const feedbackHeading = document.createElement("strong");
        const feedback = document.createElement("p");
        feedbackHeading.textContent = "Tränarens återkoppling";
        feedback.textContent = item.coachFeedback;
        article.append(feedbackHeading, feedback);
      }

      list.appendChild(article);
    });

    toggleButton.addEventListener("click", function () {
      list.hidden = !list.hidden;
      toggleButton.textContent = list.hidden ? "VISA FOKUSHISTORIK" : "DÖLJ FOKUSHISTORIK";
    });

    history.hidden = false;
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

  async function loadFocusHistory() {
    if (!window.kronangSupabase) return;
    const { data: sessionData }=await window.kronangSupabase.auth.getSession();
    const user=sessionData.session ? sessionData.session.user : null;
    if(!user){ clearHistory(); return; }
    const { data: profile, error: profileError }=await window.kronangSupabase.from("profiles").select("role").eq("id",user.id).maybeSingle();
    if(profileError || !profile || profile.role!=="player"){ clearHistory(); return; }

    const { data: focuses, error: focusesError }=await window.kronangSupabase
      .from("development_focuses")
      .select("id, development_area, focus_text, attention_text, player_reflection, ended_at")
      .eq("lifecycle_status","ended")
      .order("ended_at",{ascending:false});

    if(focusesError){ console.error("Kunde inte hämta fokushistorik:",focusesError); clearHistory(); return; }

    const feedbackByFocus={};
    if(focuses && focuses.length>0){
      const ids=focuses.map(function(focus){ return focus.id; });
      const { data: feedbackRows, error: feedbackError }=await window.kronangSupabase
        .from("development_focus_coach_feedback")
        .select("focus_id, comment, created_at")
        .in("focus_id",ids)
        .order("created_at",{ascending:false});
      if(feedbackError){
        console.error("Kunde inte hämta återkoppling till fokushistorik:",feedbackError);
      } else {
        (feedbackRows||[]).forEach(function(row){ if(!feedbackByFocus[row.focus_id]) feedbackByFocus[row.focus_id]=row; });
      }
    }
    renderFocusHistory(focuses||[],feedbackByFocus);
  }

  window.kronangSupabase.auth.onAuthStateChange(function(_event,session){ if(session){ loadFocusSummary(); loadFocusHistory(); } else { clearSummary(); clearHistory(); } });
  loadFocusSummary();
  loadFocusHistory();
}

function waitForKronangFocusSummary(){ if(window.kronangSupabase){ setupKronangFocusSummary(); return; } setTimeout(waitForKronangFocusSummary,100); }
function loadGoalCreateScript(){ if(document.querySelector('script[data-goal-create-script]')) return; const script=document.createElement("script"); script.src="goal-create.js?v=2"; script.setAttribute("data-goal-create-script","true"); document.body.appendChild(script); }
if(typeof module!=="undefined" && module.exports) module.exports={ buildFocusSummaryViewModel, buildCompleteFocusRequest, buildFocusCreateRequest, validateFocusCreateFields, buildFocusHistoryViewModel, formatFocusHistoryDate };
if(typeof window!=="undefined" && typeof document!=="undefined"){ waitForKronangFocusSummary(); loadGoalCreateScript(); }
