# Spelarprofil 2.0 – Design

## Mål
Göra ledarens spelarvy till en tydlig mobil spelarprofil där identitet, aktuellt utvecklingsläge, senaste återkoppling och historik går att förstå snabbt, utan att skapa ett parallellt utvecklingssystem.

## Principer
- Återanvänd befintliga tabeller och befintliga coach-/utvecklingsfunktioner.
- Mobil först, svart/vit Kronäng-stil med sparsamma gulddetaljer.
- Viktigast först: spelare → utveckling just nu → senaste återkoppling → historik.
- Ledaråtgärder ska vara samlade och tydliga men inte skymma spelarens nuläge.
- Spelare/föräldrar ska inte få ledarverktyg.

## Profilhuvud
När en ledare öppnar en spelare visas ett profilhuvud med spelarens namn och, där data finns, profilbild, tröjnummer, position samt rollmarkeringar som målvakt/kapten. Befintlig tillbaka-navigering behålls.

## Utveckling just nu
Befintligt aktivt huvudmål, delmålsprogress och aktivt fokus presenteras i en gemensam tydlig sektion. Fokusområde, vad spelaren ska tänka på och uppföljningsstatus återanvänds från befintlig data.

## Ledarverktyg
En kompakt sektion `LEDARVERKTYG` ger snabb åtkomst till befintliga arbetsflöden för fokus/återkoppling/mål. Första versionen ska länka eller scrolla till befintliga kontroller snarare än duplicera formulär eller databasanrop.

## Senaste återkoppling och historik
Befintlig coach-feedback och historik ska placeras och märkas så att senaste återkopplingen blir lätt att hitta och historiken ligger längre ned. Ingen ny historiktabell införs.

## Behörighet
Profilen är en förbättring av coach/ledarvyn. Befintliga roll- och RLS-regler ska fortsätta vara auktoritativa. Ingen känsligare spelardata ska exponeras för nya roller.

## Test
Regressionstester ska täcka profilhuvudets view model, ordningen på profilsektionerna, ledarverktygens mål samt att befintliga coach-/utvecklingsflöden och rolltester fortsätter vara gröna. Cacheversioner bumpas för ändrade webbresurser.