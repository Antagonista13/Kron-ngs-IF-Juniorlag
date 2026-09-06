# Ledarverktyg på Profil — Design

## Mål
Renodla huvudfliken **Laget** till lagets gemensamma innehåll och flytta rollstyrd administration till **Profil** för admin/ledare.

## Informationsarkitektur

### Laget
Laget ska innehålla sådant användaren tittar på om laget:
- Veckans fokus.
- Laginlägg/nyheter.
- Spelartrupp.
- Ledarstab.
- `REDIGERA` och `TA BORT` får ligga kvar direkt på respektive inlägg för behöriga ledare, eftersom de är kontextuella handlingar på just det inlägget.

Laget ska inte visa den stora samlade panelen `LEDARVERKTYG` och ska inte visa truppadministrationens knappar/formulär som permanent ledaryta.

### Profil
Profil ska innehålla personliga och rollstyrda funktioner. För roller som får administrera laginnehåll visas en sektion `LEDARVERKTYG` med:
- `+ NYTT INLÄGG`
- `ÄNDRA VECKANS FOKUS`
- `ÄNDRA VECKANS UTMANING`
- `HANTERA TRUPP`

Spelare och föräldrar ska inte se denna sektion.

## Beteende
De befintliga editorerna, behörighetskontrollerna och datakällorna ska återanvändas. Ingen ny datamodell eller parallell administration införs. Verktygens DOM-värdar flyttas till Profil, men samma editorer ska fortfarande öppna i fokuserat läge och spara till samma Supabase-funktioner som idag.

`HANTERA TRUPP` ska ge ledaren åtkomst till befintlig truppadministration utan att ta bort den publika spelartruppen från Laget.

## Mobilprincip
På iPhone ska Laget börja med lagets innehåll, inte administration. Profilens ledarverktyg ska vara en tydlig separat kortsektion med stora tryckytor och samma svart/vita Kronäng-uttryck som övriga ledarverktyg.

## Icke-mål
- Ingen ändring av databas-schema.
- Ingen ny behörighetsmodell.
- Ingen omdesign av själva inläggs-, fokus- eller utmaningseditorerna.
- Ingen ändring av spelarens individuella utvecklingsflöde.
