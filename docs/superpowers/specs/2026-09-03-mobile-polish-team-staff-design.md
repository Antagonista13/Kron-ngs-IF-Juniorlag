# Mobilepolering och ledarstab – design

## Mål
Förbättra mobilupplevelsen utan att ändra de delar som redan fungerar bra. Hem ska bli centrerad och mer kompakt, Lagets veckofokus ska bli tydligt separerat från nyhetsflödet, Profil ska återanvända samma profilbild som Hem, och Laget ska få en datadriven sektion för ledarstaben med snabba kontaktvägar.

## Omfattning
- Mobil-Hem: rätta horisontell förskjutning, ta bort synlig vertikal gräns från vattenstämpeln, minska kortens höjd och vertikala luft men behåll stor profilcirkel och nuvarande formspråk.
- Kalender: lämnas funktionellt och visuellt oförändrad.
- Utveckling: lämnas funktionellt och visuellt oförändrad.
- Laget: Veckans fokus får mörk Kronäng-stil med gulddetaljer/taktiska linjer så att det inte blandas ihop med vita informations- och nyhetskort.
- Laget: ny sektion "Ledarstaben" med bild, namn, roll, telefon och e-post. Telefon och e-post ska vara direkt klickbara på mobil.
- Profil: profilbilden ska hämtas från samma `profiles.avatar_url` som Hem. Om bild saknas används nuvarande neutrala ikon/fallback.

## Datamodell för ledarstaben
Ledarstaben ska inte hårdkodas i HTML och ska inte byggas som en lista av specialfall i `profiles`. En separat tabell `team_staff` används så att roller och kontaktuppgifter kan ändras senare utan att designen byggs om.

Föreslagna kolumner:
- `id uuid primary key default gen_random_uuid()`
- `team text not null`
- `profile_id uuid null references profiles(id)`
- `display_name text not null`
- `staff_role text not null`
- `phone text null`
- `email text null`
- `avatar_url text null`
- `sort_order integer not null default 100`
- `is_active boolean not null default true`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Appen visar endast aktiva poster för användarens lag, sorterade på `sort_order`, därefter namn. Om inga poster finns visas ingen tom stor ruta; endast en diskret rad om att kontaktuppgifter inte är publicerade ännu.

## Säkerhet och fallback
- Läsning av `team_staff` ska begränsas till autentiserade användare och till samma lag via RLS-policy.
- Inga privata kontaktuppgifter ska publiceras i GitHub-filer.
- Om tabellen ännu inte finns i Supabase ska resten av Laget fortsätta fungera och sektionen visa fallback utan att sidan kraschar.
- Profilbildssynk ska falla tillbaka till standardikon om `avatar_url` saknas eller om äldre schema används.

## Visuell riktning
### Hem mobil
- `.home-dashboard` ska alltid hålla sig inom viewporten; inga pseudo-element får skapa overflow i sidled.
- Vattenstämpeln ska ligga inom en klippt bakgrundsyta och inte skapa en synlig halvskärmsgräns.
- Profilcirkeln behåller sin dominans men minskas något på smala skärmar om det behövs för att fokus och namn ska få plats.
- Nästa aktivitet, Veckans utmaning och Senaste nytt får mindre padding och lägre minsta höjd på mobil.

### Laget
- `teamWeeklyFocus` får svart/mörk bakgrund, vit text, gulddetaljer och en diskret taktisk bakgrund.
- Vanliga nyheter/information förblir vita för tydlig hierarki.
- Ledarstaben visas som kompakta personkort. Varje kort visar avatar, namn, roll och två tydliga kontaktåtgärder när data finns.

### Profil
- Profilbilden ska visuellt matcha Hem: rund, beskuren med `object-fit: cover` och neutral fallback.

## Testkrav
- Enhetstest för normalisering/render-model för ledarstaben.
- Test att tom kontaktinformation inte genererar tomma `tel:`/`mailto:`-länkar.
- Regressionstest att profilmodellen exponerar `avatarUrl` och att Profil använder samma källa.
- Befintliga tester för Hem/nyheter ska fortsätta passera.
- GitHub Actions ska vara grönt före merge.
