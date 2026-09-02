/* =========================
   KRONÄNGS IF - INLOGGNING
   Steg 1: Supabase Auth
========================= */

const AUTH_SUPABASE_URL = "https://ndbwnsiqcnxppikdrwvd.supabase.co";

const AUTH_SUPABASE_ANON_KEY = "sb_publishable_LueK_yc8XAevJC9zMMVktg_hRc1Zdac";

function startKronangAuth() {

  const supabaseClient = window.supabase.createClient(
    AUTH_SUPABASE_URL,
    AUTH_SUPABASE_ANON_KEY
  );

  const loginScreen = document.createElement("div");

  loginScreen.id = "loginScreen";

  loginScreen.innerHTML = `
    <div class="login-box">

      <div class="login-logo">
        <img
          src="20260605_154224349_iOS.jpg"
          alt="Kronängs IF logotyp"
        >
      </div>

      <h1>KRONÄNGS IF</h1>

      <p class="login-subtitle">
        JUNIORLAG
      </p>

      <div class="login-form">

        <label for="loginEmail">
          E-post
        </label>

        <input
          id="loginEmail"
          type="email"
          autocomplete="username"
          placeholder="Din e-postadress"
        >

        <label for="loginPassword">
          Lösenord
        </label>

        <input
          id="loginPassword"
          type="password"
          autocomplete="current-password"
          placeholder="Ditt lösenord"
        >

        <button
          id="loginButton"
          type="button"
        >
          LOGGA IN
        </button>

        <p
          id="loginMessage"
          class="login-message"
        ></p>

      </div>

    </div>
  `;

  document.body.appendChild(loginScreen);

  const emailInput =
    document.getElementById("loginEmail");

  const passwordInput =
    document.getElementById("loginPassword");

  const loginButton =
    document.getElementById("loginButton");

  const loginMessage =
    document.getElementById("loginMessage");


  function showLogin() {

    loginScreen.style.display = "flex";

    document.body.classList.add(
      "login-locked"
    );

  }


  function hideLogin() {

    loginScreen.style.display = "none";

    document.body.classList.remove(
      "login-locked"
    );

  }


  async function checkSession() {

    const { data } =
      await supabaseClient.auth.getSession();

    if (data.session) {

      hideLogin();

    } else {

      showLogin();

    }

  }


  loginButton.addEventListener(
    "click",
    async function () {

      const email =
        emailInput.value.trim();

      const password =
        passwordInput.value;


      if (!email || !password) {

        loginMessage.textContent =
          "Fyll i både e-post och lösenord.";

        return;

      }


      loginButton.disabled = true;

      loginButton.textContent =
        "LOGGAR IN...";

      loginMessage.textContent = "";


      const { error } =
        await supabaseClient.auth
          .signInWithPassword({
            email: email,
            password: password
          });


      if (error) {

        console.error(
          "Inloggningsfel:",
          error
        );

        loginMessage.textContent =
          "Fel e-post eller lösenord.";

        loginButton.disabled = false;

        loginButton.textContent =
          "LOGGA IN";

        return;

      }


      loginButton.textContent =
        "INLOGGAD";

      hideLogin();

    }
  );


  passwordInput.addEventListener(
    "keydown",
    function (event) {

      if (event.key === "Enter") {

        loginButton.click();

      }

    }
  );


  supabaseClient.auth.onAuthStateChange(
    function (_event, session) {

      if (session) {

        hideLogin();

      } else {

        showLogin();

      }

    }
  );


  checkSession();

  window.kronangSupabase =
    supabaseClient;

}


function loadSupabaseAuthLibrary() {

  if (window.supabase) {

    startKronangAuth();

    return;

  }


  const script =
    document.createElement("script");

  script.src =
    "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";


  script.onload =
    startKronangAuth;


  script.onerror =
    function () {

      console.error(
        "Kunde inte ladda Supabase Auth."
      );

    };


  document.head.appendChild(script);

}


const authStyle =
  document.createElement("style");


authStyle.textContent = `

  #loginScreen {

    position: fixed;

    inset: 0;

    z-index: 99999;

    background: #080808;

    color: #ffffff;

    display: none;

    align-items: center;

    justify-content: center;

    padding: 20px;

  }


  .login-box {

    width: 100%;

    max-width: 380px;

    background: #ffffff;

    color: #080808;

    border-radius: 24px;

    padding: 30px 24px;

    box-shadow:
      0 15px 45px
      rgba(0,0,0,0.35);

  }


  .login-logo {

    width: 76px;

    height: 76px;

    margin:
      0 auto 18px;

    border-radius: 18px;

    overflow: hidden;

  }


  .login-logo img {

    width: 100%;

    height: 100%;

    object-fit: cover;

  }


  .login-box h1 {

    margin: 0;

    text-align: center;

    font-size: 22px;

    letter-spacing: 1.5px;

  }


  .login-subtitle {

    margin:
      6px 0 28px;

    text-align: center;

    color: #777777;

    font-size: 11px;

    letter-spacing: 3px;

  }


  .login-form {

    display: flex;

    flex-direction: column;

  }


  .login-form label {

    font-size: 12px;

    font-weight: 700;

    margin:
      0 0 6px;

  }


  .login-form input {

    width: 100%;

    border:
      1px solid #dddddd;

    border-radius: 12px;

    padding: 14px;

    font-size: 16px;

    margin-bottom: 16px;

    outline: none;

    box-sizing: border-box;

  }


  #loginButton {

    border: none;

    border-radius: 12px;

    background: #080808;

    color: #ffffff;

    padding: 15px;

    font-size: 14px;

    font-weight: 800;

    cursor: pointer;

  }


  #loginButton:disabled {

    opacity: 0.6;

  }


  .login-message {

    min-height: 20px;

    margin:
      12px 0 0;

    text-align: center;

    color: #8b0000;

    font-size: 13px;

  }


  body.login-locked {

    overflow: hidden;

  }

`;


document.head.appendChild(
  authStyle
);


loadSupabaseAuthLibrary();
