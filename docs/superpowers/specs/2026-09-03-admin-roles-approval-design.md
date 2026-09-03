# Admin, roller och godkännande – designspecifikation

## Mål
Bygga ett säkert och lättanvänt behörighetssystem för Kronängs IF Juniorlag där Team Manager/Lagledare är Admin, tränare delar samma ledarbehörighet, spelare får åtkomst till sitt spelarflöde och föräldrar endast får laggemensam information. Nya konton får ingen lagåtkomst förrän Admin har godkänt dem.

## Systemroller
- `admin` – full behörighet, inklusive användare och roller.
- `coach` – ledarbehörighet. Head Coach och Coach har samma tekniska rättigheter.
- `player` – spelaråtkomst.
- `parent` – föräldraåtkomst utan koppling till en specifik spelare.
- `pending` – väntar på godkännande och saknar åtkomst till lagets interna innehåll.

Visningstitel separeras från systemroll. Exempel: en `coach` kan visas som `Head Coach`, `Coach`, `Assisterande tränare` eller annan titel utan att behörigheten förändras. Admin kan visas som `Team Manager / Lagledare`.

## Behörighetsmatris
| Funktion | Admin | Coach | Player | Parent |
|---|---|---|---|---|
| Nyheter | Ja | Ja | Ja | Ja |
| Kalender – läsa | Ja | Ja | Ja | Ja |
| Kalender – skapa/ändra/ta bort | Ja | Ja | Nej | Nej |
| Veckans fokus | Ja | Ja | Ja | Nej |
| Veckans utmaning | Ja | Ja | Ja | Nej |
| Egen utveckling | Ja | Ja | Ja | Nej |
| Andra spelares utveckling | Ja | Ja | Nej | Nej |
| Spelartrupp och kontaktuppgifter | Ja | Ja | Nej | Nej |
| Hantera spelartrupp | Ja | Ja | Nej | Nej |
| Skapa/redigera laginnehåll | Ja | Ja | Nej | Nej |
| Hantera användare och roller | Ja | Nej | Nej | Nej |
| Systemadministration | Ja | Nej | Nej | Nej |

`pending` har ingen åtkomst till ovanstående laginnehåll.

## Säkerhetsprinciper
Behörighet ska verkställas både i användargränssnittet och i Supabase/RLS. Att dölja en knapp räknas inte som säkerhet. Systemet ska använda default deny: okänd, saknad eller väntande roll får inte privilegierad åtkomst. Endast Admin får ändra roller. Coach får aldrig uppgradera en användare till coach eller admin. Parent får inte läsa spelarregister, kontaktuppgifter, individuell utveckling, interna tränaranteckningar, veckans fokus eller veckans utmaning.

Admins egen adminroll ska skyddas mot oavsiktlig borttagning i det vanliga användarformuläret. Ingen e-postadress eller auth-ID hårdkodas i klientkoden.

## Registrering och godkännande
En ny användare kan registrera sig men hamnar som `pending`. Kontot ger ingen intern lagåtkomst förrän Admin godkänner det och väljer en roll.

Admin kan också initiera en inbjudan via e-post. Inbjudan innehåller en länk som förenklar registreringen men ger aldrig behörighet i sig. Admin kan ange namn och förväntad roll som hjälp i godkännandekön. Förväntad roll är metadata och får inte automatiskt ge rättigheter.

När en väntande användare godkänns måste Admin välja `player`, `parent` eller `coach`. En spelare kopplas då till en befintlig post i `public.players`. En parent kopplas inte till någon spelare. En coach kan få en separat visningstitel. Adminrollen tilldelas inte genom det vanliga godkännandeflödet.

## Adminvy
Endast `admin` ser ingången `Administration`.

Adminvyn innehåller:
1. Översikt med antal väntande, aktiva användare och ledare.
2. `Godkännanden` med namn, e-post, inbjudningsstatus och åtgärder för att godkänna eller neka. Godkännande kräver rollval. Player kräver val av spelarpost; coach kan få visningstitel; parent kräver ingen spelarkoppling.
3. `Användare & roller` med aktiva användare, systemroll, visningstitel och möjlighet att ändra roll eller stänga av åtkomst.
4. `Bjud in` där Admin anger namn, e-post och valfri förväntad roll och initierar en e-postinbjudan.

Utseendet följer appens befintliga formspråk: mobil först, ljus bakgrund, tydliga kort, svarta primärknappar och sparsamma gulddetaljer.

## Kalender
Alla fyra aktiva roller får läsa aktiviteter. Endast `admin` och `coach` får skapa, ändra eller ta bort aktiviteter. Player och parent är strikt read-only.

## Föräldrar
`parent` är en fristående lagroll. Ingen relation parent → player lagras i denna version. Föräldrar ser Nyheter och Kalender men inte spelar- eller tränarspecifikt innehåll.

## Spelarregister
Det befintliga `public.players` är den centrala spelaridentiteten. Vid godkännande av ett player-konto kopplar Admin användarens profil/auth-identitet till rätt spelarpost. Parent får aldrig motsvarande koppling.

## Datamodell – riktning
Den befintliga profilmodellen utökas så att rollstatus kan representera `pending`, `player`, `parent`, `coach`, `admin`, tillsammans med separat visningstitel och aktiv/avstängd status där det behövs. Exakta migrationsdetaljer bestäms i implementationsplanen efter inventering av nuvarande profilschema och RLS.

Inbjudningar lagras separat med e-post, valfritt namn, valfri förväntad roll, status och tidsstämplar. Ingen inbjudan får ensam fungera som auktorisation.

## Avgränsningar
- Ingen parent-player-koppling.
- Ingen självuppgradering av roller.
- Ingen coach får administrera roller.
- Ingen import av föräldrauppgifter från tidigare Excel-filer.
- Ingen hårdkodning av personliga e-postadresser eller Supabase auth-ID:n.
- Ingen automatisk adminroll från en inbjudningslänk.

## Implementationsstrategi
Arbetet görs testdrivet och i små verifierbara steg. Först inventeras befintliga rollkontroller och RLS. Därefter införs gemensam roll/permission-logik, databaspolicyer, pending-flöde, Admin-UI, spelarkoppling och kalender-/innehållsgates. Tester ska uttryckligen verifiera att parent och pending nekas känslig data och att endast admin kan hantera roller.
