function buildGoalSummaryViewModel(goal) {
  if (!goal) return { empty: true, title: "Du har inget mål ännu.", description: "", successDescription: "" };
  return { empty: false, title: goal.title || "", description: goal.description || "", successDescription: goal.success_description || "" };
}

function buildSubgoalSummaryViewModel(subgoals) {
  const items = (subgoals || []).filter(function (subgoal) { return subgoal.status !== "archived"; }).map(function (subgoal) {
    return { id: subgoal.id, text: subgoal.text || "", completed: subgoal.status === "completed" };
  });
  if (items.length === 0) return { items: [], progressText: "Inga delmål ännu" };
  const completedCount = items.filter(function (item) { return item.completed; }).length;
  return { items: items, progressText: completedCount + " av " + items.length + " delmål klara" };
}

function buildSubgoalToggleRequest(item) { return { p_subgoal_id: item.id, p_completed: !item.completed }; }
function buildSubgoalCreateRequest(goalId, text) { return { p_goal_id: goalId, p_text: (text || "").trim() }; }
function buildSubgoalArchiveRequest(item) { return { p_subgoal_id: item.id }; }
function buildGoalCompleteRequest(goalId, reflection) { return { p_goal_id: goalId, p_final_reflection: (reflection || "").trim() }; }
function buildGoalCompletionViewModel(goal, subgoals) {
  return {
    heading: "Avsluta mål",
    goalTitle: goal.title || "",
    progressText: buildSubgoalSummaryViewModel(subgoals).progressText,
    question: "Vad har du lärt dig och vad gjorde att du nådde målet?"
  };
}

function buildGoalHistoryViewModel(goals, subgoalsByGoal) {
  return (goals || []).map(function (goal) {
    return {
      id: goal.id,
      title: goal.title || "",
      reflection: goal.final_reflection || "",
      completedAt: goal.completed_at || "",
      subgoals: ((subgoalsByGoal && subgoalsByGoal[goal.id]) || [])
        .filter(function (subgoal) { return subgoal.status !== "archived"; })
        .map(function (subgoal) {
          return {
            id: subgoal.id,
            text: subgoal.text || "",
            completed: subgoal.status === "completed"
          };
        })
    };
  });
}

function formatGoalHistoryDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("sv-SE", { year: "numeric", month: "long", day: "numeric" }).format(date);
}

function setupKronangGoalSummary() {
  const developmentPage = document.getElementById("developmentPage");
  const developmentGrid = developmentPage ? developmentPage.querySelector(".development-grid") : null;
  if (!developmentPage || !developmentGrid) return;

  let summary = document.getElementById("developmentGoalSummary");
  if (!summary) {
    summary = document.createElement("section");
    summary.id = "developmentGoalSummary";
    summary.className = "card development-goal-summary";
    summary.hidden = true;
    developmentGrid.parentElement.insertBefore(summary, developmentGrid);
  }

  let history = document.getElementById("developmentGoalHistory");
  if (!history) {
    history = document.createElement("section");
    history.id = "developmentGoalHistory";
    history.className = "card development-goal-history";
    history.hidden = true;
    developmentGrid.parentElement.insertBefore(history, developmentGrid);
  }

  function clearSummary() { summary.replaceChildren(); summary.hidden = true; }
  function clearHistory() { history.replaceChildren(); history.hidden = true; }

  function showGoalCompleted() {
    const heading = document.createElement("h2");
    const text = document.createElement("p");
    const closeButton = document.createElement("button");
    heading.textContent = "MÅL UPPNÅTT!";
    text.textContent = "Bra jobbat. Din slutreflektion och ditt avslutade mål är sparade.";
    closeButton.type = "button";
    closeButton.textContent = "STÄNG";
    summary.replaceChildren(heading, text, closeButton);
    summary.hidden = false;
    closeButton.addEventListener("click", async function () {
      await loadGoalSummary();
      await loadGoalHistory();
    });
  }

  function renderCompletion(goal, subgoals) {
    const model = buildGoalCompletionViewModel(goal, subgoals);
    const heading = document.createElement("h2");
    const goalText = document.createElement("p");
    const progressText = document.createElement("p");
    const question = document.createElement("strong");
    const reflection = document.createElement("textarea");
    const confirmButton = document.createElement("button");
    const cancelButton = document.createElement("button");

    heading.textContent = model.heading;
    goalText.textContent = model.goalTitle;
    progressText.textContent = model.progressText;
    question.textContent = model.question;
    reflection.maxLength = 2000;
    reflection.rows = 5;
    reflection.placeholder = "Skriv din slutreflektion...";
    reflection.setAttribute("aria-label", "Slutreflektion");
    confirmButton.type = "button";
    confirmButton.textContent = "BEKRÄFTA ATT MÅLET ÄR UPPNÅTT";
    confirmButton.disabled = true;
    cancelButton.type = "button";
    cancelButton.textContent = "AVBRYT";

    summary.replaceChildren(heading, goalText, progressText, question, document.createElement("br"), reflection, document.createElement("br"), confirmButton, cancelButton);
    summary.hidden = false;
    reflection.focus();

    reflection.addEventListener("input", function () { confirmButton.disabled = reflection.value.trim().length === 0; });
    cancelButton.addEventListener("click", function () { renderGoal(goal, subgoals); });
    confirmButton.addEventListener("click", async function () {
      const request = buildGoalCompleteRequest(goal.id, reflection.value);
      if (!request.p_final_reflection) { reflection.focus(); return; }
      reflection.disabled = true;
      confirmButton.disabled = true;
      cancelButton.disabled = true;
      const { error } = await window.kronangSupabase.rpc("complete_my_development_goal", request);
      if (error) {
        console.error("Kunde inte avsluta målet:", error);
        reflection.disabled = false;
        confirmButton.disabled = false;
        cancelButton.disabled = false;
        return;
      }
      showGoalCompleted();
    });
  }

  function renderGoal(goal, subgoals) {
    const model = buildGoalSummaryViewModel(goal);
    const heading = document.createElement("h3");
    heading.textContent = "Mitt huvudmål";
    summary.replaceChildren(heading);
    if (model.empty) {
      const emptyText = document.createElement("p");
      emptyText.textContent = model.title;
      summary.appendChild(emptyText);
      summary.hidden = false;
      return;
    }

    const title = document.createElement("h2");
    const description = document.createElement("p");
    title.textContent = model.title;
    description.textContent = model.description;
    summary.appendChild(title);
    summary.appendChild(description);
    if (model.successDescription) {
      const successLabel = document.createElement("strong");
      const successText = document.createElement("p");
      successLabel.textContent = "Så märker jag utveckling";
      successText.textContent = model.successDescription;
      summary.appendChild(successLabel);
      summary.appendChild(successText);
    }

    const subgoalModel = buildSubgoalSummaryViewModel(subgoals);
    const subgoalHeading = document.createElement("h3");
    const progress = document.createElement("p");
    subgoalHeading.textContent = "Delmål";
    progress.textContent = subgoalModel.progressText;
    summary.appendChild(subgoalHeading);

    subgoalModel.items.forEach(function (item) {
      const row = document.createElement("p");
      const label = document.createElement("label");
      const checkbox = document.createElement("input");
      const text = document.createElement("span");
      const archiveButton = document.createElement("button");
      checkbox.type = "checkbox";
      checkbox.checked = item.completed;
      checkbox.setAttribute("aria-label", item.text);
      text.textContent = " " + item.text;
      archiveButton.type = "button";
      archiveButton.textContent = "Ta bort";
      archiveButton.setAttribute("aria-label", "Ta bort delmål: " + item.text);
      checkbox.addEventListener("change", async function () {
        checkbox.disabled = true; archiveButton.disabled = true;
        const { error } = await window.kronangSupabase.rpc("set_my_goal_subgoal_completed", buildSubgoalToggleRequest(item));
        if (error) { console.error("Kunde inte uppdatera delmålet:", error); checkbox.checked = item.completed; checkbox.disabled = false; archiveButton.disabled = false; return; }
        await loadGoalSummary();
      });
      archiveButton.addEventListener("click", async function () {
        checkbox.disabled = true; archiveButton.disabled = true;
        const { error } = await window.kronangSupabase.rpc("archive_my_goal_subgoal", buildSubgoalArchiveRequest(item));
        if (error) { console.error("Kunde inte ta bort delmålet:", error); checkbox.disabled = false; archiveButton.disabled = false; return; }
        await loadGoalSummary();
      });
      label.appendChild(checkbox); label.appendChild(text); row.appendChild(label); row.appendChild(document.createTextNode(" ")); row.appendChild(archiveButton); summary.appendChild(row);
    });
    summary.appendChild(progress);

    const addButton = document.createElement("button");
    addButton.type = "button";
    addButton.textContent = "+ LÄGG TILL DELMÅL";
    summary.appendChild(addButton);
    addButton.addEventListener("click", function () {
      addButton.hidden = true;
      const editor = document.createElement("div");
      const input = document.createElement("input");
      const saveButton = document.createElement("button");
      const cancelButton = document.createElement("button");
      input.type = "text"; input.maxLength = 300; input.placeholder = "Skriv ett delmål..."; input.setAttribute("aria-label", "Nytt delmål");
      saveButton.type = "button"; saveButton.textContent = "SPARA";
      cancelButton.type = "button"; cancelButton.textContent = "AVBRYT";
      editor.appendChild(input); editor.appendChild(saveButton); editor.appendChild(cancelButton); summary.appendChild(editor); input.focus();
      cancelButton.addEventListener("click", function () { editor.remove(); addButton.hidden = false; });
      saveButton.addEventListener("click", async function () {
        const request = buildSubgoalCreateRequest(goal.id, input.value);
        if (!request.p_text) { input.focus(); return; }
        input.disabled = true; saveButton.disabled = true; cancelButton.disabled = true;
        const { error } = await window.kronangSupabase.rpc("add_my_goal_subgoal", request);
        if (error) { console.error("Kunde inte lägga till delmålet:", error); input.disabled = false; saveButton.disabled = false; cancelButton.disabled = false; input.focus(); return; }
        await loadGoalSummary();
      });
    });

    const completeButton = document.createElement("button");
    completeButton.type = "button";
    completeButton.textContent = "AVSLUTA MÅL";
    summary.appendChild(document.createTextNode(" "));
    summary.appendChild(completeButton);
    completeButton.addEventListener("click", function () { renderCompletion(goal, subgoals); });
    summary.hidden = false;
  }

  function renderGoalHistory(goals, subgoalsByGoal) {
    const model = buildGoalHistoryViewModel(goals, subgoalsByGoal);
    const heading = document.createElement("h3");
    heading.textContent = "Målhistorik";
    history.replaceChildren(heading);

    if (model.length === 0) {
      const empty = document.createElement("p");
      empty.textContent = "Du har inga avslutade mål ännu.";
      history.appendChild(empty);
      history.hidden = false;
      return;
    }

    const toggleButton = document.createElement("button");
    const list = document.createElement("div");
    toggleButton.type = "button";
    toggleButton.textContent = "VISA MÅLHISTORIK";
    list.hidden = true;
    history.appendChild(toggleButton);
    history.appendChild(list);

    model.forEach(function (item) {
      const article = document.createElement("article");
      const title = document.createElement("h3");
      const date = document.createElement("p");
      title.textContent = item.title;
      date.textContent = item.completedAt ? "Avslutat " + formatGoalHistoryDate(item.completedAt) : "Avslutat mål";
      article.appendChild(title);
      article.appendChild(date);

      if (item.subgoals.length > 0) {
        const subHeading = document.createElement("strong");
        const subList = document.createElement("ul");
        subHeading.textContent = "Delmål";
        item.subgoals.forEach(function (subgoal) {
          const li = document.createElement("li");
          li.textContent = (subgoal.completed ? "✓ " : "– ") + subgoal.text;
          subList.appendChild(li);
        });
        article.appendChild(subHeading);
        article.appendChild(subList);
      }

      const reflectionHeading = document.createElement("strong");
      const reflection = document.createElement("p");
      reflectionHeading.textContent = "Min slutreflektion";
      reflection.textContent = item.reflection || "Ingen slutreflektion sparad.";
      article.appendChild(reflectionHeading);
      article.appendChild(reflection);
      list.appendChild(article);
    });

    toggleButton.addEventListener("click", function () {
      list.hidden = !list.hidden;
      toggleButton.textContent = list.hidden ? "VISA MÅLHISTORIK" : "DÖLJ MÅLHISTORIK";
    });

    history.hidden = false;
  }

  async function loadGoalSummary() {
    if (!window.kronangSupabase) return;
    const { data: sessionData } = await window.kronangSupabase.auth.getSession();
    const user = sessionData.session ? sessionData.session.user : null;
    if (!user) { clearSummary(); return; }
    const { data: profile, error: profileError } = await window.kronangSupabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (profileError || !profile || profile.role !== "player") { clearSummary(); return; }
    const { data: goal, error: goalError } = await window.kronangSupabase.from("development_goals").select("id, title, description, success_description, created_at").eq("status", "active").order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (goalError) { console.error("Målfel i utveckling:", goalError); clearSummary(); return; }
    let subgoals = [];
    if (goal) {
      const { data: subgoalData, error: subgoalError } = await window.kronangSupabase.from("development_subgoals").select("id, text, status, sort_order").eq("goal_id", goal.id).neq("status", "archived").order("sort_order", { ascending: true });
      if (subgoalError) console.error("Delmålsfel i utveckling:", subgoalError); else subgoals = subgoalData || [];
    }
    renderGoal(goal, subgoals);
  }

  async function loadGoalHistory() {
    if (!window.kronangSupabase) return;
    const { data: sessionData } = await window.kronangSupabase.auth.getSession();
    const user = sessionData.session ? sessionData.session.user : null;
    if (!user) { clearHistory(); return; }

    const { data: profile, error: profileError } = await window.kronangSupabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (profileError || !profile || profile.role !== "player") { clearHistory(); return; }

    const { data: goals, error: goalsError } = await window.kronangSupabase
      .from("development_goals")
      .select("id, title, final_reflection, completed_at")
      .eq("status", "completed")
      .order("completed_at", { ascending: false });

    if (goalsError) {
      console.error("Målhistorikfel:", goalsError);
      clearHistory();
      return;
    }

    const completedGoals = goals || [];
    const subgoalsByGoal = {};
    const goalIds = completedGoals.map(function (goal) { return goal.id; });

    if (goalIds.length > 0) {
      const { data: subgoals, error: subgoalsError } = await window.kronangSupabase
        .from("development_subgoals")
        .select("id, goal_id, text, status, sort_order")
        .in("goal_id", goalIds)
        .order("sort_order", { ascending: true });

      if (subgoalsError) {
        console.error("Historikfel för delmål:", subgoalsError);
      } else {
        (subgoals || []).forEach(function (subgoal) {
          if (!subgoalsByGoal[subgoal.goal_id]) subgoalsByGoal[subgoal.goal_id] = [];
          subgoalsByGoal[subgoal.goal_id].push(subgoal);
        });
      }
    }

    renderGoalHistory(completedGoals, subgoalsByGoal);
  }

  window.kronangSupabase.auth.onAuthStateChange(function (_event, session) {
    if (session) {
      loadGoalSummary();
      loadGoalHistory();
    } else {
      clearSummary();
      clearHistory();
    }
  });
  loadGoalSummary();
  loadGoalHistory();
}

function waitForKronangGoalSummary() { if (window.kronangSupabase) { setupKronangGoalSummary(); return; } setTimeout(waitForKronangGoalSummary, 100); }

if (typeof module !== "undefined" && module.exports) {
  module.exports = { buildGoalSummaryViewModel, buildSubgoalSummaryViewModel, buildSubgoalToggleRequest, buildSubgoalCreateRequest, buildSubgoalArchiveRequest, buildGoalCompleteRequest, buildGoalCompletionViewModel, buildGoalHistoryViewModel };
}
if (typeof window !== "undefined" && typeof document !== "undefined") waitForKronangGoalSummary();
