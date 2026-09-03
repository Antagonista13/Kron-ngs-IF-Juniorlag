function setupKronangCoach() {
  if (!window.kronangSupabase) return;
  window.kronangSupabase.auth.getSession().then(async function ({ data }) {
    if (!data.session || !data.session.user) return;
    const user = data.session.user;
    const { data: profile, error: profileError } = await window.kronangSupabase.from("profiles").select("full_name, role, team").eq("id", user.id).maybeSingle();
    if (profileError || !profile || profile.role !== "coach") return;
    const developmentPage = document.getElementById("developmentPage");
    if (!developmentPage || document.getElementById("coachDevelopmentView")) return;
    const coachView = document.createElement("section");
    coachView.id = "coachDevelopmentView"; coachView.className = "card";
    coachView.innerHTML = `<h2>Coachläge</h2><p>Välj en spelare för att se och bedöma utvecklingen.</p><div id="coachPlayerList"><p>Spelare hämtas...</p></div><div id="coachPlayerDevelopment"></div>`;
    developmentPage.appendChild(coachView);
    const playerList = document.getElementById("coachPlayerList");
    const developmentContainer = document.getElementById("coachPlayerDevelopment");
    const { data: players, error: playersError } = await window.kronangSupabase.from("profiles").select("id, full_name").eq("role", "player").eq("team", "Kronängs IF Juniorlag").order("full_name", { ascending: true });
    if (playersError) { playerList.innerHTML = "<p>Spelarna kunde inte hämtas.</p>"; return; }
    if (!players || players.length === 0) { playerList.innerHTML = "<p>Inga spelare hittades.</p>"; return; }
    playerList.innerHTML = "";
    players.forEach(function (player) { const button = document.createElement("button"); button.type="button"; button.className="coach-player-button"; button.dataset.playerId=player.id; button.textContent=player.full_name || "Namnlös spelare"; playerList.appendChild(button); });
    playerList.addEventListener("click", async function (event) {
      const button = event.target.closest(".coach-player-button"); if (!button) return;
      const playerId = button.dataset.playerId; developmentContainer.innerHTML = "<p>Hämtar spelarens utveckling...</p>";
      const { data: player, error: playerError } = await window.kronangSupabase.from("profiles").select("full_name").eq("id", playerId).maybeSingle();
      if (playerError || !player) { developmentContainer.innerHTML="<p>Spelaren kunde inte hämtas.</p>"; return; }
      const { data: assessment, error: assessmentError } = await window.kronangSupabase.from("development_assessments").select("*").eq("player_id", playerId).order("created_at", { ascending:false }).limit(1).maybeSingle();
      if (assessmentError) { developmentContainer.innerHTML="<p>Utvecklingsdata kunde inte hämtas.</p>"; return; }
      if (!assessment) { developmentContainer.innerHTML=`<hr><p>Det finns ingen utvecklingsbedömning ännu.</p>`; return; }
      const areas=[
        {title:"Teknik",selfField:"technique_self",reflectionField:"technique_reflection",coachField:"technique_coach",commentField:"technique_coach_comment"},
        {title:"Spelförståelse",selfField:"game_understanding_self",reflectionField:"game_understanding_reflection",coachField:"game_understanding_coach",commentField:"game_understanding_coach_comment"},
        {title:"Fys",selfField:"physical_self",reflectionField:"physical_reflection",coachField:"physical_coach",commentField:"physical_coach_comment"},
        {title:"Mentalitet",selfField:"mentality_self",reflectionField:"mentality_reflection",coachField:"mentality_coach",commentField:"mentality_coach_comment"}
      ];
      function stars(value){ if(value===null||value===undefined)return "☆☆☆☆☆"; return "★".repeat(value)+"☆".repeat(5-value); }
      let html=`<hr><p><strong>Spelarens självskattning</strong></p>`;
      areas.forEach(function(area,index){ html+=`<div class="coach-development-area"><h4>${area.title}</h4><p><strong>Spelarens skattning:</strong> ${stars(assessment[area.selfField])}</p><p><strong>Spelarens reflektion:</strong><br>${assessment[area.reflectionField]||"Ingen reflektion."}</p><p><strong>Din bedömning:</strong></p><div class="coach-rating-stars">${[1,2,3,4,5].map(function(rating){return `<button type="button" class="coach-rating-star" data-area="${index}" data-rating="${rating}">${assessment[area.coachField]&&rating<=assessment[area.coachField]?"★":"☆"}</button>`;}).join("")}</div><textarea class="coach-comment" data-area="${index}" rows="3" placeholder="Skriv din kommentar...">${assessment[area.commentField]||""}</textarea></div>`; });
      html+=`<button id="saveCoachAssessment" type="button">SPARA TRÄNARBEDÖMNING</button><p id="coachSaveMessage"></p>`; developmentContainer.innerHTML=html;
      const coachRatings=areas.map(a=>assessment[a.coachField]||null); const coachComments=areas.map(a=>assessment[a.commentField]||"");
      developmentContainer.addEventListener("click",async function(clickEvent){ const star=clickEvent.target.closest(".coach-rating-star"); if(star){const areaIndex=Number(star.dataset.area),rating=Number(star.dataset.rating); coachRatings[areaIndex]=rating; developmentContainer.querySelectorAll(`.coach-rating-star[data-area="${areaIndex}"]`).forEach(function(item){item.textContent=Number(item.dataset.rating)<=rating?"★":"☆";}); return;} const saveButton=clickEvent.target.closest("#saveCoachAssessment"); if(!saveButton)return; const message=document.getElementById("coachSaveMessage"); if(coachRatings.some(r=>r===null)){message.textContent="Välj en nivå 1–5 för alla fyra områden.";return;} saveButton.disabled=true;saveButton.textContent="SPARAR..."; const {error}=await window.kronangSupabase.rpc("save_coach_assessment",{p_player_id:playerId,p_technique_coach:coachRatings[0],p_technique_coach_comment:coachComments[0],p_game_understanding_coach:coachRatings[1],p_game_understanding_coach_comment:coachComments[1],p_physical_coach:coachRatings[2],p_physical_coach_comment:coachComments[2],p_mentality_coach:coachRatings[3],p_mentality_coach_comment:coachComments[3]}); message.textContent=error?"Det gick inte att spara.":"Tränarbedömningen är sparad.";saveButton.disabled=false;saveButton.textContent="SPARA TRÄNARBEDÖMNING"; });
      developmentContainer.addEventListener("input",function(inputEvent){const textarea=inputEvent.target.closest(".coach-comment");if(!textarea)return;coachComments[Number(textarea.dataset.area)]=textarea.value;});
    });
  });
}
function waitForKronangCoach(){if(window.kronangSupabase){setupKronangCoach();return;}setTimeout(waitForKronangCoach,100);} waitForKronangCoach();
