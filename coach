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

    console.log(
      "Kronäng coach inloggad:",
      profile.full_name
    );

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
    `;

    developmentPage.appendChild(coachView);

    const playerList =
      document.getElementById("coachPlayerList");

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
