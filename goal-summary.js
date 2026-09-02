function buildGoalSummaryViewModel(goal) {
  if (!goal) {
    return {
      empty: true,
      title: "Du har inget mål ännu.",
      description: "",
      successDescription: ""
    };
  }

  return {
    empty: false,
    title: goal.title || "",
    description: goal.description || "",
    successDescription: goal.success_description || ""
  };
}

function buildSubgoalSummaryViewModel(subgoals) {
  const items = (subgoals || [])
    .filter(function (subgoal) {
      return subgoal.status !== "archived";
    })
    .map(function (subgoal) {
      return {
        id: subgoal.id,
        text: subgoal.text || "",
        completed: subgoal.status === "completed"
      };
    });

  if (items.length === 0) {
    return { items: [], progressText: "Inga delmål ännu" };
  }

  const completedCount = items.filter(function (item) {
    return item.completed;
  }).length;

  return {
    items: items,
    progressText: completedCount + " av " + items.length + " delmål klara"
  };
}

function buildSubgoalToggleRequest(item) {
  return {
    p_subgoal_id: item.id,
    p_completed: !item.completed
  };
}

function buildSubgoalCreateRequest(goalId, text) {
  return {
    p_goal_id: goalId,
    p_text: (text || "").trim()
  };
}

function setupKronangGoalSummary() {
  const developmentPage = document.getElementById("developmentPage");
  const developmentGrid = developmentPage
    ? developmentPage.querySelector(".development-grid")
    : null;

  if (!developmentPage || !developmentGrid) {
    return;
  }

  let summary = document.getElementById("developmentGoalSummary");

  if (!summary) {
    summary = document.createElement("section");
    summary.id = "developmentGoalSummary";
    summary.className = "card development-goal-summary";
    summary.hidden = true;
    developmentGrid.parentElement.insertBefore(summary, developmentGrid);
  }

  function clearSummary() {
    summary.replaceChildren();
    summary.hidden = true;
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

      checkbox.type = "checkbox";
      checkbox.checked = item.completed;
      checkbox.setAttribute("aria-label", item.text);
      text.textContent = " " + item.text;

      checkbox.addEventListener("change", async function () {
        checkbox.disabled = true;

        const { error } = await window.kronangSupabase.rpc(
          "set_my_goal_subgoal_completed",
          buildSubgoalToggleRequest(item)
        );

        if (error) {
          console.error("Kunde inte uppdatera delmålet:", error);
          checkbox.checked = item.completed;
          checkbox.disabled = false;
          return;
        }

        await loadGoalSummary();
      });

      label.appendChild(checkbox);
      label.appendChild(text);
      row.appendChild(label);
      summary.appendChild(row);
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

      input.type = "text";
      input.maxLength = 300;
      input.placeholder = "Skriv ett delmål...";
      input.setAttribute("aria-label", "Nytt delmål");

      saveButton.type = "button";
      saveButton.textContent = "SPARA";

      cancelButton.type = "button";
      cancelButton.textContent = "AVBRYT";

      editor.appendChild(input);
      editor.appendChild(saveButton);
      editor.appendChild(cancelButton);
      summary.appendChild(editor);

      input.focus();

      cancelButton.addEventListener("click", function () {
        editor.remove();
        addButton.hidden = false;
      });

      saveButton.addEventListener("click", async function () {
        const request = buildSubgoalCreateRequest(goal.id, input.value);

        if (!request.p_text) {
          input.focus();
          return;
        }

        input.disabled = true;
        saveButton.disabled = true;
        cancelButton.disabled = true;

        const { error } = await window.kronangSupabase.rpc(
          "add_my_goal_subgoal",
          request
        );

        if (error) {
          console.error("Kunde inte lägga till delmålet:", error);
          input.disabled = false;
          saveButton.disabled = false;
          cancelButton.disabled = false;
          input.focus();
          return;
        }

        await loadGoalSummary();
      });
    });

    summary.hidden = false;
  }

  async function loadGoalSummary() {
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

    const { data: goal, error: goalError } =
      await window.kronangSupabase
        .from("development_goals")
        .select("id, title, description, success_description, created_at")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (goalError) {
      console.error("Målfel i utveckling:", goalError);
      clearSummary();
      return;
    }

    let subgoals = [];

    if (goal) {
      const { data: subgoalData, error: subgoalError } =
        await window.kronangSupabase
          .from("development_subgoals")
          .select("id, text, status, sort_order")
          .eq("goal_id", goal.id)
          .neq("status", "archived")
          .order("sort_order", { ascending: true });

      if (subgoalError) {
        console.error("Delmålsfel i utveckling:", subgoalError);
      } else {
        subgoals = subgoalData || [];
      }
    }

    renderGoal(goal, subgoals);
  }

  window.kronangSupabase.auth.onAuthStateChange(
    function (_event, session) {
      if (session) {
        loadGoalSummary();
      } else {
        clearSummary();
      }
    }
  );

  loadGoalSummary();
}

function waitForKronangGoalSummary() {
  if (window.kronangSupabase) {
    setupKronangGoalSummary();
    return;
  }

  setTimeout(waitForKronangGoalSummary, 100);
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    buildGoalSummaryViewModel,
    buildSubgoalSummaryViewModel,
    buildSubgoalToggleRequest,
    buildSubgoalCreateRequest
  };
}

if (typeof window !== "undefined" && typeof document !== "undefined") {
  waitForKronangGoalSummary();
}
