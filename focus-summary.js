function buildFocusSummaryViewModel(focus) {
  const areaLabels = {
    technique: "Teknik",
    game_understanding: "Spelförståelse",
    physical: "Fys",
    mentality: "Mentalitet"
  };

  const statusLabels = {
    active: "Aktivt",
    following_up: "Följs upp",
    follow_up_complete: "Uppföljning klar"
  };

  if (!focus) {
    return {
      empty: true,
      areaLabel: "",
      focusText: "Du har inget fokus ännu.",
      attentionText: "",
      statusLabel: ""
    };
  }

  return {
    empty: false,
    areaLabel: areaLabels[focus.development_area] || "",
    focusText: focus.focus_text || "",
    attentionText: focus.attention_text || "",
    statusLabel: statusLabels[focus.follow_up_status] || ""
  };
}

function setupKronangFocusSummary() {
  const developmentPage = document.getElementById("developmentPage");
  const developmentGrid = developmentPage
    ? developmentPage.querySelector(".development-grid")
    : null;

  if (!developmentPage || !developmentGrid) {
    return;
  }

  let summary = document.getElementById("developmentFocusSummary");

  if (!summary) {
    summary = document.createElement("section");
    summary.id = "developmentFocusSummary";
    summary.className = "card development-focus-summary";
    summary.hidden = true;
    developmentGrid.parentElement.insertBefore(summary, developmentGrid);
  }

  function clearSummary() {
    summary.replaceChildren();
    summary.hidden = true;
  }

  function renderFocus(focus) {
    const model = buildFocusSummaryViewModel(focus);
    const heading = document.createElement("h3");

    heading.textContent = "Mitt fokus";
    summary.replaceChildren(heading);

    if (model.empty) {
      const emptyText = document.createElement("p");
      emptyText.textContent = model.focusText;
      summary.appendChild(emptyText);
      summary.hidden = false;
      return;
    }

    if (model.areaLabel) {
      const area = document.createElement("strong");
      area.textContent = model.areaLabel;
      summary.appendChild(area);
    }

    const focusText = document.createElement("h2");
    focusText.textContent = model.focusText;
    summary.appendChild(focusText);

    if (model.statusLabel) {
      const status = document.createElement("p");
      status.textContent = "Status: " + model.statusLabel;
      summary.appendChild(status);
    }

    if (model.attentionText) {
      const attentionLabel = document.createElement("strong");
      const attentionText = document.createElement("p");

      attentionLabel.textContent = "Det här ska jag tänka på";
      attentionText.textContent = model.attentionText;

      summary.appendChild(attentionLabel);
      summary.appendChild(attentionText);
    }

    summary.hidden = false;
  }

  async function loadFocusSummary() {
    if (!window.kronangSupabase) {
      return;
    }

    const { data: sessionData } =
      await window.kronangSupabase.auth.getSession();

    const user = sessionData.session
      ? sessionData.session.user
      : null;

    if (!user) {
      clearSummary();
      return;
    }

    const { data: profile, error: profileError } =
      await window.kronangSupabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

    if (profileError || !profile || profile.role !== "player") {
      clearSummary();
      return;
    }

    const { data: focus, error: focusError } =
      await window.kronangSupabase
        .from("development_focuses")
        .select("development_area, focus_text, attention_text, follow_up_status, created_at")
        .eq("lifecycle_status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (focusError) {
      console.error("Fokusfel i utveckling:", focusError);
      clearSummary();
      return;
    }

    renderFocus(focus);
  }

  window.kronangSupabase.auth.onAuthStateChange(
    function (_event, session) {
      if (session) {
        loadFocusSummary();
      } else {
        clearSummary();
      }
    }
  );

  loadFocusSummary();
}

function waitForKronangFocusSummary() {
  if (window.kronangSupabase) {
    setupKronangFocusSummary();
    return;
  }

  setTimeout(waitForKronangFocusSummary, 100);
}

function loadGoalCreateScript() {
  if (document.querySelector('script[data-goal-create-script]')) return;
  const script = document.createElement("script");
  script.src = "goal-create.js?v=2";
  script.setAttribute("data-goal-create-script", "true");
  document.body.appendChild(script);
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { buildFocusSummaryViewModel };
}

if (typeof window !== "undefined" && typeof document !== "undefined") {
  waitForKronangFocusSummary();
  loadGoalCreateScript();
}
