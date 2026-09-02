function buildCoachFocusCommentRequest(focusId, comment) {
  return {
    p_focus_id: focusId,
    p_comment: (comment || "").trim()
  };
}

function buildCoachFocusStatusRequest(focusId, status) {
  const allowed = ["following_up", "follow_up_complete"];
  return {
    p_focus_id: focusId,
    p_follow_up_status: allowed.includes(status) ? status : ""
  };
}

function setupCoachFocusFeedback() {
  if (!window.kronangSupabase) return false;

  const playerList = document.getElementById("coachPlayerList");
  const developmentContainer = document.getElementById("coachPlayerDevelopment");
  if (!playerList || !developmentContainer) return false;

  let selectedPlayerId = null;
  let activeFocus = null;

  async function loadFocus(playerId) {
    selectedPlayerId = playerId;
    activeFocus = null;

    const { data, error } = await window.kronangSupabase
      .from("development_focuses")
      .select("id, follow_up_status")
      .eq("player_id", playerId)
      .eq("lifecycle_status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Kunde inte hämta fokus för tränaråterkoppling:", error);
      return;
    }

    activeFocus = data || null;
    renderControls();
  }

  function renderControls() {
    const context = developmentContainer.querySelector("#coachPlayerContext");
    if (!context || context.querySelector("#coachFocusFeedbackControls")) return;

    const section = document.createElement("div");
    section.id = "coachFocusFeedbackControls";

    const heading = document.createElement("h4");
    heading.textContent = "Tränarens återkoppling på fokus";
    section.appendChild(heading);

    if (!activeFocus) {
      const empty = document.createElement("p");
      empty.textContent = "Spelaren har inget aktivt fokus att följa upp.";
      section.appendChild(empty);
      context.appendChild(section);
      return;
    }

    const textarea = document.createElement("textarea");
    const saveComment = document.createElement("button");
    const followingUp = document.createElement("button");
    const complete = document.createElement("button");
    const message = document.createElement("p");

    textarea.rows = 3;
    textarea.maxLength = 2000;
    textarea.placeholder = "Skriv en kommentar till spelarens fokus...";
    textarea.setAttribute("aria-label", "Tränarens fokuskommentar");

    saveComment.type = "button";
    saveComment.textContent = "SPARA KOMMENTAR";
    followingUp.type = "button";
    followingUp.textContent = "FÖLJS UPP";
    complete.type = "button";
    complete.textContent = "UPPFÖLJNING KLAR";

    function setBusy(busy) {
      textarea.disabled = busy;
      saveComment.disabled = busy;
      followingUp.disabled = busy;
      complete.disabled = busy;
    }

    saveComment.addEventListener("click", async function () {
      const request = buildCoachFocusCommentRequest(activeFocus.id, textarea.value);
      if (!request.p_comment) {
        message.textContent = "Skriv en kommentar först.";
        textarea.focus();
        return;
      }

      setBusy(true);
      const { error } = await window.kronangSupabase.rpc("add_coach_focus_comment", request);
      if (error) {
        console.error("Kunde inte spara fokuskommentaren:", error);
        message.textContent = "Kommentaren kunde inte sparas.";
        setBusy(false);
        return;
      }

      textarea.value = "";
      message.textContent = "Kommentaren är sparad.";
      setBusy(false);
    });

    async function updateStatus(status) {
      const request = buildCoachFocusStatusRequest(activeFocus.id, status);
      if (!request.p_follow_up_status) return;

      setBusy(true);
      const { data, error } = await window.kronangSupabase.rpc("set_coach_focus_follow_up_status", request);
      if (error) {
        console.error("Kunde inte uppdatera fokusstatus:", error);
        message.textContent = "Status kunde inte uppdateras.";
        setBusy(false);
        return;
      }

      activeFocus.follow_up_status = status;
      message.textContent = status === "following_up"
        ? "Fokuset är markerat som Följs upp."
        : "Fokuset är markerat som Uppföljning klar.";

      const statusText = context.querySelector("[data-coach-focus-status]");
      if (statusText) {
        statusText.textContent = status === "following_up" ? "Status: Följs upp" : "Status: Uppföljning klar";
      }
      setBusy(false);
    }

    followingUp.addEventListener("click", function () { updateStatus("following_up"); });
    complete.addEventListener("click", function () { updateStatus("follow_up_complete"); });

    section.appendChild(textarea);
    section.appendChild(document.createElement("br"));
    section.appendChild(saveComment);
    section.appendChild(document.createTextNode(" "));
    section.appendChild(followingUp);
    section.appendChild(document.createTextNode(" "));
    section.appendChild(complete);
    section.appendChild(message);
    context.appendChild(section);
  }

  playerList.addEventListener("click", function (event) {
    const button = event.target.closest(".coach-player-button");
    if (!button) return;
    loadFocus(button.dataset.playerId);
  });

  const observer = new MutationObserver(function () {
    if (selectedPlayerId && activeFocus) renderControls();
  });
  observer.observe(developmentContainer, { childList: true, subtree: true });

  return true;
}

function waitForCoachFocusFeedback() {
  if (setupCoachFocusFeedback()) return;
  setTimeout(waitForCoachFocusFeedback, 100);
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { buildCoachFocusCommentRequest, buildCoachFocusStatusRequest };
}

if (typeof window !== "undefined" && typeof document !== "undefined") {
  waitForCoachFocusFeedback();
}
