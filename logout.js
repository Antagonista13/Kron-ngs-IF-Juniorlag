function setupKronangLogout() {
  const profilePage = document.getElementById("profilePage");

  if (!profilePage || document.getElementById("logoutButton")) {
    return;
  }

  const logoutSection = document.createElement("section");
  logoutSection.className = "card logout-card";

  logoutSection.innerHTML = `
    <h3>Mitt konto</h3>
    <p id="loggedInPlayer">Spelarprofil hämtas...</p>
    <p id="loggedInEmail">Inloggning hämtas...</p>
    <p>Logga ut från juniorlagsappen på den här enheten.</p>
    <button id="logoutButton" type="button">LOGGA UT</button>
  `;

  profilePage.appendChild(logoutSection);

  const logoutButton = document.getElementById("logoutButton");
  const loggedInPlayer = document.getElementById("loggedInPlayer");
  const loggedInEmail = document.getElementById("loggedInEmail");

  window.kronangSupabase.auth.getSession().then(async function ({ data }) {
    if (!data.session || !data.session.user) {
      loggedInPlayer.textContent = "Ingen aktiv spelarprofil.";
      loggedInEmail.textContent = "Ingen aktiv inloggning.";
      return;
    }

    const user = data.session.user;

    if (user.email) {
      loggedInEmail.textContent =
        "Inloggad som: " + user.email;
    }

    const { data: profile, error } =
      await window.kronangSupabase
        .from("profiles")
        .select("full_name, role, team")
        .eq("id", user.id)
        .single();

    if (error) {
      console.error("Profilfel:", error);
      loggedInPlayer.textContent =
        "Spelarprofil kunde inte hämtas.";
      return;
    }

    if (profile) {
      loggedInPlayer.textContent =
        "Spelare: " + profile.full_name;
    }
  });

  logoutButton.addEventListener("click", async function () {
    logoutButton.disabled = true;
    logoutButton.textContent = "LOGGAR UT...";

    const { error } =
      await window.kronangSupabase.auth.signOut();

    if (error) {
      console.error("Utloggningsfel:", error);
      logoutButton.disabled = false;
      logoutButton.textContent = "LOGGA UT";
      return;
    }

    logoutButton.textContent = "UTLOGGAD";
  });
}

function waitForKronangSupabase() {
  if (window.kronangSupabase) {
    setupKronangLogout();
    return;
  }

  setTimeout(waitForKronangSupabase, 100);
}

waitForKronangSupabase();
