function setupKronangCoach() {
  if (!window.kronangSupabase) {
    return;
  }

  window.kronangSupabase.auth.getSession().then(async function ({ data }) {
    if (!data.session || !data.session.user) {
      return;
    }

    const user = data.session.user;

    const { data: profile, error: profileError } =
      await window.kronangSupabase
        .from("profiles")
        .select("full_name, role, team")
        .eq("id", user.id)
        .maybeSingle();

    if (profileError) {
      console.error("Coach-profilfel:", profileError);
      return;
    }

    if (!profile || profile.role !== "coach") {
      return;
    }

    const developmentPage =
      document.getElementById("developmentPage");

    if (!developmentPage) {
      return;
    }

    const existingCoachView =
      document.getElementById("coachDevelopmentView");

    if (existingCoachView) {
      return;
    }

    const coachView =
      document.createElement("section");

    coachView.id = "coachDevelopmentView";
    coachView.className = "card";

    coachView.innerHTML = `
      <h2>Coachläge</h2>
      <p>Välj en spelare för att se utvecklingen.</p>

      <div id="coachPlayerList">
        <p>Spelare hämtas...</p>
      </div>

      <div id="coachPlayerDevelopment"></div>
    `;

    developmentPage.appendChild(coachView);

    const playerList =
      document.getElementById("coachPlayerList");

    const developmentContainer =
      document.getElementById("coachPlayerDevelopment");

    const { data: players, error: playersError } =
      await window.kronangSupabase
        .from("profiles")
        .select("id, full_name")
        .eq("role", "player")
        .eq("team", "Kronängs IF Juniorlag")
        .order("full_name", {
          ascending: true
        });

    if (playersError) {
      console.error(
        "Fel vid hämtning av spelare:",
        playersError
      );

      playerList.innerHTML =
        "<p>Spelarna kunde inte hämtas.</p>";

      return;
    }

    if (!players || players.length === 0) {
      playerList.innerHTML =
        "<p>Inga spelare hittades.</p>";

      return;
    }

    playerList.innerHTML = "";

    players.forEach(function (player) {
      const button =
        document.createElement("button");

      button.type = "button";
      button.className = "coach-player-button";
      button.dataset.playerId = player.id;

      button.textContent =
        player.full_name || "Namnlös spelare";

      playerList.appendChild(button);
    });

    playerList.addEventListener(
      "click",
      async function (event) {
        const button =
          event.target.closest(".coach-player-button");

        if (!button) {
          return;
        }

        const playerId =
          button.dataset.playerId;

        developmentContainer.innerHTML =
          "<p>Hämtar spelarens utveckling...</p>";

        const { data: player, error: playerError } =
          await window.kronangSupabase
            .from("profiles")
            .select("full_name")
            .eq("id", playerId)
            .maybeSingle();

        if (playerError || !player) {
          console.error(
            "Fel vid hämtning av spelare:",
            playerError
          );

          developmentContainer.innerHTML =
            "<p>Spelaren kunde inte hämtas.</p>";

          return;
        }

        const {
          data: assessment,
          error: assessmentError
        } =
          await window.kronangSupabase
            .from("development_assessments")
            .select("*")
            .eq("player_id", playerId)
            .order("created_at", {
              ascending: false
            })
            .limit(1)
            .maybeSingle();

        if (assessmentError) {
          console.error(
            "Fel vid hämtning av utveckling:",
            assessmentError
          );

          developmentContainer.innerHTML =
            "<p>Utvecklingsdata kunde inte hämtas.</p>";

          return;
        }

        if (!assessment) {
          developmentContainer.innerHTML = `
            <hr>
            <h3>${player.full_name}</h3>
            <p>Det finns ingen utvecklingsbedömning ännu.</p>
          `;

          return;
        }

        function stars(value) {
          if (
            value === null ||
            value === undefined
          ) {
            return "—";
          }

          return (
            "★".repeat(value) +
            "☆".repeat(5 - value)
          );
        }

        developmentContainer.innerHTML = `
          <hr>

          <h3>${player.full_name}</h3>

          <div class="coach-development-area">
            <h4>Teknik</h4>
            <p><strong>Spelarens skattning:</strong>
              ${stars(assessment.technique_self)}
            </p>
            <p><strong>Reflektion:</strong><br>
              ${assessment.technique_reflection || "Ingen reflektion."}
            </p>
          </div>

          <div class="coach-development-area">
            <h4>Spelförståelse</h4>
            <p><strong>Spelarens skattning:</strong>
              ${stars(assessment.game_understanding_self)}
            </p>
            <p><strong>Reflektion:</strong><br>
              ${assessment.game_understanding_reflection || "Ingen reflektion."}
            </p>
          </div>

          <div class="coach-development-area">
            <h4>Fys</h4>
            <p><strong>Spelarens skattning:</strong>
              ${stars(assessment.physical_self)}
            </p>
            <p><strong>Reflektion:</strong><br>
              ${assessment.physical_reflection || "Ingen reflektion."}
            </p>
          </div>

          <div class="coach-development-area">
            <h4>Mentalitet</h4>
            <p><strong>Spelarens skattning:</strong>
              ${stars(assessment.mentality_self)}
            </p>
            <p><strong>Reflektion:</strong><br>
              ${assessment.mentality_reflection || "Ingen reflektion."}
            </p>
          </div>
        `;
      }
    );
  });
}

function waitForKronangCoach() {
  if (window.kronangSupabase) {
    setupKronangCoach();
    return;
  }

  setTimeout(
    waitForKronangCoach,
    100
  );
}

waitForKronangCoach();
