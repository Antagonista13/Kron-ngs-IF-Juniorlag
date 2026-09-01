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
