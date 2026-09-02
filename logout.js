function setupKronangLogout() {
  const profilePage = document.getElementById("profilePage");

  if (!profilePage || document.getElementById("logoutButton")) {
    return;
  }

  const logoutSection = document.createElement("section");
  logoutSection.className = "card logout-card";

  logoutSection.innerHTML = `
    <h3>Mitt konto</h3>
    <p id="loggedInEmail">Inloggad som hämtas...</p>
    <p>Logga ut från juniorlagsappen på den här enheten.</p>
    <button id="logoutButton" type="button">LOGGA UT</button>
  `;

  profilePage.appendChild(logoutSection);

  const logoutButton = document.getElementById("logoutButton");
  const loggedInEmail = document.getElementById("loggedInEmail");

  window.kronangSupabase.auth.getSession().then(function ({ data }) {
    if (data.session && data.session.user && data.session.user.email) {
      loggedInEmail.textContent =
        "Inloggad som: " + data.session.user.email;
    } else {
      loggedInEmail.textContent =
        "Ingen aktiv inloggning.";
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
