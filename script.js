const navItems = document.querySelectorAll(".nav-item");
const pages = document.querySelectorAll(".page");
console.log("Antal navigeringsknappar:", navItems.length);
console.log("Antal sidor:", pages.length);

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
      Hämtar aktiviteter från SportAdmin...
    </div>
  `;

  const sportAdminUrl =
    "https://kronangs-kalender.h-bergqvist.workers.dev/";

  try {

    const response = await fetch(sportAdminUrl);

    if (!response.ok) {
      throw new Error("Kunde inte hämta kalendern");
    }

    const icsText = await response.text();

    // Dela upp kalendern i enskilda aktiviteter
    const events = icsText.match(
      /BEGIN:VEVENT[\s\S]*?END:VEVENT/g
    ) || [];

    const activities = events.map(function(event) {

      // Hämtar ett värde från en kalenderhändelse
      function getValue(field) {

        const regex = new RegExp(
          "^" + field + "[^:]*:(.*)$",
          "m"
        );

        const match = event.match(regex);

        return match ? match[1].trim() : "";
      }


      const start = getValue("DTSTART");
      const summary = getValue("SUMMARY");
      const location = getValue("LOCATION");
      const description = getValue("DESCRIPTION");


      let date = null;

      // SportAdmin-format:
      // 20260905T110000

      const dateMatch = start.match(
        /(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})/
      );

      if (dateMatch) {

        date = new Date(
          Number(dateMatch[1]),
          Number(dateMatch[2]) - 1,
          Number(dateMatch[3]),
          Number(dateMatch[4]),
          Number(dateMatch[5])
        );

      }


      return {
        date: date,
        summary: summary,
        location: location,
        description: description
      };

    });


    // Dagens datum
    const today = new Date();

    today.setHours(0, 0, 0, 0);


    // Filtrera bort gamla aktiviteter
    const upcomingActivities = activities
      .filter(function(activity) {

        return activity.date &&
          activity.date >= today;

      })
      .sort(function(a, b) {

        return a.date - b.date;

      })
      .slice(0, 10);


    if (upcomingActivities.length === 0) {

      calendarList.innerHTML = `
        <div class="calendar-loading">
          Inga kommande aktiviteter hittades.
        </div>
      `;

      return;
    }


   // =====================================
// HJÄLPFUNKTION FÖR ATT SKAPA AKTIVITET
// =====================================

function createActivityCard(activity, isNext = false) {

  const dateText =
    activity.date.toLocaleDateString(
      "sv-SE",
      {
        weekday: "long",
        day: "numeric",
        month: "long"
      }
    );


  const timeText =
    activity.date.toLocaleTimeString(
      "sv-SE",
      {
        hour: "2-digit",
        minute: "2-digit"
      }
    );


  // Identifiera typ av aktivitet
  const title = activity.summary || "Aktivitet";

  let activityType = "ÖVRIGT";
  let activityIcon = "📋";
  let typeClass = "other";


  if (title.toLowerCase().includes("match")) {

    activityType = "MATCH";
    activityIcon = "⚽";
    typeClass = "match";

  }

  else if (title.toLowerCase().includes("träning")) {

    activityType = "TRÄNING";
    activityIcon = "🏃";
    typeClass = "training";

  }


  // Försök hitta samlingstid
  let meetingTime = "";

  const meetingMatch =
    activity.description.match(
      /Samling:\s*([0-9]{1,2}:[0-9]{2})/i
    );


  if (meetingMatch) {

    meetingTime = meetingMatch[1];

  }


  // Rensa matchtiteln
  let displayTitle = title;

  if (activityType === "MATCH") {

    displayTitle = title
      .replace(/^Match:\s*/i, "")
      .replace(/\s*\([^)]*\)\s*$/, "");

  }


  return `

    <div class="calendar-card ${typeClass} ${isNext ? "next-activity" : ""}">

      ${
        isNext
          ? `
            <div class="next-activity-label">
              ⭐ NÄSTA AKTIVITET
            </div>
          `
          : ""
      }

      <div class="calendar-card-date">

        ${dateText.toUpperCase()}

      </div>


      <div class="calendar-card-type">

        <span>${activityIcon}</span>
        ${activityType}

      </div>


      <div class="calendar-card-title">

        ${displayTitle}

      </div>


      <div class="calendar-card-details">

        <div>
          🕒 ${timeText}
        </div>


        ${
          meetingTime
            ? `
              <div>
                👥 Samling: ${meetingTime}
              </div>
            `
            : ""
        }


        ${
          activity.location
            ? `
              <div>
                📍 ${activity.location}
              </div>
            `
            : ""
        }

      </div>

    </div>

  `;

}


// =====================================
// VISA NÄSTA AKTIVITET
// =====================================

const nextActivity = upcomingActivities[0];


// =====================================
// ÖVRIGA KOMMANDE AKTIVITETER
// =====================================

const remainingActivities =
  upcomingActivities.slice(1);


let calendarHTML = "";


// Nästa aktivitet

if (nextActivity) {

  calendarHTML += createActivityCard(
    nextActivity,
    true
  );

}


// Rubrik för resterande aktiviteter

if (remainingActivities.length > 0) {

  calendarHTML += `

    <div class="calendar-section-title">

      KOMMANDE AKTIVITETER

    </div>

  `;

}


// Övriga aktiviteter

calendarHTML += remainingActivities
  .map(function(activity) {

    return createActivityCard(activity);

  })
  .join("");


// Lägg in allt på sidan

calendarList.innerHTML = calendarHTML;

  } catch (error) {

    console.error(error);

    calendarList.innerHTML = `
      <div class="calendar-loading error">
        Kunde inte läsa kalendern från SportAdmin.
      </div>
    `;

  }

}
/* =========================
   NÄSTA AKTIVITET - STARTSIDA
========================= */

async function loadNextActivityHome() {

  const homeActivity =
    document.getElementById("nextActivityHome");

  if (!homeActivity) return;


  const sportAdminUrl =
    "https://kronangs-kalender.h-bergqvist.workers.dev/";


  try {

    const response =
      await fetch(sportAdminUrl);

    if (!response.ok) {
      throw new Error("Kunde inte hämta kalendern");
    }

    const icsText = await response.text();

    const events =
      icsText.match(
        /BEGIN:VEVENT[\s\S]*?END:VEVENT/g
      ) || [];


    const activities = events.map(function(event) {

      function getValue(field) {

        const regex = new RegExp(
          "^" + field + "[^:]*:(.*)$",
          "m"
        );

        const match = event.match(regex);

        return match
          ? match[1].trim()
          : "";

      }


      const start =
        getValue("DTSTART");

      const summary =
        getValue("SUMMARY");

      const location =
        getValue("LOCATION");


      let date = null;

      const dateMatch =
        start.match(
          /(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})/
        );


      if (dateMatch) {

        date = new Date(
          Number(dateMatch[1]),
          Number(dateMatch[2]) - 1,
          Number(dateMatch[3]),
          Number(dateMatch[4]),
          Number(dateMatch[5])
        );

      }


      return {
        date: date,
        summary: summary,
        location: location
      };

    });


    const today = new Date();

    today.setHours(
      0,
      0,
      0,
      0
    );


    const upcomingActivities =
      activities
        .filter(function(activity) {

          return (
            activity.date &&
            activity.date >= today
          );

        })
        .sort(function(a, b) {

          return a.date - b.date;

        });


    const nextActivity =
      upcomingActivities[0];


    if (!nextActivity) {

      homeActivity.innerHTML = `
        <strong>
          Ingen kommande aktivitet
        </strong>

        <p>
          Kalendern uppdateras automatiskt.
        </p>
      `;

      return;

    }


    const dateText =
      nextActivity.date.toLocaleDateString(
        "sv-SE",
        {
          weekday: "long",
          day: "numeric",
          month: "long"
        }
      );


    const timeText =
      nextActivity.date.toLocaleTimeString(
        "sv-SE",
        {
          hour: "2-digit",
          minute: "2-digit"
        }
      );


    let title =
  nextActivity.summary ||
  "Aktivitet";


let activityType = "AKTIVITET";
let activityIcon = "📅";


if (title.toLowerCase().includes("match")) {

  activityType = "MATCH";
  activityIcon = "⚽";

}

else if (title.toLowerCase().includes("träning")) {

  activityType = "TRÄNING";
  activityIcon = "🏃";

}

else if (title.toLowerCase().includes("domar")) {

  activityType = "UPPDRAG";
  activityIcon = "🟨";

}

else if (
  title.toLowerCase().includes("arrangör") ||
  title.toLowerCase().includes("arrangor")
) {

  activityType = "ARRANGEMANG";
  activityIcon = "📋";

}


// Rensa bort "Match:" från matchtitlar

title = title.replace(
  /^Match:\s*/i,
  ""
);


    homeActivity.innerHTML = `

  <div class="activity-icon">
    ${activityIcon}
  </div>

  <div class="next-activity-info">

    <div class="next-activity-type">
      ${activityType}
    </div>

    <strong>
      ${title}
    </strong>

    <p>
      ${dateText} · ${timeText}
    </p>

    ${
      nextActivity.location
        ? `
          <div class="activity-location">
            📍 ${nextActivity.location}
          </div>
        `
        : ""
    }

  </div>

`;


  } catch (error) {

    console.error(
      "Fel vid hämtning av nästa aktivitet:",
      error
    );


   homeActivity.innerHTML =
  "<strong>Kalendern kunde inte laddas</strong>" +
  "<p>Försök igen senare.</p>";

  }

}


/* =========================
   STARTA STARTSIDANS KALENDER
========================= */

loadNextActivityHome();
/* =========================
   SUPABASE - SENASTE NYTT
========================= */

/* =========================
   SUPABASE - SENASTE NYTT
========================= */

const SUPABASE_URL = "https://ndbwnsiqcnxppikdrwvd.supabase.co";

const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kYnduc2lxY254cHBpa2Ryd3ZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNjIwNTIsImV4cCI6MjEwMzgzODA1Mn0.ohJ9vdvgBXIGMsmH3wCiK7n0-PDWGp_Mt895UDTQoxA";

async function loadLatestNews() {

  const newsContainer =
    document.getElementById("latestNews");

  if (!newsContainer) return;

  try {

    const response = await fetch(
  SUPABASE_URL +
  "/rest/v1/news?select=*&order=id.desc&limit=1",
  {
    headers: {
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": "Bearer " + SUPABASE_ANON_KEY
    }
  }
);

    if (!response.ok) {
      throw new Error("Kunde inte hämta nyheter");
    }

    const news = await response.json();

    console.log("Nyhetsdata:", news);

    if (news.length === 0) {

      newsContainer.innerHTML = `
        <strong>Inga nyheter ännu</strong>
        <p>Här kommer information från laget.</p>
      `;

      return;
    }

    const latest = news[0];

    newsContainer.innerHTML = `
      <div class="news-date">
        SENAST
      </div>

      <strong>${latest.title}</strong>

      <p>${latest.content}</p>
    `;

  } catch (error) {

    console.error("Nyhetsfel:", error);

    newsContainer.innerHTML = `
      <strong>Kunde inte hämta senaste nytt</strong>
      <p>Försök igen senare.</p>
    `;

  }

}

/* Ladda senaste nyheten när sidan öppnas */
loadLatestNews();
/* =========================
   NAVIGERING MELLAN SIDOR
========================= */

const pages = document.querySelectorAll(".page");

navItems.forEach((item) => {
    item.addEventListener("click", () => {

        const pageId = item.dataset.page;

        // Ta bort aktiv markering från alla knappar
        navItems.forEach((nav) => {
            nav.classList.remove("active");
        });

        // Markera den klickade knappen
        item.classList.add("active");

        // Dölj alla sidor
        pages.forEach((page) => {
            page.classList.remove("active");
        });

        // Visa rätt sida
        const selectedPage = document.getElementById(pageId);

        if (selectedPage) {
            selectedPage.classList.add("active");
        }
    });
});
