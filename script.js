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
    "https://kronangs-kalender.h-bergqvist.workers.dev/";

  try {
    const response = await fetch(sportAdminUrl);

    if (!response.ok) {
      throw new Error("SportAdmin svarade med fel");
    }

    const icsText = await response.text();

    // Hantera radbrytningar i ICS-filen
    const cleanedIcs = icsText.replace(/\r?\n[ \t]/g, "");

    // Hitta alla kalenderhändelser
    const eventBlocks = cleanedIcs.match(
      /BEGIN:VEVENT[\s\S]*?END:VEVENT/g
    ) || [];

    const activities = eventBlocks.map(eventBlock => {

      function getValue(field) {
        const regex = new RegExp(
          "^" + field + "[^:]*:(.*)$",
          "m"
        );

        const match = eventBlock.match(regex);

        if (!match) return "";

        return match[1]
          .replace(/\\n/g, " ")
          .replace(/\\,/g, ",")
          .replace(/\\;/g, ";")
          .trim();
      }

      const dateValue = getValue("DTSTART");
      const summary = getValue("SUMMARY");
      const location = getValue("LOCATION");
      const description = getValue("DESCRIPTION");

      let date;

      if (/^\d{8}$/.test(dateValue)) {
        // Heldagshändelse
        const year = dateValue.substring(0, 4);
        const month = dateValue.substring(4, 6);
        const day = dateValue.substring(6, 8);

        date = new Date(`${year}-${month}-${day}T00:00:00`);

      } else if (/^\d{8}T\d{6}Z$/.test(dateValue)) {
        // UTC-tid
        const year = dateValue.substring(0, 4);
        const month = dateValue.substring(4, 6);
        const day = dateValue.substring(6, 8);
        const hour = dateValue.substring(9, 11);
        const minute = dateValue.substring(11, 13);
        const second = dateValue.substring(13, 15);

        date = new Date(
          `${year}-${month}-${day}T${hour}:${minute}:${second}Z`
        );

      } else if (/^\d{8}T\d{6}$/.test(dateValue)) {
        // Lokal tid
        const year = dateValue.substring(0, 4);
        const month = dateValue.substring(4, 6);
        const day = dateValue.substring(6, 8);
        const hour = dateValue.substring(9, 11);
        const minute = dateValue.substring(11, 13);
        const second = dateValue.substring(13, 15);

        date = new Date(
          `${year}-${month}-${day}T${hour}:${minute}:${second}`
        );
      }

      return {
        date,
        summary,
        location,
        description
      };
    });

    // Ta bort gamla eller trasiga aktiviteter
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingActivities = activities
      .filter(activity =>
        activity.date &&
        !isNaN(activity.date) &&
        activity.date >= today
      )
      .sort((a, b) => a.date - b.date)
      .slice(0, 10);

    if (upcomingActivities.length === 0) {
      calendarList.innerHTML = `
        <div class="calendar-loading">
          Inga kommande aktiviteter hittades.
        </div>
      `;
      return;
    }

    // Skapa kalenderlistan
    calendarList.innerHTML = upcomingActivities
      .map(activity => {

        const dateText = activity.date.toLocaleDateString(
          "sv-SE",
          {
            weekday: "short",
            day: "numeric",
            month: "short"
          }
        );

        const timeText = activity.date.toLocaleTimeString(
          "sv-SE",
          {
            hour: "2-digit",
            minute: "2-digit"
          }
        );

        return `
          <div class="calendar-event">
            <div class="calendar-date">
              ${dateText}
            </div>

            <div class="calendar-info">
              <strong>${activity.summary || "Aktivitet"}</strong>
              <div>${timeText}</div>
              ${
                activity.location
                  ? `<div>${activity.location}</div>`
                  : ""
              }
            </div>
          </div>
        `;
      })
      .join("");

  } catch (error) {

    console.error(error);

    calendarList.innerHTML = `
      <div class="calendar-loading error">
        Kunde inte läsa kalendern från SportAdmin.
      </div>
    `;
  }
}
