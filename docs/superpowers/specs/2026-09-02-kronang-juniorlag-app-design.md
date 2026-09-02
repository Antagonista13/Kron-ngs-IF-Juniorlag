# Design: Kronängs IF Juniorlag-appen

**Datum:** 2026-09-02  
**Status:** Godkänd designspecifikation  
**Omfattning:** Produkt- och UX-design för spelarens utveckling, tränarverktyg, laget, kommunikation och ledarläge.

## 1. Bakgrund

Kronängs IF Juniorlag-appen ska vara ett enkelt, modernt och tryggt digitalt nav för juniorlaget. Spelarens utveckling är appens kärna, men appen ska också fungera som lagets samlingsplats för information, kommunikation och överblick.

Den befintliga appen har redan inloggning, utloggning, kalender från SportAdmin, startsida, lagvy, profil och utvecklingsbedömning. Den fortsatta utvecklingen ska bygga vidare på detta utan att i onödan ändra eller bryta fungerande delar.

## 2. Produktmål

- Ge varje spelare ett tydligt och konkret utvecklingsfokus.
- Göra det enkelt för spelaren att formulera och följa ett eget utvecklingsmål.
- Ge tränaren ett praktiskt verktyg för att följa upp, kommentera och stödja spelarens utveckling.
- Spara utvecklingshistorik så att tidigare mål, fokus och bedömningar aldrig behöver skrivas över.
- Hålla privat utvecklingsinformation privat mellan spelaren och behörig ledarstab.
- Ge laget en enkel digital samlingsplats för information och lagkommunikation.
- Behålla en ren, klassisk och lättanvänd upplevelse även när funktionaliteten växer.

## 3. Användare och roller

Appens primära användare är:

- Spelare.
- Tränare.
- Assisterande tränare.
- Huvudansvarig.

Föräldrar ingår inte i den första versionen av målgruppen.

### 3.1 Huvudansvarig

Huvudansvarig har fulla administrativa möjligheter för lagets funktioner. Behörigheter till privat spelarutveckling ska dock vara explicit definierade och ska inte automatiskt följa av administrativ status.

### 3.2 Tränare

Tränare ska kunna arbeta med spelarutveckling, bedömningar, interna anteckningar, feedback, mål och fokus enligt de behörigheter som senare implementeras.

### 3.3 Assisterande tränare

Assisterande tränare ska kunna arbeta med utveckling på motsvarande sätt som tränare enligt den framtida behörighetsmodellen.

### 3.4 Spelare

Spelaren äger sitt eget utvecklingsarbete. Spelaren kan bland annat skriva presentation, välja önskade positioner, skapa och avsluta mål, arbeta med delmål och välja sitt aktuella fokus.

## 4. Övergripande informationsarkitektur

Appens huvudnavigation består av fem flikar:

1. **Hem**
2. **Kalender**
3. **Utveckling**
4. **Laget**
5. **Profil**

Utveckling är kärnan i appen. Hem ska vara lagets samlingsplats. Kalendern ska fortsatt visa lagets aktiviteter från befintlig SportAdmin-integration. Laget ska ge en enkel överblick över spelare och ledarstab. Profil ska fungera som spelarens personliga fotbollssida.

## 5. Visuell riktning

- Svart och vitt som huvuduttryck.
- Ingen grön färg som huvudsaklig designfärg.
- Rent, klassiskt och återhållsamt uttryck.
- Tydlig typografi och stora, lättbegripliga klickytor.
- Kronängs IF:s riktiga logotyp används som identitet och kan förekomma som diskret vattenstämpel/branding.
- Designen ska kännas som en seriös fotbollsapp, inte som ett socialt nätverk.

## 6. Hem

Hem ska ge en snabb överblick över det viktigaste för laget.

### 6.1 Nästa aktivitet

Den befintliga funktionen för nästa aktivitet ska behållas och fortsätta använda kalenderinformationen från SportAdmin.

### 6.2 Viktig laginformation

Hem kan visa viktig information med tydliga start- och slutdatum. Information som inte längre är aktuell ska inte ligga kvar som aktiv information.

### 6.3 Lagflöde

Hem visar de senaste 2–3 inläggen från lagflödet och har länken **Visa hela lagflödet**.

Alla inloggade spelare och ledare kan läsa och skriva textinlägg. En spelare kan ta bort sina egna inlägg. Tränare och ledare ska kunna ta bort olämpliga inlägg.

Inläggen sparas och visas med nyast först. Äldre inlägg nås via **Visa äldre inlägg**.

Ett inlägg kan markeras som **VIKTIGT** och därmed fästas/lyftas som viktig information.

Lagflödet ska i den här designen vara textbaserat. Bilder ingår inte eftersom laget redan har andra sociala kanaler för bildpublicering.

### 6.4 Veckofokus

Hem kan visa lagets veckofokus med angivna start- och slutveckor.

### 6.5 Avgränsning

Hem ska inte duplicera hela kalendern och ska inte visa spelarens privata utvecklingssammanfattning.

## 7. Kalender

Den befintliga kalendern och integrationen mot SportAdmin ska behållas.

Kalendern ska inte byggas om som en del av mål- och fokusfunktionen. Nya funktioner ska integreras försiktigt så att den fungerande kalenderhämtningen inte påverkas.

## 8. Utveckling

Utvecklingssidan ska börja med en liten sammanfattning och därefter låta de fyra utvecklingsområdena dominera:

- Teknik
- Spelförståelse
- Fys
- Mentalitet

### 8.1 Utvecklingssammanfattning

Överst visas i enkel form:

- aktuellt mål
- aktuellt fokus
- delmålsprogression
- senaste utvecklingsbedömning
- senaste tränarkommentar
- länk till historik

### 8.2 Fyra utvecklingsområden

För varje område kan spelaren ange:

- egen skattning 1–5
- egen reflektion

Tränaren kan ange:

- tränarens skattning 1–5
- tränarens kommentar

Både spelarens och tränarens bedömningar ska sparas historiskt. De ska inte ersätta tidigare bedömningar.

### 8.3 Bedömningshistorik

Hela utvecklingshistoriken ska sparas. Den aktuella säsongen visas först och användaren kan välja **Visa tidigare säsonger**.

Två planerade fullständiga bedömningar per säsong är grundmodellen. Extra bedömningar kan göras vid behov.

På längre sikt ska historiken kunna visas visuellt, bland annat som kurvor där spelarens egen skattning och tränarens skattning kan jämföras över tid. Ingen ranking eller totalpoäng ska användas.

### 8.4 Feedbackmarkering

En liten diskret markering/prick på fliken **Utveckling** kan visa att ny tränarfeedback finns. Markeringen försvinner när spelaren har tittat på den nya feedbacken.

Pushnotiser ingår inte i denna design.

## 9. Mitt mål

Spelaren ska kunna ha ett övergripande aktivt utvecklingsmål.

### 9.1 Ägarskap

Spelaren äger sitt mål. Tränaren kan läsa, kommentera och föreslå förändringar eller nya delmål, men tränaren godkänner inte målet och kan inte blockera spelaren från att avsluta det.

### 9.2 Skapa mål

När spelaren skapar ett mål ska appen guida med enkla frågor. Spelaren skriver själv vad målet är. Appen kan därefter hjälpa till att föreslå relevanta delmål.

Målet ska vara meningsfullt och konkret, inte ett administrativt formulär för formulärets skull.

### 9.3 Delmål

Ett huvudmål kan ha flera delmål.

Spelaren ska kunna:

- skapa delmål
- ändra delmål
- ta bort delmål
- markera delmål som klara

Delmålen ska bidra till att göra huvudmålet konkret och möjligt att följa upp.

### 9.4 Historik

När ett mål ändras eller avslutas ska tidigare information sparas i historiken. Ett avslutat mål ska aldrig bara försvinna.

### 9.5 Avsluta mål

Spelaren kan avsluta sitt mål när hen anser att det är uppnått.

Vid avslut ska spelaren skriva en obligatorisk slutreflektion.

Efter bekräftelsen ska appen tydligt visa:

**MÅL UPPNÅTT!**

Det ska inte finnas ranking, poäng eller tävlingsmoment kopplat till mål.

### 9.6 Tränarens återkoppling

När ett mål har avslutats kan tränaren se målet och spelarens slutreflektion. Tränaren kan:

- kommentera
- ge beröm
- hålla med
- uttrycka en annan bedömning
- föreslå fortsatt utveckling

Tränarens kommentar är feedback och inte ett godkännande som krävs för att målet ska få avslutas.

Efter ett avslutat mål ska spelaren inte tvingas skapa ett nytt mål.

### 9.7 Kommunikation kring mål

Feedback ska visas direkt under målet. En framtida direktmeddelandefunktion kan användas för djupare kommunikation mellan spelare och ledare.

## 10. Mitt fokus

Spelaren ska ha ett aktivt fokus som är kopplat till ett av de fyra utvecklingsområdena.

### 10.1 Ett aktivt fokus

Endast ett fokus är aktivt åt gången.

Spelaren kan byta fokus. Tidigare fokus sparas i historiken.

### 10.2 Skapa fokus

Skapandet ska vara enkelt:

1. Välj utvecklingsområde.
2. Skriv ett kort fokus.
3. Ange valfritt vad spelaren särskilt ska tänka på.
4. Spara.

### 10.3 Tränarens uppföljning

Tränaren ska kunna se spelarens fokus och markera att det ska följas upp.

Fokus kan ha status:

- Aktivt
- Följs upp
- Uppföljning klar

När fokus avslutas kan spelaren lämna en kort valfri reflektion. Tränaren kan se och kommentera denna.

### 10.4 Fokusets historik

Tidigare fokus sparas och ska kunna visas tillsammans med övrig utvecklingshistorik.

## 11. Profil – min fotbollssida

Profilen ska vara spelarens personliga fotbollssida, inte ett socialt nätverk.

### 11.1 Spelaren kan själv ändra

- kort presentation
- önskade positioner, rangordnade

Exempel:

1. Ytter
2. Mittfältare
3. Anfallare

### 11.2 Ledarstyrd information

Ledarstab/admin hanterar:

- profilbild
- namn
- tröjnummer
- officiell position

Profilbilden bör vara en enhetlig bild i match-/träningskläder.

### 11.3 Utvecklingssammanfattning på profil

Profilen kan visa en liten sammanfattning:

- aktuellt fokus
- huvudmål
- delmålsprogression
- länk till full utveckling

Om fokus saknas visas:

**Du har inget fokus ännu. + VÄLJ MITT FOKUS**

Om mål saknas visas:

**Du har inget mål ännu. + SKAPA MITT MÅL**

Kalender och nästa aktivitet ska inte placeras på profilsidan.

## 12. Laget

Laget ska vara enkelt och rent.

Överst finns en växling:

**SPELARE | LEDARSTAB**

### 12.1 Spelare

Spelare visas som mindre kort i två kolumner.

Kortet kan visa:

- profilbild
- namn
- tröjnummer
- officiell position
- kort presentation

När en spelare väljs visas en större profilvy på högersidan på större skärmar.

Kronängs IF:s logotyp kan användas diskret som vattenstämpel/branding.

### 12.2 Sökning och filter

Spelarlistan ska kunna sökas och filtreras på:

- Målvakter
- Försvarare
- Mittfältare
- Anfallare

### 12.3 Publik spelarprofil

Alla inloggade spelare i laget ska kunna se andra spelares offentliga lagprofil:

- foto
- namn
- nummer
- officiell position
- kort presentation

Följande ska inte vara offentligt för andra spelare:

- önskade positioner
- mål
- fokus
- privat utvecklingshistorik
- självskattningar
- tränarbedömningar

### 12.4 Inaktiva spelare

En spelare som blir inaktiv ska behålla sin historik och sitt konto men:

- inte visas offentligt i laget
- inte visas i andra publika spelarlistor

Spelaren ska senare kunna återaktiveras.

### 12.5 Ledarstab

Ledarstaben visas med:

- foto
- namn
- roll
- kort presentation

Rollerna i första designen är:

- Huvudansvarig
- Tränare
- Assisterande tränare

På längre sikt ska det kunna finnas kontaktvägar till vald ledare, exempelvis direktmeddelande eller kontaktuppgifter. Den exakta mekanismen är ännu inte beslutad.

## 13. Privat utvecklingsinformation

Följande information ska betraktas som privat:

- spelarens självskattningar
- spelarens reflektioner
- mål
- delmål
- fokus
- utvecklingshistorik
- tränarbedömningar
- tränarkommentarer

Privat utvecklingsinformation ska endast vara tillgänglig för spelaren och behörig ledarstab enligt den framtida behörighetsmodellen.

Andra spelare ska aldrig kunna läsa en spelares privata utveckling.

## 14. Interna tränaranteckningar

Interna anteckningar ska vara en särskild behörighetsstyrd funktion. De ska inte automatiskt vara synliga för spelaren eller alla ledare.

Behörighetsmodellen ska definiera exakt vilka ledare som får läsa och skriva sådana anteckningar.

## 15. Ny spelarregistrering

På sikt ska huvudansvarig kunna skapa en ny spelarprofil.

Arbetsflödet ska vara:

1. Huvudansvarig skapar spelaren.
2. Appen skickar en inbjudan till spelarens e-postadress.
3. Spelaren öppnar inbjudan.
4. Spelaren väljer sitt eget lösenord.

Fri offentlig självregistrering ska inte vara standardlösningen för laget.

## 16. Behörighet och säkerhet

Supabase Auth används för inloggning.

Databasen ska använda Row Level Security (RLS) för privat information.

Klientens rollindikering får aldrig vara den enda säkerhetskontrollen för privata operationer. Behörighet ska även säkerställas i databasen, exempelvis via RLS och säkra server-/RPC-funktioner.

Spelare ska kunna läsa och skriva sina egna utvecklingsuppgifter enligt definierade regler.

Tränare/behörig ledare ska kunna läsa spelarutveckling enligt sin roll och lagtillhörighet.

En spelare ska inte kunna skriva tränarens bedömning eller kommentar genom klienten.

Nya databasfunktioner och RLS-regler ska införas försiktigt och testas separat från befintlig funktionalitet.

## 17. Befintlig funktionalitet som ska skyddas

Följande delar fungerar redan och ska inte ändras i onödan:

- huvudnavigationen mellan Hem, Kalender, Utveckling, Laget och Profil
- kalenderhämtningen från SportAdmin via befintlig integration
- Hem och funktionen Nästa aktivitet
- Supabase-inloggningen
- sessionshantering
- utloggningen
- spelarprofilkopplingen
- spelarens självskattning och reflektion
- tränarens utvecklingsvy
- tränarens bedömningar och kommentarer
- befintlig svart/vit design

Nya funktioner ska byggas runt dessa delar och testas så att de inte orsakar regressioner.

## 18. Teknisk riktning

Applikationen är en befintlig vanilla-JavaScript-webbapp. Den fortsatta utvecklingen ska i första hand bygga vidare på befintlig struktur.

Nya funktioner bör få tydlig separation i kod och datalager där det är praktiskt möjligt, exempelvis separata JavaScript-filer för större funktionella områden.

Supabase används för:

- Auth
- profiler
- utvecklingsdata
- framtida mål/fokus
- framtida lagflöde och annan lagdata

SportAdmin fortsätter vara källa för kalenderdata.

## 19. Datahistorik

Historik är en central princip.

Tidigare mål, fokus och bedömningar ska sparas. Nya versioner ska normalt skapa nya historiska poster eller på annat sätt bevara tidigare status så att utvecklingen kan följas över tid.

Ingen utvecklingshistorik ska raderas eller skrivas över enbart för att en ny säsong eller ett nytt mål börjar.

Aktuell säsong ska prioriteras i presentationen, med möjlighet att visa tidigare säsonger.

## 20. Coachens utvecklingsöversikt

Tränarverktyget ska på sikt ge en samlad överblick över spelartruppen.

Tränaren ska kunna:

- söka spelare
- filtrera på position
- öppna en spelares utvecklingsvy
- se aktuellt mål
- se aktuellt fokus
- se delmålsprogression
- se senaste utvecklingsbedömning
- se relevant historik
- lämna feedback
- följa upp fokus

Diskreta statusmarkeringar kan användas för exempelvis:

- Fokus att följa upp
- Nytt delmål klart
- Ny tränarfeedback
- Ny självskattning

Markeringarna ska ge överblick utan att skapa ett poäng- eller rankingsystem.

## 21. Framtida statistik och visualisering

När tillräcklig historik finns kan appen visa utveckling över tid.

Exempel är kurvor för spelarens självskattning och tränarens bedömning inom de fyra områdena.

Visualiseringen ska hjälpa spelaren och tränaren att se utveckling, inte skapa intern ranking.

## 22. Lagkommunikation

Lagflödet ska vara en enkel intern kommunikationsyta.

Grundprinciper:

- alla inloggade lagmedlemmar kan läsa
- spelare och ledare kan skriva textinlägg
- spelare kan ta bort sina egna inlägg
- ledare kan ta bort olämpliga inlägg
- inlägg sparas
- senaste visas först
- äldre inlägg kan hämtas
- viktiga inlägg kan markeras

Direktmeddelanden är en framtida funktion och behöver separat design innan implementation.

## 23. Avgränsningar

Följande ingår inte i den första implementationen av denna designspecifikation:

- föräldrakonton
- pushnotiser
- bilder i lagflödet
- ranking
- totalpoäng för spelare
- automatisk tränargodkänning av spelarens mål
- krav på att spelaren måste skapa ett nytt mål efter ett avslutat mål
- full flerlagshantering
- slutlig design för direktmeddelanden
- avancerad statistik innan historik finns

## 24. Framtida flerlagshantering

Appen ska på längre sikt kunna stödja flera Kronängs IF-lag. Den första implementationen ska dock fokusera på Kronängs IF Juniorlag och inte bygga in onödig komplexitet innan behovet finns.

## 25. Utvecklingsordning

Den övergripande roadmapen är:

1. **Grund och säkerhet** – inloggning, roller, RLS och grundstruktur.
2. **Spelarens utveckling** – självskattning, mål, fokus och historik.
3. **Tränarverktyget** – truppöversikt, uppföljning, feedback och bedömningar.
4. **Laget och kommunikation** – lagprofiler, ledarstab och lagflöde.
5. **Statistik och utvecklingshistorik** – visualisering och längre historik.
6. **Ledarläge** – särskilt arbetsläge och behörighetsstyrda funktioner.
7. **Finputsning och lansering** – UX, kvalitetssäkring, mobilanpassning och regressionstestning.
8. **Långsiktigt adminläge** – särskilt läge för behöriga huvudansvariga.

## 26. Designprinciper för fortsatt implementation

- Gör en funktion i taget.
- Skydda befintlig fungerande funktionalitet.
- Separera privata och publika data tydligt.
- Låt spelaren äga sin utveckling.
- Låt tränaren stödja, följa upp och ge feedback.
- Spara historik i stället för att skriva över utvecklingsdata.
- Undvik onödig administration.
- Håll gränssnittet enkelt även när funktionaliteten blir avancerad.
- Testa säkerhet och regression vid varje större förändring.
- Implementera inte sådant som ännu inte är designbeslutat.

## 27. Acceptanskriterier för designspecifikationen

Designen ska betraktas som uppfylld när den framtida implementationen:

- låter spelaren formulera och följa ett eget mål
- stödjer flera delmål och sparar historik
- kräver slutreflektion vid avslutat mål
- visar tydlig bekräftelse av uppnått mål
- låter tränaren kommentera och föreslå utan att blockera spelarens mål
- ger spelaren ett aktivt fokus kopplat till ett av fyra områden
- sparar tidigare fokus och mål
- stödjer tränarens uppföljning av fokus
- bevarar befintlig självskattning och tränarbedömning
- skyddar privat utvecklingsinformation med databasbaserade behörigheter
- visar en ren spelarprofil med tydlig skillnad mellan offentlig och privat information
- ger laget en enkel spelar- och ledaröversikt
- stödjer textbaserat lagflöde
- behåller befintlig kalenderintegration
- behåller befintlig navigation och inloggning/utloggning
- inte introducerar ranking eller totalpoäng

Denna dokumentation är en produkt- och designspecifikation. Den innebär inte i sig att någon av de beskrivna framtida funktionerna redan är implementerad.