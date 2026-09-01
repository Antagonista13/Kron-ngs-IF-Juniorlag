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
