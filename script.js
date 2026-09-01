const navItems = document.querySelectorAll(".nav-item");
const pages = document.querySelectorAll(".page");

/* =========================
   NAVIGATION
========================= */

navItems.forEach(function (item) {

  item.addEventListener("click", function () {

    const pageId = item.getAttribute("data-page");

    pages.forEach(function (page) {
      page.classList.remove("active");
    });

    const selectedPage = document.getElementById(pageId);

    if (selectedPage) {
      selectedPage.classList.add("active");
    }

    navItems.forEach(function (nav) {
      nav.classList.remove("active");
    });

    item.classList.add("active");

    window.scrollTo(0, 0);

    /* Kör kalender-testet ENDAST när Kalender öppnas */
    if (pageId === "calendarPage") {
      testSportAdminCalendar();
    }

  });

});


/* =========================
   VECKANS UTMANING
========================= */

const challengeButton = document.getElementById("challengeButton");

if (challengeButton) {

  challengeButton.addEventListener("click", function () {

    challengeButton.textContent = "UTMANING KLAR! 🔥";
    challengeButton.style.background = "#333";

  });

}


/* =========================
   SPORTADMIN KALENDER TEST
========================= */

async function testSportAdminCalendar() {

  const calendarList = document.getElementById("calendarList");

  if (!calendarList) return;

  calendarList.innerHTML = `
    <div class="calendar-loading">
      Hämtar kalender från SportAdmin...
    </div>
  `;

  const sportAdminUrl =
    https://kronangs-kalender.h-bergqvist.workers.dev/

  try {

    const response = await fetch(sportAdminUrl);

    if (!response.ok) {
      throw new Error("SportAdmin svarade med fel");
    }

    const data = await response.text();

    /* Vi visar bara ett testresultat just nu */
    calendarList.innerHTML = `
      <div class="calendar-loading">
        SportAdmin-kalendern kunde läsas! 🔥
      </div>
    `;

    console.log(data);

  } catch (error) {

    console.error("SportAdmin-fel:", error);

    calendarList.innerHTML = `
      <div class="calendar-loading error">
        Direktkoppling till SportAdmin blockeras av webbläsaren.
      </div>
    `;

  }

}
