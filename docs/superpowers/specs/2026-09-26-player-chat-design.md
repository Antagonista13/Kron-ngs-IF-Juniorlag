# Spelarchatt – designspecifikation

Datum: 2026-09-26

## Syfte
KIF-appen ska ge varje spelare en privat tvåvägskanal till juniorlagets ledarstab för individuella tips, positiv feedback, frågor och svar. Funktionen ska komplettera den strukturerade utvecklingsdelen, inte ersätta den.

## Produktmodell
- En permanent gemensam konversation per spelare.
- Deltagare är spelaren samt aktiva användare med rollen `coach` eller `admin` i spelarens lag.
- Alla behöriga ledare ser samma historik.
- Spelaren kan starta dialogen själv och svara på ledarnas meddelanden.
- Föräldrar har ingen åtkomst i version 1.
- Version 1 stöder endast textmeddelanden. Inga bilder, filer, reaktioner, gruppchattar eller pushnotiser.

## Gränssnitt
Ledare når chatten från spelarens profil/utvecklingsvy via **Meddelanden**. Spelaren når samma funktion från sin egen utvecklingsvy.

Chatten visar spelarens namn, att dialogen är mellan spelaren och ledarstaben, meddelandebubblor i kronologisk ordning, avsändarens namn och roll samt datum/tid. Nederst finns textfältet **Skriv ett meddelande…** och knappen **SKICKA**.

Olästa meddelanden visas med röd markering och antal. Ledarvyn ska även kunna visa vilka spelare som har olästa meddelanden, exempelvis **Emil Bergqvist · 2 nya**.

## Lässtatus
Lässtatus är individuell per användare. När en användare öppnar konversationen markeras mottagna meddelanden som lästa för just den användaren. Att en tränare läser ett spelarmeddelande får alltså inte markera det som läst för övriga ledare.

## Dataarkitektur
Funktionen byggs som en separat Supabase-del med tydliga tabeller för:
1. spelarens konversation,
2. meddelanden,
3. individuell lässtatus.

Konversationen knyts till spelarens profil/spelarpost och lag. Meddelanden lagrar konversation, avsändarprofil, text och skapandetid. Lässtatus knyter användare till konversation/meddelande så att oläst-räknaren kan beräknas per användare.

Exakta tabell-, index- och RPC-namn bestäms i implementationplanen efter kontroll mot aktuell Supabase-dokumentation och befintligt schema.

## Behörighet och säkerhet
Alla exponerade tabeller ska ha RLS.

- Aktiv spelare: får läsa och skriva endast i sin egen konversation.
- Aktiv `coach`/`admin`: får läsa och skriva i spelarkonversationer för sitt eget lag.
- `parent`, `pending`, anonyma och användare från andra lag: ingen åtkomst.
- Behörighet ska baseras på serververifierad profil/laginformation, inte användarstyrd metadata.
- Ingen service-role-nyckel får exponeras i klienten.
- Om SECURITY DEFINER behövs ska PUBLIC/anon EXECUTE återkallas och autentiserad åtkomst begränsas uttryckligen.

Meddelanden ska inte raderas automatiskt när en spelare arkiveras. Historiken bevaras, medan åtkomst följer användarens aktuella aktiva status och roll.

## Moduler
Chatten hålls isolerad från befintlig utvecklingslogik:
- en datamodul för konversation/meddelanden/lässtatus,
- en UI-modul för chatten,
- en modul för oläst-räknare/badges,
- en migrationsfil för databas, RLS, index och eventuella säkra RPC-funktioner.

Befintliga spelarprofiler och rollbehörigheter används som ingångspunkter. Utvecklingshistorik och chattdata blandas inte.

## Dataflöde
1. Användaren öppnar en behörig spelarprofil eller sin egen utvecklingsvy.
2. Appen hämtar eller identifierar spelarens konversation.
3. Meddelanden hämtas i tidsordning.
4. Användaren skickar text; server/RLS verifierar deltagarbehörigheten.
5. Mottagarnas oläst-status uppdateras genom att meddelandet saknar läsmarkering för dem.
6. När en mottagare öppnar chatten registreras lässtatus för den användaren.
7. Badges/räknare uppdateras.

Första versionen behöver inte native push. Uppdatering kan ske när relevanta vyer öppnas/återaktiveras; eventuell Supabase Realtime kan läggas till endast om det ger tydlig nytta utan att komplicera första leveransen.

## Felhantering
Tomma meddelanden får inte skickas. Meddelandelängd får en rimlig servervaliderad maxgräns. Vid nätverks- eller databasfel ska texten ligga kvar i skrivfältet och användaren få ett tydligt felmeddelande så att innehåll inte förloras.

Dubbeltryck på SKICKA ska inte skapa oavsiktliga dubbletter.

## Testkrav
Automatiska tester ska minst verifiera:
- spelare kan läsa/skriva endast sin egen chatt,
- coach/admin i rätt lag kan läsa/skriva,
- förälder/pending/anon/annat lag nekas,
- individuell lässtatus och oläst-räknare,
- ledarens namn/roll visas korrekt,
- tomma/ogiltiga meddelanden nekas,
- befintliga roll-, spelarprofil- och utvecklingsflöden fortsätter fungera.

Efter databasmigration ska schema/RLS verifieras mot liveprojektet och Supabase advisors köras.

## Avgränsning version 1
Ingen pushnotis, bilduppladdning, filbilaga, emoji-reaktion, redigering/radering av skickade meddelanden, separat tränarchatt eller föräldraåtkomst. Sådana funktioner kan bedömas efter att grundflödet används i praktiken.

## Framgångskriterium
En spelare och ledarstaben kan tryggt föra en sammanhållen privat dialog i appen, båda kan initiera den, alla behöriga ledare ser samma historik, och varje användare ser korrekt antal egna olästa meddelanden utan att andra spelares konversationer exponeras.
