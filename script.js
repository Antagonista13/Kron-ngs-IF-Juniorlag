const navItems = document.querySelectorAll(".nav-item");
const pages = document.querySelectorAll(".page");

navItems.forEach((item) => {

  item.addEventListener("click", () => {

    const pageId = item.dataset.page;

    pages.forEach((page) => {
      page.classList.remove("active");
    });

    document.getElementById(pageId).classList.add("active");

    navItems.forEach((nav) => {
      nav.classList.remove("active");
    });

    item.classList.add("active");

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

  });

});


const challengeButton = document.getElementById("challengeButton");

if (challengeButton) {

  challengeButton.addEventListener("click", () => {

    challengeButton.textContent = "UTMANING KLAR! 🔥";

    challengeButton.style.background = "#333";

  });

}


/* =========================
   SPORTADMIN KALENDER
========================= */

const sportAdminUrl =
  "https://portalweb.sportadmin.se/webcal?id=0d53fe29-f39f-461d-bbd9-f376c64bc7f1";


async function loadSportAdminCalendar() {

  const calendarList = document.getElementById("calendarList");

  try {

    calendarList.innerHTML = `
      <div class="calendar-loading">
        Hämtar aktiviteter från SportAdmin...
      </div>
    `;

    const response = await fetch(sportAdminUrl);

    if (!response.ok) {
      throw new Error("Kunde inte hämta kalendern");
    }

    const calendarData = await response.text();

    console.log(calendarData);

    calendarList.innerHTML = `
      <div class="calendar-loading">
        Kalendern hämtades! 🔥
      </div>
    `;

  } catch (error) {

    console.error(error);

    calendarList.innerHTML = `
      <div class="calendar-loading error">
        Kunde inte hämta kalendern direkt från SportAdmin.
      </div>
    `;

  }

}


/* LADDA KALENDERN NÄR MAN ÖPPNAR SIDAN */

document
  .querySelector('[data-page="calendarPage"]')
  .addEventListener("click", loadSportAdminCalendar);

const sportAdminUrl =
  "https://portalweb.sportadmin.se/webcal?id=0d53fe29-f39f-461d-bbd9-f376c64bc7f1";
