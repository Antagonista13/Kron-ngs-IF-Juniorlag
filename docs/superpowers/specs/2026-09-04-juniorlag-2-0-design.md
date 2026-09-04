# Kronängs IF Juniorlag 2.0 – Design

## Mål

Version 2.0 ska göra appen mer komplett för den dagliga lagverksamheten utan att förändra det som redan fungerar. Fokus är fyra tydliga områden: utvecklingsflödet, ledarstaben/profilbilder, mobil publicering av nyheter samt kalenderhantering. All ny funktionalitet ska respektera befintliga roller, RLS-regler och den mobila användningen.

Header-justeringen med större klubbsköld och renare lagerhantering är en separat redan genomförd buggfix och ingår inte i 2.0-arbetet.

## 1. Utveckling 2.0 – tvåvägsnotiser

Det befintliga utvecklingssystemet behålls som grund och utökas till ett tvåvägsflöde.

### Spelare får notis när tränare gör något nytt

En spelare ska få en röd prick på `UTVECKLING` när en tränare skapar något som är synligt för spelaren, till exempel:

- en synlig kommentar,
- en registrerad uppföljning som är synlig för spelaren,
- ett förslag på nytt eller ändrat utvecklingsmål.

Tränaranteckningar med synligheten `Endast ledare` får aldrig skapa en spelarnotis och får inte exponeras för spelaren eller förälder.

### Tränare får notis när spelaren gör något nytt

Tränare ska få motsvarande röd prick när en spelare gör en ändring som tränarna behöver se, exempelvis:

- ändrar sitt mål,
- ändrar sitt fokus,
- skriver en ny relevant reflektion eller motsvarande utvecklingspost som ingår i 2.0-flödet.

I tränarens spelaröversikt ska den aktuella spelaren också markeras med `NYTT`, så att tränaren inte behöver öppna varje spelare för att upptäcka ändringar.

### Lässtatus och markering

En notis räknas inte som läst bara för att användaren öppnar sidan Utveckling. Den ska ligga kvar tills mottagaren har öppnat den exakta posten eller händelsen som skapade notisen.

Nya tränarposter ska markeras tydligt i spelarens flöde, till exempel med `NYTT FRÅN TRÄNAREN` och en diskret röd markering. Motsvarande markering ska kunna användas i tränarvyn för nytt från spelaren. När posten har lästs försvinner markeringen, men själva posten ligger kvar i historiken.

Ingen numerisk badge krävs i v1 av 2.0. Den röda pricken räcker.

### Säkerhet

- Admin och tränare kan läsa spelarutveckling enligt befintlig behörighetsmodell.
- Spelare kan endast läsa sin egen utveckling och de poster som är synliga för spelaren.
- Föräldrar får ingen personlig utvecklingsåtkomst.
- Ledar-only-poster får aldrig kunna läsas av spelare eller föräldrar.
- Notiser ska vara per mottagare och ha egen läst/oläst-status.

Det befintliga notifications-upplägget ska återanvändas och utökas, inte ersättas med ett parallellt system.

## 2. LAGET 2.0 – ledarstab och profilbilder

### Ledarstab som egen presentationslista

Ledarstaben ska vara frikopplad från användarkonton. En person kan alltså finnas i staben utan att ha ett konto i appen.

Admin ska kunna:

- lägga till person,
- ändra namn,
- skriva valfri roll/titel,
- skriva en kort beskrivning av uppdraget,
- ändra ordning,
- ta bort personen ur staben.

Roller får inte hårdkodas. Fältet är fri text så att framtida roller som `Materialare`, `Fystränare`, `Målvaktstränare`, `Kioskansvarig` eller andra roller kan användas utan kodändring.

Presentation och systembehörighet ska vara separata. En person kan exempelvis presenteras som `Huvudtränare` i staben men ha systemrollen `coach`. En `Materialare` kan finnas i staben helt utan användarkonto.

### Profilbilder

Endast Admin får lägga till, byta eller ta bort profilbilder för samtliga användare och ledarpersoner. Ingen användare får ändra sin egen bild.

Adminflödet ska fungera från mobil:

1. Admin öppnar personen.
2. Trycker på profilbilden eller en tydlig bildknapp.
3. Väljer en bild ur mobilens bildbibliotek.
4. Justerar beskärning till 1:1.
5. Sparar.

Appen ansvarar endast för uppladdning, beskärning och konsekvent visning. Admin förbereder själv den grafiska bakgrunden i bilden innan uppladdning.

Slutpresentationen ska vara en rund profilbild med en diskret svart/vit ram. Bilden ska centreras så huvud och överkropp fungerar väl i det runda formatet.

Bildfiler ska lagras centralt i Supabase Storage med en behörighetsmodell där endast Admin får skriva/ersätta, medan de användare som får se personen också får läsa bilden.

## 3. Senaste nytt 2.0 – mobil publicering

Senaste nytt ska kunna hanteras direkt från mobilen i appen.

Admin och tränare ska kunna skapa nya inlägg med:

- rubrik,
- brödtext,
- valfri bild från mobilens bildbibliotek,
- publiceringsdatum och författare från systemet.

Publiceringsflödet ska vara enkelt: `+ NYTT INLÄGG` → skriv → valfri bild → förhandsgranska → `PUBLICERA`.

### Behörigheter

- Admin kan skapa, redigera och ta bort alla inlägg.
- Tränare kan skapa inlägg.
- Tränare kan redigera och ta bort inlägg skapade av tränare, oavsett vilken tränare som skapade dem.
- Tränare får aldrig redigera eller ta bort ett Admin-inlägg.
- Admin-inlägg får endast redigeras eller tas bort av Admin.
- Spelare och föräldrar kan endast läsa.

Borttagning ska kräva en tydlig bekräftelse för att undvika feltryck på mobil.

Nyhetsbilder ska behålla sitt normala bildformat; de ska inte tvingas till samma runda format som profilbilder.

## 4. Kalender 2.0 – lokal döljning av SportAdmin-aktiviteter

SportAdmin är fortsatt källsystem för importerade aktiviteter. 2.0 ska inte skriva tillbaka eller ta bort något i SportAdmin.

Admin och tränare ska kunna välja `DÖLJ AKTIVITET` på en aktivitet i appen. Om aktiviteten kommer från SportAdmin ska den då försvinna från appens kalender men ligga kvar oförändrad i SportAdmin.

Tekniskt ska appen lagra en lokal suppression/hide-post som identifierar den externa aktiviteten. Vid varje kalenderladdning filtreras dolda externa aktiviteter bort innan de renderas.

### Återställning

Endast Admin ska kunna öppna `VISA DOLDA AKTIVITETER` och återställa en dold SportAdmin-aktivitet. Tränare kan dölja, men inte återställa.

Vanliga spelare och föräldrar ser endast den färdiga kalendern och inga administrativa kontroller.

Om appen i framtiden får egna lokalt skapade kalenderaktiviteter kan dessa tas bort på riktigt. Det beteendet ska hållas separat från SportAdmin-importen.

## Roller och behörigheter – sammanfattning

| Funktion | Admin | Tränare | Spelare | Förälder |
| --- | --- | --- | --- | --- |
| Ändra profilbilder | Ja, alla | Nej | Nej | Nej |
| Hantera ledarstab | Ja | Nej | Nej | Nej |
| Skapa nyhet | Ja | Ja | Nej | Nej |
| Redigera tränarinlägg | Ja | Ja | Nej | Nej |
| Redigera Admin-inlägg | Ja | Nej | Nej | Nej |
| Ta bort tränarinlägg | Ja | Ja | Nej | Nej |
| Ta bort Admin-inlägg | Ja | Nej | Nej | Nej |
| Dölja kalenderaktivitet | Ja | Ja | Nej | Nej |
| Återställa dold kalenderaktivitet | Ja | Nej | Nej | Nej |
| Se personlig utveckling | Alla spelare i laget | Alla spelare i laget | Egen | Nej |
| Skriva ledarkommentar/uppföljning | Ja | Ja | Nej | Nej |
| Få utvecklingsnotiser | Ja, som ledare | Ja | Ja, egna | Nej |

## Arkitektur

2.0 ska byggas som separata, begripliga moduler som följer de befintliga fil- och datamönstren i projektet.

### Utveckling

Befintliga `development-*`-moduler utökas med stöd för avsändartyp, mottagare, oläst status och tvåvägsflöde. Notislogiken ska hållas separerad från renderingen av utvecklingskort så att samma system senare kan återanvändas.

### Ledarstab

Ledarstaben ska få en egen datamodell, exempelvis `team_staff`, med minst namn, fri roll, beskrivning, bildreferens, sorteringsordning och aktiv-status. Eventuell länk till ett användarkonto ska vara valfri, inte obligatorisk.

### Bilder

Supabase Storage används för profil- och nyhetsbilder. Databasen lagrar sökväg eller publik/signerad referens enligt befintligt säkerhetsupplägg. Klientkoden får aldrig innehålla service-role-nyckel.

### Nyheter

Befintlig nyhetsfunktion ska vidareutvecklas i stället för att skapa ett parallellt nyhetssystem. Varje inlägg måste bära tillräcklig metadata för att avgöra om det är ett Admin-inlägg eller tränarinlägg och därmed vem som får redigera eller ta bort det.

### Kalender

Importerade SportAdmin-aktiviteter ska inte kopieras eller ändras. En separat tabell, exempelvis `hidden_calendar_events`, sparar identifieraren för den externa aktiviteten, vem som dolde den och när. Klienten filtrerar bort matchande aktiviteter efter import.

## Dataflöde

1. Användaren autentiseras och systemrollen hämtas som idag.
2. Varje 2.0-modul hämtar endast den data rollen har rätt att läsa.
3. Skrivoperationer går via RLS-skyddade tabeller eller säkra RPC-funktioner där server-side-behörighet behövs.
4. Efter lyckad skrivning uppdateras berörd vy direkt utan krav på full omladdning.
5. Fel visas nära den åtgärd som misslyckades och användarens befintliga data får inte försvinna från formulär vid tillfälliga fel.

## Felhantering

- Bilduppladdning ska validera filtyp och rimlig filstorlek före uppladdning.
- Om uppladdning misslyckas ska den tidigare bilden ligga kvar.
- Nyhet publiceras inte som halvfärdig om bildsteget misslyckar; användaren ska kunna välja att publicera utan bild eller försöka igen.
- Dölja kalenderaktivitet ska vara idempotent; samma aktivitet får inte skapa dubbla hide-poster.
- Återställning får bara lyckas för Admin.
- Notiser ska inte dupliceras vid samma händelse och en läsmarkering ska vara idempotent.

## Teststrategi

All implementering sker med TDD och delas upp i små steg.

Tester ska täcka minst:

- tvåvägsnotiser och lässtatus,
- att ledar-only-poster aldrig skapar spelarnotis,
- coachens `NYTT`-markering per spelare,
- Admin-only skrivbehörighet för profilbilder,
- fri rolltext och ledarstab utan användarkonto,
- nyhetsbehörigheter för Admin- respektive tränarinlägg,
- bekräftad borttagning av nyheter,
- dölja SportAdmin-aktivitet utan att ändra källan,
- Admin-only återställning av dold aktivitet,
- RLS/RPC-regler för samtliga nya skrivoperationer,
- mobil asset-laddning och syntax via befintlig GitHub Actions-CI.

## Genomförandeordning

2.0 implementeras i fyra delsteg i denna ordning eftersom varje steg ska kunna testas och mergas separat:

1. Utveckling 2.0 och tvåvägsnotiser.
2. LAGET 2.0, ledarstab och Admin-styrda profilbilder.
3. Senaste nytt 2.0 med mobil publicering.
4. Kalender 2.0 med lokal döljning och Admin-återställning.

Varje delsteg ska lämna `main` i ett fungerande och testat läge innan nästa del börjar.

## Utanför scope för 2.0

- Ändringar i SportAdmin.
- Pushnotiser via iOS/Android.
- Automatisk friläggning eller grafisk bearbetning av profilbilder.
- Föräldraåtkomst till personlig utvecklingsdata.
- Tunga statistikdashboards för utveckling.
- Hårdkodad lista över ledarroller.
