function setupKronangDevelopment() {
  const developmentPage =
    document.getElementById("developmentPage");

  const developmentGrid =
    developmentPage
      ? developmentPage.querySelector(".development-grid")
      : null;

  if (!developmentGrid) {
    return;
  }

  const areas = [
    {
      title: "Teknik",
      selfField: "technique_self",
      coachField: "technique_coach"
    },
    {
      title: "Spelförståelse",
      selfField: "game_understanding_self",
      coachField: "game_understanding_coach"
    },
    {
      title: "Fys",
      selfField: "physical_self",
      coachField: "physical_coach"
    },
    {
      title: "Mentalitet",
      selfField: "mentality_self",
      coachField: "mentality_coach"
    }
  ];

  const selfRatings = [null, null, null, null];

  function formatRating(value) {
    if (value === null || value === undefined) {
      return "—";
    }

    return (
      "★".repeat(value) +
      "☆".repeat(5 - value)
    );
  }

  function renderSelfRating(value, areaIndex) {
    let html = '<div class="self-rating-stars">';

    for (let i = 1; i <= 5; i++) {
      const selected =
        value !== null &&
        value !== undefined &&
        i <= value;

      html += `
        <button
          type="button"
          class="rating-star ${selected ? "selected" : ""}"
          data-area="${areaIndex}"
          data-rating="${i}"
          aria-label="${i} av 5"
        >
          ${selected ? "★" : "☆"}
        </button>
      `;
    }

    html += "</div>";

    return html;
  }

  function renderCards(assessment) {
    const cards =
      developmentGrid.querySelectorAll(
        ".development-card"
      );

    cards.forEach(function (card, index) {
      const area = areas[index];

      if (!area) {
        return;
      }

      const selfRating =
        selfRatings[index] !== null
          ? selfRatings[index]
          : assessment
          ? assessment[area.selfField]
          : null;

      const coachRating =
        assessment
          ? assessment[area.coachField]
          : null;

      card.innerHTML = `
        <div class="development-icon">
          ${
            index === 0
              ? "⚽"
              : index === 1
              ? "🧠"
              : index === 2
              ? "⚡"
              : "🔥"
          }
        </div>

        <h3>${area.title}</h3>

        <p>Din självskattning</p>

        ${renderSelfRating(selfRating, index)}

        <p>Tränarens bedömning</p>

        <strong>
          ${formatRating(coachRating)}
        </strong>
      `;
    });
  }

  async function loadDevelopment() {
    if (!window.kronangSupabase) {
      return;
    }

    const { data: sessionData } =
      await window.kronangSupabase.auth.getSession();

    if (
      !sessionData.session ||
      !sessionData.session.user
    ) {
      return;
    }

    const user =
      sessionData.session.user;

    const { data: profile, error: profileError } =
      await window.kronangSupabase
        .from("profiles")
        .select("full_name, role, team")
        .eq("id", user.id)
        .maybeSingle();

    if (profileError) {
      console.error(
        "Profilfel i utveckling:",
        profileError
      );
      return;
    }

    const heading =
      developmentPage.querySelector(
        ".page-heading h2"
      );

    if (
      heading &&
      profile &&
      profile.full_name
    ) {
      heading.textContent =
        "Din utveckling, " +
        profile.full_name;
    }

    const {
      data: assessment,
      error: assessmentError
    } =
      await window.kronangSupabase
        .from("development_assessments")
        .select("*")
        .eq("player_id", user.id)
        .order("created_at", {
          ascending: false
        })
        .limit(1)
        .maybeSingle();

    if (assessmentError) {
      console.error(
        "Utvecklingsfel:",
        assessmentError
      );
      return;
    }

    renderCards(assessment);
  }

  developmentGrid.addEventListener(
    "click",
    function (event) {
      const button =
        event.target.closest(".rating-star");

      if (!button) {
        return;
      }

      const areaIndex =
        Number(button.dataset.area);

      const rating =
        Number(button.dataset.rating);

      selfRatings[areaIndex] = rating;

      const cards =
        developmentGrid.querySelectorAll(
          ".development-card"
        );

      cards.forEach(function (card, index) {
        if (index !== areaIndex) {
          return;
        }

        const buttons =
          card.querySelectorAll(".rating-star");

        buttons.forEach(function (star, starIndex) {
          const starNumber = starIndex + 1;

          if (starNumber <= rating) {
            star.textContent = "★";
            star.classList.add("selected");
          } else {
            star.textContent = "☆";
            star.classList.remove("selected");
          }
        });
      });
    }
  );

  window.kronangSupabase.auth.onAuthStateChange(
    function (_event, session) {
      if (session) {
        loadDevelopment();
      }
    }
  );

  loadDevelopment();
}


function waitForKronangDevelopment() {
  if (window.kronangSupabase) {
    setupKronangDevelopment();
    return;
  }

  setTimeout(
    waitForKronangDevelopment,
    100
  );
}


waitForKronangDevelopment();
