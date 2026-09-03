function canManageTeamPosts(role) {
  return role === "coach" || role === "admin";
}

function validateTeamPost(title, body) {
  const cleanTitle = (title || "").trim();
  const cleanBody = (body || "").trim();
  if (!cleanTitle) return { valid: false, message: "Skriv en rubrik." };
  if (!cleanBody) return { valid: false, message: "Skriv ett meddelande." };
  return { valid: true, title: cleanTitle, body: cleanBody };
}

function formatTeamPostDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("sv-SE", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Stockholm"
  }).format(date);
}

function escapeTeamPostText(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderTeamPosts(posts) {
  const page = document.getElementById("teamPage");
  if (!page) return;
  let list = document.getElementById("teamPostsList");
  if (!list) {
    list = document.createElement("div");
    list.id = "teamPostsList";
    list.className = "team-posts-list";
    page.querySelectorAll(".team-post").forEach(function (card) { card.remove(); });
    page.appendChild(list);
  }

  if (!posts || !posts.length) {
    list.innerHTML = '<section class="card team-post"><p>Inga laginlägg ännu.</p></section>';
    return;
  }

  list.innerHTML = posts.map(function (post) {
    return `<section class="card team-post">
      <div class="post-header"><strong>KRONÄNGS IF JUNIORLAG</strong><span>${escapeTeamPostText(formatTeamPostDate(post.created_at))}</span></div>
      <h3>${escapeTeamPostText(post.title)}</h3>
      <p>${escapeTeamPostText(post.body).replace(/\n/g, "<br>")}</p>
    </section>`;
  }).join("");
}

function renderTeamPostComposer(profile) {
  const page = document.getElementById("teamPage");
  if (!page || !canManageTeamPosts(profile && profile.role) || document.getElementById("teamPostComposer")) return;

  const composer = document.createElement("section");
  composer.id = "teamPostComposer";
  composer.className = "card team-post-composer";
  composer.innerHTML = `
    <button type="button" id="openTeamPostComposer">+ NYTT INLÄGG</button>
    <div id="teamPostForm" hidden>
      <label for="teamPostTitle">Rubrik</label>
      <input id="teamPostTitle" maxlength="120" placeholder="Rubrik...">
      <label for="teamPostBody">Meddelande</label>
      <textarea id="teamPostBody" rows="5" maxlength="3000" placeholder="Skriv lagets information..."></textarea>
      <div class="team-post-form-actions">
        <button type="button" id="saveTeamPost">PUBLICERA</button>
        <button type="button" id="cancelTeamPost">AVBRYT</button>
      </div>
      <p id="teamPostMessage"></p>
    </div>`;

  const heading = page.querySelector(".page-heading");
  if (heading) heading.insertAdjacentElement("afterend", composer);
  else page.prepend(composer);

  const form = composer.querySelector("#teamPostForm");
  composer.querySelector("#openTeamPostComposer").addEventListener("click", function () { form.hidden = false; });
  composer.querySelector("#cancelTeamPost").addEventListener("click", function () { form.hidden = true; });
  composer.querySelector("#saveTeamPost").addEventListener("click", async function () {
    const button = this;
    const message = composer.querySelector("#teamPostMessage");
    const validation = validateTeamPost(composer.querySelector("#teamPostTitle").value, composer.querySelector("#teamPostBody").value);
    if (!validation.valid) { message.textContent = validation.message; return; }

    button.disabled = true;
    button.textContent = "PUBLICERAR...";
    message.textContent = "";
    const { error } = await window.kronangSupabase.from("team_posts").insert({
      team: profile.team,
      title: validation.title,
      body: validation.body,
      created_by: profile.id
    });
    if (error) {
      console.error("Kunde inte publicera laginlägg:", error);
      message.textContent = "Det gick inte att publicera inlägget.";
    } else {
      composer.querySelector("#teamPostTitle").value = "";
      composer.querySelector("#teamPostBody").value = "";
      form.hidden = true;
      await loadTeamPosts(profile);
    }
    button.disabled = false;
    button.textContent = "PUBLICERA";
  });
}

async function loadTeamPosts(profile) {
  if (!window.kronangSupabase || !profile || !profile.team) return;
  const { data, error } = await window.kronangSupabase
    .from("team_posts")
    .select("id, title, body, created_at")
    .eq("team", profile.team)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Kunde inte hämta laginlägg:", error);
    return;
  }
  renderTeamPosts(data || []);
}

async function setupTeamPosts() {
  if (!window.kronangSupabase) return;
  const { data: sessionData } = await window.kronangSupabase.auth.getSession();
  if (!sessionData.session || !sessionData.session.user) return;
  const user = sessionData.session.user;
  const { data: profile, error } = await window.kronangSupabase
    .from("profiles")
    .select("id, full_name, role, team")
    .eq("id", user.id)
    .maybeSingle();
  if (error || !profile) {
    if (error) console.error("Kunde inte hämta profil för laginlägg:", error);
    return;
  }
  renderTeamPostComposer(profile);
  loadTeamPosts(profile);
}

function waitForTeamPosts() {
  if (window.kronangSupabase) { setupTeamPosts(); return; }
  setTimeout(waitForTeamPosts, 100);
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { canManageTeamPosts, validateTeamPost, formatTeamPostDate };
}

if (typeof window !== "undefined" && typeof document !== "undefined") {
  waitForTeamPosts();
}
