# Implementeringsplan: Spelarens mål + Mitt fokus

> **Status:** Godkänd långsiktig implementeringsplan. Implementation ska ske i små, testbara etapper. Första byggsteget begränsas till spelarens huvudmål.

## Nuläge och tekniska utgångspunkter

Appen är en vanilla-JavaScript-applikation med fem huvudvyer i samma HTML-fil. Utvecklingsvyn har fyra befintliga områden: Teknik, Spelförståelse, Fys och Mentalitet. Befintlig navigation ska inte byggas om för mål och fokus.

Befintlig utvecklingskod hämtar inloggad profil, senaste posten från `development_assessments`, renderar självskattning/reflektion/tränarbedömning/tränarkommentar och sparar självskattning via `save_player_self_assessment`. Tränarbedömning sparas via `save_coach_assessment`.

Profilvyn har statiska platshållare för mål och fokus. Dessa är naturliga integrationspunkter för sammanfattning, medan redigeringsflödet ska ligga under Utveckling.

Befintlig auth, logout, Hem, kalender, navigation, `development_assessments`, självskattning och tränarbedömning ska skyddas mot regression.

---

## 1. Huvudmål

En spelare får ha högst ett aktivt huvudmål. Målet:

- formuleras och ägs av spelaren
- har kort rubrik och tydligare beskrivning
- kan kompletteras med flera delmål
- kan ändras utan att tidigare versioner försvinner
- kan avslutas av spelaren utan tränargodkännande
- kräver slutreflektion före avslut
- finns kvar i historiken efter avslut

Tränaren får läsa och kommentera målet men får inte ändra måltexten, skapa målet åt spelaren, godkänna det eller hindra avslut.

### Spelarflöde

1. Utveckling visar **Du har inget mål ännu** och **SKAPA MITT MÅL** när aktivt mål saknas.
2. Formuläret frågar:
   - **Vad vill du utveckla?** – obligatorisk kort rubrik
   - **Vad betyder målet för dig?** – obligatorisk beskrivning
   - **Hur märker du att du har kommit framåt?** – valfri konkretisering
3. Efter sparande visas målkortet direkt.
4. Spelaren kan redigera måltext, hantera delmål, läsa feedback och avsluta mål.
5. Ingen ranking, prestationspoäng, streak eller jämförelse med andra spelare.

### Tillstånd

- `active` – aktuellt huvudmål
- `completed` – avslutat som uppnått
- `replaced` – historiskt mål som ersatts

`abandoned` införs inte i första implementationen.

---

## 2. Delmål

Spelaren kan lägga till, redigera, klarmarkera, återöppna och ta bort delmål. ”Ta bort” ska tekniskt vara arkivering, inte fysisk DELETE, så historiken bevaras.

Progression visas som exempelvis **2 av 4 delmål klara**. Om delmål saknas visas **Inga delmål ännu**. Ett huvudmål får avslutas även om alla delmål inte är klara.

---

## 3. Målhistorik

Historiken ska vara append-only ur användarens perspektiv. Ett avslutat mål får aldrig försvinna.

Historik ska omfatta:

- ursprunglig måltext och senare revisioner
- skapande- och ändringstid
- delmålshändelser
- slutreflektion
- avslutstid
- tränarfeedback och förslag
- aktör och servergenererad tidpunkt

Historikvyn visar aktuellt mål och tidigare mål, nyast först. Historiska mål kan expanderas för måltext, delmål, slutreflektion, tränarfeedback och enkel händelselogg. Ingen historik får raderas från klienten.

---

## 4. Obligatorisk slutreflektion och MÅL UPPNÅTT!

När spelaren väljer **AVSLUTA MÅL** visas ett separat bekräftelsesteg med aktuell måltext och delmålsstatus.

Obligatoriskt fält:

**Vad har du lärt dig och vad gjorde att du nådde målet?**

Reflektionen trimmas och valideras på servern, får inte vara tom och ska ha rimlig maxlängd. Knappen **BEKRÄFTA ATT MÅLET ÄR UPPNÅTT** är inaktiv tills text finns.

Efter lyckad atomär databastransaktion visas tydligt:

# MÅL UPPNÅTT!

Bekräftelsen erbjuder **VISA MÅLHISTORIK** och **STÄNG**, men tvingar inte fram ett nytt mål. Ingen konfetti, ranking eller poäng.

---

## 5. Tränarens återkoppling och förslag

Behörig tränare får läsa aktuella och avslutade mål, slutreflektion och lämna append-only-feedback. Feedback kan vara kommentar, beröm, instämmande, annan bedömning eller förslag.

Tränaren får inte skapa eller redigera spelarens huvudmål, ändra/klarmarkera delmål, avsluta/återöppna mål, kräva godkännande eller blockera avslut.

Ett delmålsförslag från tränaren lagras som förslag. Spelaren kan **LÄGG TILL SOM DELMÅL** eller **AVFÄRDA FÖRSLAG**. Accepterat förslag skapar ett spelarägt delmål via spelarens RPC.

---

## 6. Mitt fokus

Spelaren får ha högst ett aktivt fokus, kopplat till exakt ett utvecklingsområde:

- `technique` – Teknik
- `game_understanding` – Spelförståelse
- `physical` – Fys
- `mentality` – Mentalitet

Skapa fokus:

1. välj område
2. skriv kort fokus
3. skriv valfritt vad spelaren särskilt ska tänka på
4. spara

När ett nytt fokus skapas medan ett aktivt finns ska spelaren uttryckligen bekräfta byte. Gammalt fokus avslutas och nytt skapas atomärt, så två aktiva fokus aldrig uppstår.

---

## 7. Fokusstatus

Användarsynliga uppföljningsstatusar:

- `active` – **Aktivt**
- `following_up` – **Följs upp**
- `follow_up_complete` – **Uppföljning klar**

Datamodellen ska skilja på fokusets livscykel (aktivt/avslutat) och tränarens uppföljningsstatus. **Uppföljning klar** avslutar inte spelarens fokus. Spelaren avgör när fokus byts eller avslutas.

---

## 8. Fokushistorik

Varje fokusperiod sparas som egen post. Nytt fokus skriver aldrig över tidigare fokus.

Historiken visar område, fokustext, detaljtext, start/slutdatum, statusövergångar, vem som markerade uppföljning, frivillig spelarreflektion och tränarens append-only-kommentarer.

Korrigering av skrivfel kan ske med versionsskapande RPC; verkligt byte av inriktning ska behandlas som nytt fokus.

---

## 9. Integration med Utveckling och Profil

### Utveckling

Överst på `developmentPage`, före befintlig utvecklingsgrid, monteras en separat sammanfattning med:

- aktuellt mål
- delmålsprogression
- aktuellt fokus och område
- fokusstatus
- senaste tränarfeedback
- **VISA UTVECKLINGSHISTORIK**
- åtgärdsknappar för mål och fokus

Befintlig `development.js` och `development_assessments` ska lämnas funktionellt oförändrade.

### Profil

Statiska mål-/fokusplatshållare ersätts med dynamiska sammanfattningar. Profilen visar kort mål, delmålsprogression, fokus och fokusstatus samt CTA till Utveckling.

Tomlägen:

- **Du har inget fokus ännu. + VÄLJ MITT FOKUS**
- **Du har inget mål ännu. + SKAPA MITT MÅL**

Ingen kalender eller nästa aktivitet läggs på Profil.

### Navigation

Inga nya toppnivåflikar. Profilens CTA ska återanvända befintlig navigation till Utveckling. Generell navigeringsrefaktorering görs inte i detta delprojekt.

### Tränarvy

Coachvyn kompletteras efter vald spelare med aktuellt mål/delmål, fokusstatus, historiklänkar, append-only-feedback och fokusuppföljning. Befintlig bedömningskod och `save_coach_assessment` lämnas intakta.

### Säker DOM-rendering

All spelar- och tränarskriven fritext i den nya funktionen sätts med `textContent`, inte osanerad interpolation i `innerHTML`.

---

## 10. Datamodell

Innan migration skrivs ska verkligt Supabase-schema, befintliga policies/funktioner och exakta rollvärden verifieras.

### `development_goals`

Fält: `id`, `player_id`, `team`/framtida `team_id`, `title`, `description`, `success_description`, `status`, `final_reflection`, `created_at`, `updated_at`, `completed_at`, `replaced_by_goal_id`.

Databasen ska ha ett partiellt unikt index som garanterar högst ett `active` mål per spelare. Constraints ska kräva icke-tom titel/beskrivning och slutreflektion + avslutstid för `completed`.

### `development_goal_revisions`

Append-only-versioner med `goal_id`, versionsnummer, snapshot av måltext, `changed_by`, händelsetyp/orsak och `created_at`.

### `development_subgoals`

Fält för mål, spelare, text, sorteringsordning, status (`active`, `completed`, `archived`) och tidsstämplar.

### `development_subgoal_events`

Append-only-händelser för `created`, `edited`, `completed`, `reopened`, `archived`, med snapshots och aktör.

### `development_goal_feedback`

Append-only-feedback med mål/spelare/författare, feedbacktyp, text, eventuellt delmålsförslag, förslagsstatus och tidsstämplar.

### `development_focuses`

Fält: `id`, `player_id`, lag, utvecklingsområde, fokustext, detaljtext, livscykelstatus, uppföljningsstatus, spelarreflektion, tidsstämplar och `replaced_by_focus_id`.

Databasen garanterar högst ett aktivt fokus per spelare.

### `development_focus_events`

Append-only-händelser med fokus/spelare/aktör, händelsetyp, snapshot, eventuell kommentar och tidpunkt.

### `development_focus_feedback`

Append-only tränarfeedback för fokus.

### Gemensamma principer

- UUID och tidsstämplar skapas av databasen.
- Främmande nycklar indexeras.
- Historik ska bevaras även när spelare blir inaktiva.
- Ingen ranking eller poäng.
- `development_assessments` ändras inte.
- Historiktabeller får inte UPDATE/DELETE för vanliga klientroller.

---

## 11. RLS och sekretess

Mål, delmål, fokus, reflektioner, historik och tränarkommentarer är privat utvecklingsinformation.

### Spelare

Spelaren får läsa egna privata utvecklingsdata och mutera egna mål/delmål/fokus endast genom säkra RPC:er. Spelaren får aldrig läsa annan spelares privata data eller skriva tränarfeedback.

Ägaroperationer ska härleda spelaren från `auth.uid()` och inte lita på klientangivet `player_id`.

### Behörig ledare

Ledare får bara läsa privat utveckling när användaren har explicit utvecklingsbehörig roll och tillhör samma lag som spelaren. Full adminstatus ska inte automatiskt ge tillgång till privat utveckling.

Exakta lagrade rollvärden för Huvudansvarig, Tränare och Assisterande tränare ska fastställas innan RLS implementeras.

### Anon

`anon` får ingen läs- eller skrivrättighet till nya tabeller eller privata RPC-resultat.

### Policystrategi

- RLS på alla nya tabeller.
- Begränsad SELECT för ägare och behörig ledare.
- Direkt INSERT/UPDATE/DELETE från `authenticated` återkallas där mutation ska ske via RPC.
- Historik skrivs endast via RPC.
- Privata data läggs inte i publik profil-/lagvy.
- Säkerhet testas med separata identiteter.

---

## 12. Säkra RPC-funktioner

Muterande funktioner ska vara transaktionella `security definer`-funktioner med fast `search_path`, kvalificerade tabellnamn, `auth.uid()`-kontroll, explicit roll-/lagkontroll, längd-/statusvalidering, servergenererade tider och minimala grants.

### Spelar-RPC:er

Planerade funktioner:

1. `create_my_development_goal(...)`
2. `update_my_development_goal(...)`
3. `add_my_goal_subgoal(...)`
4. `update_my_goal_subgoal(...)`
5. `set_my_goal_subgoal_completed(...)`
6. `archive_my_goal_subgoal(...)`
7. `complete_my_development_goal(...)`
8. `accept_my_goal_suggestion(...)`
9. `dismiss_my_goal_suggestion(...)`
10. `create_my_development_focus(...)`
11. `replace_my_development_focus(...)`
12. `update_my_development_focus(...)`
13. `end_my_development_focus(...)`

### Tränar-RPC:er

14. `add_goal_feedback(...)`
15. `set_focus_follow_up_status(...)`
16. `add_focus_feedback(...)`

Tränar-RPC:er ska kräva explicit utvecklingsbehörighet och samma lag och får inte ändra spelarens ägarskap eller mål/fokuslivscykel.

### Läs-RPC:er

17. `get_my_development_summary()`
18. `get_my_goal_focus_history(...)`
19. `get_player_goal_focus_for_coach(...)`

Befintliga `save_player_self_assessment` och `save_coach_assessment` ändras inte.

---

## 13. Befintliga filer som kan behöva ändras

### `index.html`

- mount-punkt för utvecklingssammanfattning före befintlig grid
- behållare/dialoger för mål/fokus och historik
- dynamiska mount-punkter på Profil
- script-taggar för nya moduler
- befintliga fem navigeringsknappar oförändrade

### `style.css`

Stilar för sammanfattning, mål/fokus, delmål, status, formulär/dialoger, historik, tränarfeedback, mobil layout och återhållsam **MÅL UPPNÅTT!**-bekräftelse. Svart/vit befintlig design återanvänds.

### `coach.js`

Kompletteras med mål/fokus för vald spelare, feedback och fokusuppföljning. Befintlig bedömningskod hålls intakt.

### `script.js`

Endast liten navigeringshjälp om den behövs. SportAdmin, Hem och kalenderhämtning lämnas orörda.

### Ska uttryckligen inte byggas om

- `development.js`
- `auth.js`
- `logout.js`
- befintlig kalender-/SportAdmin-logik
- `development_assessments`

---

## 14. Nya filer enligt långsiktig målbild

Klientkod:

- `goal-focus-api.js`
- `player-goals.js`
- `player-focus.js`
- `development-summary.js`
- `development-history.js`
- `profile-development-summary.js`
- `coach-goal-focus.js`

Föreslagen migrationsstruktur:

- `supabase/migrations/202609020001_create_goal_focus_schema.sql`
- `supabase/migrations/202609020002_goal_focus_rls.sql`
- `supabase/migrations/202609020003_goal_focus_player_rpcs.sql`
- `supabase/migrations/202609020004_goal_focus_coach_rpcs.sql`
- `supabase/migrations/202609020005_goal_focus_read_rpcs.sql`

Föreslagna SQL-tester:

- `supabase/tests/goal_focus_constraints.sql`
- `supabase/tests/goal_focus_player_rls.sql`
- `supabase/tests/goal_focus_coach_rls.sql`

Node-baserad testinfrastruktur införs bara efter separat beslut.

---

## 15. Små implementationsteg

1. Inventera verkligt Supabase-schema, policies, funktioner och exakta rollvärden.
2. Skriv behörighetsmatris.
3. Skapa måltabeller/constraints/index utan UI.
4. Testa unik aktiv målpost.
5. Skapa/testa mål-RLS.
6. Skapa spelarens första mål-RPC:er.
7. Testa race conditions och ägarskap.
8. Skapa delmåls-RPC:er och historik.
9. Skapa atomärt målavslut med obligatorisk slutreflektion.
10. Bygg säkra läs-RPC:er.
11. Bygg `goal-focus-api.js`.
12. Montera read-only målsammanfattning i Utveckling.
13. Implementera skapa/redigera mål.
14. Implementera delmål ett beteende i taget.
15. Implementera målavslut och **MÅL UPPNÅTT!**.
16. Implementera målhistorik.
17. Skapa fokustabeller/RLS/RPC:er.
18. Implementera fokus-UI och fokushistorik.
19. Integrera Profil read-only.
20. Integrera coach read-only.
21. Lägg till tränarfeedback/förslag.
22. Lägg till fokusuppföljning.
23. Genomför sekretess-/RLS-test med flera användare.
24. Full regression.
25. Tillgänglighets- och mobilgranskning.
26. Aktivera först efter godkända tester.

### Viktig etappindelning

Planen ovan är långsiktig. Första implementationen ska **inte** försöka bygga allt samtidigt.

**Första byggbara etapp:**

Spelare loggar in → Utveckling → ser **Du har inget mål ännu** → **SKAPA MITT MÅL** → skriver sitt mål → sparar → målet finns kvar efter omladdning.

När denna kedja fungerar och sekretessen är verifierad går projektet vidare till delmål.

---

## 16. Testplan

### Spelare – huvudmål

- korrekt tomläge
- skapa giltigt mål
- tom rubrik/beskrivning avvisas klient + server
- högst ett aktivt mål även vid samtidiga anrop
- redigering bevarar revision
- delmål kan skapas/redigeras/klarmarkeras/återöppnas/arkiveras
- progression korrekt
- mål kan avslutas trots oklara delmål
- blank slutreflektion avvisas
- lyckat avslut visar exakt **MÅL UPPNÅTT!**
- avslutat mål finns i historik efter omladdning
- avslutat mål kan inte ändras via direkt RPC
- ingen ranking/poäng

### Spelare – fokus

- korrekt tomläge
- endast fyra tillåtna områden
- tom fokustext avvisas
- högst ett aktivt fokus
- fokusbyte atomärt
- gammalt fokus kvar i historik
- frivillig avslutsreflektion sparas
- tränarstatus hindrar inte spelarens byte/avslut
- status visas exakt som Aktivt/Följs upp/Uppföljning klar

### Tränare

- behörig tränare ser rätt spelare
- ser mål/delmål/fokus/tillåten historik
- kan lämna feedback/förslag
- förslag blir inte automatiskt delmål
- kan markera fokus Följs upp/Uppföljning klar
- kan inte redigera/avsluta/blockera spelarens mål
- annat lag nekas
- generell admin utan explicit utvecklingsbehörighet nekas

### Sekretess

Testa minst spelare A och B i Juniorlaget, spelare i annat lag, tränare i Juniorlaget, ledare i annat lag, okänd roll och oinloggad användare.

Verifiera att spelare A aldrig kan läsa B:s mål via REST/RPC/manipulerad klient, att spelare inte kan skriva tränarfeedback, att manipulerat `player_id` avvisas/ignoreras, att privata data inte hamnar i publik profil/lagfråga, att historik inte kan muteras och att `anon` saknar åtkomst.

---

## 17. Regressionstest

### Inloggning/session

- korrekt/felaktig inloggning fungerar som före ändringen
- aktiv session återställs vid omladdning
- mål/fokus laddas först efter etablerad session
- inga dubbla komponenter/listeners efter auth-state-byte

### Utloggning

- logout-knapp kvar
- `signOut()` fungerar
- login visas efter logout
- privat data tas bort ur DOM/minne
- tidigare spelares data blinkar inte fram vid kontobyte

### Hem

- nästa aktivitet oförändrad
- SportAdmin-felhantering oförändrad
- laginformation/nyheter fungerar
- inga privata mål/fokus på Hem

### Kalender

- Kalender öppnas
- SportAdmin-hämtning, sortering, styling, Worker-URL, ICS- och datumlogik oförändrade

### Navigation

- Hem, Kalender, Utveckling, Laget och Profil fungerar
- endast vald `.page` aktiv
- aktiv knapp markeras
- Profil-CTA öppnar Utveckling
- inga nya toppnivåflikar
- inga dubbla handlers
- coachkomponent högst en gång
- mobil bottennavigation täcks inte av dialoger

### Laget och befintlig utveckling

- publika lagdata oförändrade
- mål/fokus aldrig i andra spelares publika kort
- självskattning/reflektion fungerar i fyra områden
- senaste `development_assessments` laddas
- tränarens stjärnbedömningar fungerar
- `save_player_self_assessment` och `save_coach_assessment` oförändrade
- mål/fokus-migrationer ändrar inte `development_assessments`

---

# REKOMMENDERAD IMPLEMENTATIONSORDNING

1. **Fastställ roller och lagmodell** – inventera schema och dokumentera behörighetsmatris.
2. **Skapa endast måltabeller och constraints** – testa unik aktiv målpost och avslutsregler.
3. **Inför mål-RLS** – spelaren läser bara eget; behörig ledare i samma lag enligt explicit roll.
4. **Skapa spelarens mål-RPC** – börja med skapa och läsa, därefter redigering med revision.
5. **Skapa delmåls-RPC:er** – lägg till, redigera, klarmarkera/återöppna och arkivera.
6. **Skapa säkert målavslut** – obligatorisk slutreflektion, ingen tränarblockering.
7. **Bygg read-only målsammanfattning i Utveckling** – regressionstesta självskattning direkt.
8. **Bygg spelarens målformulär** – en handling i taget.
9. **Bygg avslutsdialog och MÅL UPPNÅTT!** – validering, tillgänglighet och persistence.
10. **Bygg målhistorik** – read-only först.
11. **Skapa fokustabeller, constraints och RLS** – separat livscykel/uppföljningsstatus.
12. **Skapa spelarens fokus-RPC:er** – skapa, ändra, byta atomärt, avsluta.
13. **Bygg spelarens fokus-UI**.
14. **Bygg fokushistorik**.
15. **Integrera Profil** – endast dynamiska sammanfattningar/CTA; regressionstesta logout.
16. **Skapa tränarfeedback** – append-only; tränaren muterar inte spelarens mål.
17. **Skapa fokusuppföljning för tränare**.
18. **Genomför full säkerhetsmatris** – inklusive direkta REST/RPC-försök.
19. **Genomför full regression** – auth, logout, Hem, Kalender, navigation, Laget, självskattning och tränarbedömning.
20. **Lansera kontrollerat** – testa med separata spelar-/tränarkonton och aktivera först efter godkända RLS- och regressionstest.
