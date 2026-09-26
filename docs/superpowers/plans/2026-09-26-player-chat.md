# Spelarchatt Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bygga en säker tvåvägschatt mellan varje spelare och juniorlagets gemensamma ledarstab, med individuell oläst-räknare.

**Architecture:** Chatten är ett separat Supabase-delsystem med en konversation per spelare, meddelanden och individuell lässtatus. Klienten får fokuserade moduler för data, UI och badges och kopplas till befintliga spelar-/utvecklingsvyer utan att blanda chattdata med utvecklingshistoriken.

**Tech Stack:** Vanilla JavaScript/PWA, Supabase PostgreSQL/Auth/RLS, befintlig Node-testsvit.

**Spec:** `docs/superpowers/specs/2026-09-26-player-chat-design.md`

## Global Constraints
- En permanent gemensam konversation per spelare.
- Spelaren och aktiva `coach`/`admin` i samma lag får skriva; `parent`, `pending`, anon och andra lag nekas.
- Alla ledare delar historik, men lässtatus är individuell per användare.
- Version 1 är endast text; ingen push, bild, fil, reaktion, separat tränarchatt eller föräldraåtkomst.
- Historik bevaras när spelaren arkiveras; åtkomst följer aktuell aktiv status/roll.
- Alla exponerade tabeller har RLS och ingen service-role används i klienten.

## Review Focus
- Manipulerat player/conversation-id får aldrig ge åtkomst till annan spelares/annat lags chatt — testas i Task 1.
- Arkiverad/inaktiv profil ska förlora åtkomst utan att historik raderas — testas i Task 1.
- Två ledare ska ha oberoende lässtatus — testas i Task 2.
- Dubbeltryck/skickning under pågående request får inte skapa oavsiktliga dubbletter — testas i Task 3.
- Nätverks-/DB-fel ska lämna användarens oskickade text kvar — testas i Task 3.

---

### Task 1: Datamodell och RLS

**Files:**
- Create: `supabase/migrations/<generated>_player_chat.sql`
- Create: `tests/player-chat-security.test.js`

**Interfaces:**
- Produces: tabeller `player_chat_conversations`, `player_chat_messages`, `player_chat_reads`; RLS-regler som härleder åtkomst från autentiserad profil, aktiv status, lag och spelarrelation.

- [ ] **Step 1: Kontrollera aktuell Supabase changelog/docs** för RLS, Realtime (endast för beslut om att avstå/använda) och Data API; dokumentera relevanta aktuella krav i migrationskommentar eller commit.
- [ ] **Step 2: Skriv failing security-contract tests** som verifierar tabell/RLS-kontrakt, same-team leader access, own-player access, parent/pending/anon/cross-team denial samt bevarad historik vid inaktiv spelare.
- [ ] **Step 3: Kör** `node --test tests/player-chat-security.test.js`; förvänta FAIL eftersom schema saknas.
- [ ] **Step 4: Skapa migration via Supabase migration-generatorn** och implementera tabeller, FK/index, textbegränsning, timestamps och RLS. Konversationen ska vara unik per player; message sender ska vara `auth.uid()`; reads ska vara unik per user/message.
- [ ] **Step 5: Kör testet igen**; förvänta PASS.
- [ ] **Step 6: Applicera migrationen på projekt `ndbwnsiqcnxppikdrwvd`, verifiera med SQL att RLS/policies/index finns och kör Supabase security/performance advisors.**
- [ ] **Step 7: Commit:** `feat: add secure player chat schema`.

### Task 2: Chat data API och individuell lässtatus

**Files:**
- Create: `player-chat-data.js`
- Create: `tests/player-chat-data.test.js`
- Modify: `role-permissions.js`

**Interfaces:**
- Produces: `window.KronangPlayerChatData` med `getConversation(playerId)`, `listMessages(playerId)`, `sendMessage(playerId,text,clientKey)`, `markConversationRead(playerId)`, `getUnreadCount(playerId?)`.
- Consumes: Task 1-tabeller/RLS.

- [ ] **Step 1: Skriv failing tests** för rollgrind, tom text, maxlängd, listordning, individuell unread (två ledare oberoende) och idempotent `clientKey`.
- [ ] **Step 2: Kör** `node --test tests/player-chat-data.test.js`; förvänta FAIL.
- [ ] **Step 3: Lägg till explicita permissions** `canUseOwnPlayerChat(role)` och `canUsePlayerChatAsLeader(role)`.
- [ ] **Step 4: Implementera data-API:t** mot Supabase. `sendMessage` trimmas, valideras server/client och använder unik client key för att tåla dubbel submit.
- [ ] **Step 5: Kör data- och securitytest**; förvänta PASS.
- [ ] **Step 6: Commit:** `feat: add player chat data API`.

### Task 3: Chattvy och skicka-flöde

**Files:**
- Create: `player-chat.js`
- Create: `player-chat.css`
- Create: `tests/player-chat-ui.test.js`
- Modify: `index.html`

**Interfaces:**
- Produces: `window.KronangPlayerChat.open({playerId, playerName})` och en återanvändbar chatpanel.
- Consumes: `KronangPlayerChatData` från Task 2.

- [ ] **Step 1: Skriv failing UI-tests** för rubrik/spelarnamn, meddelanden kronologiskt, avsändarnamn+roll+tid, skrivfält/SKICKA, disabled submit under request, text kvar vid fel och mark-as-read vid öppning.
- [ ] **Step 2: Kör** `node --test tests/player-chat-ui.test.js`; förvänta FAIL.
- [ ] **Step 3: Implementera chatpanelen** med tydlig tillbaka-knapp, bubbellayout och statusmeddelanden; inga bilagor/reaktioner.
- [ ] **Step 4: Implementera säkert submitflöde:** behåll text tills servern bekräftat, blockera parallell submit och visa fel utan att tömma fältet.
- [ ] **Step 5: Lägg CSS/JS i `index.html` med nya cache-versioner.**
- [ ] **Step 6: Kör UI-test + befintliga Home/news/browser-order tester**; förvänta PASS.
- [ ] **Step 7: Commit:** `feat: add player chat interface`.

### Task 4: Ingångar för spelare och ledare

**Files:**
- Modify: `team-page-content.js`
- Modify: `admin-player-card-edit.js` och/eller befintlig gemensam spelarprofilmodul där profilen faktiskt renderas
- Modify: befintlig egen utvecklingsvy-modul
- Create/Modify: `tests/player-chat-entrypoints.test.js`

**Interfaces:**
- Consumes: `KronangPlayerChat.open`.
- Produces: **Meddelanden** på ledarens spelarprofil och spelarens egen utvecklingsvy.

- [ ] **Step 1: Identifiera den enda kanoniska renderingspunkten** för offentlig spelarprofil och egen spelarutveckling; undvik dubbla injektioner från flera scripts.
- [ ] **Step 2: Skriv failing entrypoint-tests**: admin/coach ser spelarens Meddelanden; player ser egen; parent/pending gör det inte; rätt playerId skickas till chatten.
- [ ] **Step 3: Kör testet**; förvänta FAIL.
- [ ] **Step 4: Implementera knapparna** i kanoniska vyer och öppna chatten med rätt spelar-id/namn.
- [ ] **Step 5: Kör entrypoint-, roster-, role- och development-tester**; förvänta PASS.
- [ ] **Step 6: Commit:** `feat: connect player chat to profiles`.

### Task 5: Oläst-räknare och ledaröversikt

**Files:**
- Create: `player-chat-unread.js`
- Create: `tests/player-chat-unread.test.js`
- Modify: relevanta spelarlista-/utvecklingslistmoduler
- Modify: `index.html`

**Interfaces:**
- Produces: badges för total unread och per spelare; `refreshPlayerChatUnread()`.
- Consumes: `KronangPlayerChatData.getUnreadCount`.

- [ ] **Step 1: Skriv failing tests** för röd badge+antal, per-player **N nya**, noll-läge utan badge och att öppnad/läst konversation uppdaterar endast aktuell användares räknare.
- [ ] **Step 2: Kör testet**; förvänta FAIL.
- [ ] **Step 3: Implementera unread-modulen** och koppla refresh till appstart, relevanta vyöppningar och lyckad mark-as-read/send. Använd inte native push.
- [ ] **Step 4: Lägg per-player badge i ledarens befintliga spelar-/utvecklingslista utan att ändra rosterdata.**
- [ ] **Step 5: Kör unread + UI + development/roster tester**; förvänta PASS.
- [ ] **Step 6: Commit:** `feat: add player chat unread badges`.

### Task 6: Helhetsverifiering och PR

**Files:**
- Modify only if verification exposes a defect.

**Interfaces:**
- Consumes: Tasks 1–5.
- Produces: verifierad feature branch/PR.

- [ ] **Step 1: Kör hela projektets ordinarie testkommandon/CI-kontrakt** samt samtliga nya `player-chat-*.test.js`; allt ska vara grönt.
- [ ] **Step 2: Verifiera live Supabase** med testfrågor för schema/RLS och kör advisors igen; inga nya säkerhetsvarningar från chatten.
- [ ] **Step 3: Manuell kontraktskontroll i kod:** player↔leaders, shared history, individual reads, parent denied, archived history retained, no push/attachments.
- [ ] **Step 4: Öppna PR** med migrations-, UI-, security- och testöversikt.
- [ ] **Step 5: Kontrollera exakt PR-head CI** och åtgärda endast faktiska regressionsfel innan merge.
