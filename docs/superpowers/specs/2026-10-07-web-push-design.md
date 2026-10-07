# KIF: notiser för spelare

Status: förslag för granskning före implementation. Funktionen är ännu inte byggd.

## Vad spelaren får

Under Profil tillkommer Notiser med knappen Aktivera notiser. Spelaren kan välja Laginlägg och Meddelanden separat, stänga av notiser och skicka en testnotis till sin egen telefon. iPhone-spelare öppnar appen från hemskärmen och godkänner telefonens behörighetsfråga. Vid saknat stöd eller nekad behörighet visas konkreta instruktioner.

Nya laginlägg aviseras till aktiva spelare i samma lag. Nya ledarmeddelanden aviseras till den aktiva spelare som samtalet gäller. Avsändaren aviseras inte om sitt eget innehåll. Första versionen gäller spelare; push till ledare och vårdnadshavare ingår inte.

Telefonens notis visar ”Nytt laginlägg i KIF” eller ”Nytt meddelande i KIF”. Meddelandetext visas först i den inloggade appen. Tryck på notisen öppnar rätt inlägg eller chatt efter eventuell inloggning.

Appikonen visar antalet olästa aviseringar för de kategorier spelaren valt, där telefonen stöder det. Ett öppnat laginlägg markeras läst. Chatten använder sin befintliga läskvittens. Antalet uppdateras när innehållet läses och när appen åter öppnas. Andra telefoner synkroniseras när de öppnas eller får nästa synliga notis; inga osynliga pushmeddelanden skickas enbart för att ändra siffran.

Gamla inlägg skickas inte ut när någon aktiverar notiser. Inläggsredigering ger inte en ny notis. Flera telefoner stöds med separata prenumerationer. En utloggad telefon kopplas från kontots framtida utskick och dess lokala siffra rensas.

## Rekommenderad lösning

Bygg vanlig Web Push i appens befintliga Supabase-projekt. Detta passar nuvarande chatt, laginlägg och behörigheter. Ett alternativ är en extern pushleverantör, vilket tillför ett separat konto och ytterligare behandling av prenumerationsdata. Ett annat alternativ är markeringar enbart inne i appen, vilket inte uppfyller önskemålet när appen är stängd.

Repo saknar i dag manifest och registrerad service worker. Lägg till manifest med stabilt id, scope, start_url, standalone-visning och appikoner. Service worker hanterar push, synlig notis, badge och säkra interna notislänkar. Den inför ingen offlinecache av inloggade sidor.

## Data och utskick

Lägg till prenumerationer knutna till profile-id och enhet, personliga kategorival, personliga aviseringar med lässtatus och en separat leveranskö. RLS skyddar varje spelares prenumerationer, inställningar och aviseringar. Endast backend får behandla leveranskön. Registrering kräver aktivt spelarkonto; konto-ID och spelarregistrets ID hålls isär.

Databastriggers skapar avisering och leveransjobb atomärt med ett nytt laginlägg eller chattmeddelande. Befintliga läskvittenser uppdaterar tillhörande aviseringar. Ett laginlägg markeras läst via ett kontoavgränsat RPC när detaljen öppnas. Olästantalet beräknas på servern; klienten får inte tilldela eller läsa en annan spelares antal.

En Supabase Edge Function skickar krypterad Web Push med VAPID. Den väcks efter nya jobb och får återförsök från schemalagd körning. Projektet har redan pg_cron, pg_net och Vault. Publik VAPID-nyckel exponeras till appen; privat nyckel och intern utskicksbehörighet lagras skyddat och ska aldrig finnas i repo, klient, loggar eller lathund. Alla backendanrop autentiseras. Prenumerationsadresser valideras mot tillåtna pushleverantörer och omdirigeringar avvisas för att inte göra utskickaren till en godtycklig HTTP-proxy.

Jobb har exklusiv tidsbegränsad lease, unikt event/enhet-ID och begränsade återförsök. Utgångna prenumerationer (404/410) stängs av. Tillfälliga fel får ökande väntetid. Behörighet, aktivt konto, aktuellt lag, kategorival och lässtatus kontrolleras igen före utskick. Misslyckad leverans får inte stoppa publicering eller chatt. Web Push garanterar inte exakt en leverans; stabil notification-tag minskar dubbla synliga notiser. Push är ett komplement till innehållet i appen.

## Verifiering och införande

Automatiska tester omfattar mottagarurval, rätt lag, konto-ID, läskvittenser, kategorival, utloggning, flera enheter, kölåsning, återförsök, borttagna prenumerationer och otillåten registrering/åtkomst. Befintlig regressionssvit körs. SQL-tester använder återställda testdata.

Innan allmän aktivering testas på Henrics iPhone: installation från Safari, aktivering, testnotis, stängd app, nytt laginlägg, nytt ledarmeddelande, tryck till rätt innehåll samt ikonens olästantal och rensning. En Android-telefon kontrolleras också när en sådan finns tillgänglig. Klienten visar saknat stöd tydligt.

Införande sker med backend och prenumerationsknapp före utskick till spelare. Endast uttryckligen aktiverade enheter får aviseringar. Kod levereras i PR för merge enligt nuvarande arbetsflöde. Lathunden färdigställs efter att de faktiska knapparna och iPhone-flödet verifierats.

## Lathundens innehåll

En sida för spelarna: öppna KIF-länken, lägg till på hemskärmen, öppna appikonen, logga in, Profil → Notiser → Aktivera notiser, Tillåt, välj kategorier och testa. Förklara notisens siffra och hur den minskar. Kort felsökning för nekad behörighet, vanlig webbläsarflik och fokusläge. PDF för utskick och redigerbar Word-version. Dokumentet ska ange att funktionen finns tillgänglig först efter publicering och godkänt telefonprov.

## Källor för plattformens förutsättningar

- https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/
- https://webkit.org/blog/14112/badging-for-home-screen-web-apps/
- https://supabase.com/docs/guides/functions/schedule-functions
