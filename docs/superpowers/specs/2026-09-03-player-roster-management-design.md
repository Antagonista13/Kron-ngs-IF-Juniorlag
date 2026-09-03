# Spelartrupp – design

## Mål
Kronängs IF Juniorlag ska ha ett centralt spelarregister i appen som ledare enkelt kan administrera utan Excel eller direktarbete i Supabase. Alla spelare i startimporten tillhör samma juniorlag; ingen lag-/gruppkolumn behövs.

## Datamodell
Ny tabell `players` blir primär källa för spelartruppen och innehåller:
- `id uuid primary key`
- `full_name text not null`
- `mobile_phone text null`
- `birth_date date null`
- `shirt_number integer null`
- `is_active boolean not null default true`
- `profile_id uuid null references profiles(id)` för koppling till inloggat spelarkonto
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Ingen adress, personnummer, vårdnadshavarinformation, e-post, allergi eller annan data från Excel ska sparas i detta register.

## Integritet och behörighet
- Ledare/admin får läsa och administrera samtliga spelare.
- Vanliga spelare får inte läsa andra spelares mobilnummer eller födelsedatum.
- En spelare får läsa sin egen spelarrad via `profile_id` i den utsträckning appen behöver för hemprofilen.
- Mobilnummer och födelsedatum visas endast i ledarens administrationsvy.

## Administrationsvy
Under `Laget` skapas en sektion `Spelartrupp` för ledare/admin.

Vyn visar aktiva spelare med namn och tröjnummer. Ledaren kan:
- lägga till spelare,
- redigera namn, mobilnummer, födelsedatum och tröjnummer,
- markera spelare inaktiv med `Ta bort från truppen`,
- återaktivera en inaktiv spelare.

Radering ska vara mjuk: historik och eventuell koppling till utvecklingsdata får inte förstöras.

## Koppling till spelarens hemvy
Hem-sidans spelaridentitet ska i första hand läsa tröjnummer från `players.shirt_number` via spelarens `profile_id`. `profiles.player_number` får finnas kvar som bakåtkompatibel fallback under övergången men ska inte vara primär källa.

Ledare/admin fortsätter visa handskriven etikett `Ledare` och inget tröjnummer.

## Startimport från Excel
De två uppladdade Excel-filerna används endast för en engångsimport. Endast rader där `Gruppkoppling = Spelare` används. Spelare som förekommer i båda filerna dedupliceras.

Från Excel hämtas endast:
- för- och efternamn → `full_name`
- spelarens `Mobiltelefon` → `mobile_phone`
- födelsedatum härlett från personnummer → `birth_date`

Själva personnumret får inte sparas i den genererade importfilen eller i `players`.

Tröjnummer saknas i Excel-underlaget och fylls därför i via appens administrationsvy.

## Importstrategi
Starttruppen levereras som en SQL-seed/migration med endast tillåtna fält. Ingen personlig data utöver namn, mobilnummer och födelsedatum får committas.

Eftersom live-Supabase inte är ansluten i denna konversation kan migrationer skapas i GitHub men inte appliceras direkt på produktionsdatabasen. Detta ska kommuniceras tydligt vid leverans.

## UI-principer
- Mobil först.
- Samma visuella språk som befintliga Lag/Hem-sidor.
- Enkel lista framför komplex tabell.
- Minst 44 px tryckyta på redigeringsknappar.
- Telefonnummer visas klickbart för ledare när värde finns.
- Födelsedatum presenteras i läsbart svenskt format.
- Inaktiva spelare separeras visuellt från den aktiva truppen.

## Felhantering
- Tomt namn får inte sparas.
- Tröjnummer är valfritt men om det anges ska det vara ett rimligt positivt heltal.
- Ogiltigt datum eller telefonnummer ska inte krascha vyn.
- Om tabellen `players` ännu inte finns ska ledarvyn visa ett tydligt men ofarligt felmeddelande.

## Avgränsningar
Denna version bygger inte flera lag, vårdnadshavarregister, adresser, närvaroregister eller kontaktbok för spelare. Fokus är en säker och enkel spelartrupp för Kronängs IF Juniorlag.