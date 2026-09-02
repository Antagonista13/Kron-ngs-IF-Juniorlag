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

  function renderGoal(goal) {
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
        .select("title, description, success_description, created_at")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (goalError) {
      console.error("Målfel i utveckling:", goalError);
      clearSummary();
      return;
    }

    renderGoal(goal);
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
  module.exports = { buildGoalSummaryViewModel };
}

if (typeof window !== "undefined" && typeof document !== "undefined") {
  waitForKronangGoalSummary();
}
