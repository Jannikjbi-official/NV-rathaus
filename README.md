# Rathaus Nordverkehr

Bürgerportal der Stadtverwaltung im Roleplay-Projekt [Nordverkehr](https://nordverkehr.xyz).
Bürger melden sich mit Discord an, stellen Anträge bei neun Ämtern und erhalten Bescheide
per Discord-Nachricht. Mitarbeitende der Ämter bearbeiten die Anträge im Verwaltungsportal.

**Stack:** Next.js 16 · HeroUI v3 · Gravity Icons · Tailwind CSS v4 · Auth.js (Discord) ·
Drizzle ORM · Neon Postgres · Vercel

## Funktionen

**Stadtportal (öffentlich)**
- Startseite mit Top-Themen, Online-Dienstleistungen, Aktuelles, Amtsblatt, Verkehr, Veranstaltungen, Ämtern
- Leistungen A–Z mit Suche, Filter nach Amt und Lebenslage, Detailseiten
- Ämter mit Öffnungszeiten, Aktuelles & Amtsblatt, Stellenangebote
- Dokument prüfen: Echtheitsprüfung per Dokumentnummer (für Polizei und Behörden)

**Bürgerkonto** (Discord-Login, Mitglied im Server + Rolle „Bürger“)
- Meldedaten des Charakters; Name, Geburt und Anschrift danach nur per Antrag änderbar
- 40 Leistungen mit eigenen Formularen, Aktenzeichen, Gebühren
- Antragsverlauf, Rückfragen beantworten, Antrag zurückziehen
- Ausgestellte Dokumente als amtliche Karte, Druck/PDF
- Terminbuchung (z. B. Ausweis-Abholung, Trauung)

**Verwaltung** (Discord-Rolle je Amt, Admin-Rolle für alles)
- Posteingang je Amt, Bearbeitung mit Genehmigen / Rückfrage / Ablehnen, Nachrichten, interne Notizen
- Gebühr als bezahlt markieren, Dokument ausstellen (Angaben werden aus dem Antrag vorgeschlagen)
- Discord-DM an den Bürger bei jeder Statusänderung
- Melderegister, Dokumente widerrufen
- Formular-Builder mit Live-Vorschau, Amtsblatt-Editor, Verkehrsmeldungen, Stellen, Terminslots
- Ämter & Rollen: Discord-Rolle, Kontakt und Öffnungszeiten je Amt

## Einrichtung

### 1. Discord-Anwendung

1. Im [Discord Developer Portal](https://discord.com/developers/applications) eine Anwendung anlegen.
2. **OAuth2 → Redirects:** `https://<eure-domain>/api/auth/callback/discord` (lokal `http://localhost:3000/api/auth/callback/discord`).
3. Client-ID und Client-Secret als `AUTH_DISCORD_ID` und `AUTH_DISCORD_SECRET` eintragen.
4. **Bot:** Token erzeugen (`DISCORD_BOT_TOKEN`) und den Bot ohne besondere Rechte auf den Server einladen.
   Er verschickt die Direktnachrichten und gleicht alle 10 Minuten die Rollen ab.
5. Im Discord den Entwicklermodus aktivieren und per Rechtsklick kopieren: Server-ID (`DISCORD_GUILD_ID`),
   Rolle „Bürger“ (`DISCORD_CITIZEN_ROLE_ID`), Admin-Rolle (`DISCORD_ADMIN_ROLE_ID`).
6. Die Rollen der einzelnen Ämter trägt ein Admin danach im Portal unter **Verwaltung → Ämter & Rollen** ein.

### 2. Datenbank

Alle Variablen stehen in `.env.example`. Die Neon-Verbindung kommt in `.env` (wird nicht committet).

```bash
pnpm install
pnpm db:migrate   # Tabellen anlegen
pnpm db:seed      # Ämter, Leistungen, Beispielmeldungen, Stellen, Terminslots
pnpm dev
```

Für lokale Tests ohne Discord: `AUTH_DEV_LOGIN=true` in `.env` zeigt auf `/anmelden` einen Testzugang
(Bürger oder Verwaltung). In Produktion ist er immer aus.

### 3. Vercel

1. Repository in Vercel importieren (Framework: Next.js).
2. Umgebungsvariablen aus `.env.example` setzen, dazu `AUTH_SECRET` (`openssl rand -base64 32`)
   und `NEXT_PUBLIC_SITE_URL`.
3. Deploy. Vercel führt `vercel-build` aus: erst die Migrationen, dann den Build.

### 4. Tablet im Spiel (FiveM)

Die Ressource `nv_tablet` auf dem Spielserver zeigt das Rathaus in einem Tablet an.

- Der Spielserver signiert die Discord-ID des Spielers mit `FIVEM_LOGIN_SECRET` (HMAC-SHA256,
  höchstens 120 Sekunden gültig, einmalig) und öffnet `/api/fivem/anmelden?token=…&weiter=/konto`.
- Die Seite prüft den Token und danach wie beim Discord-Login Mitgliedschaft und Rollen über den Bot
  (`DISCORD_BOT_TOKEN` ist dafür Pflicht).
- In Produktion haben die Auth-Cookies `SameSite=None; Secure`, damit sie im iframe des Tablets funktionieren.
- Einbetten ist per `Content-Security-Policy: frame-ancestors` nur der eigenen Seite und
  `https://cfx-nui-nv_tablet` erlaubt (`next.config.mjs`).

## Projektstruktur

```
app/(portal)/        Stadtportal und Bürgerkonto (/konto)
app/verwaltung/      Verwaltungsportal
app/actions/         Server-Aktionen (Bürgerkonto, Verwaltung, Inhalte)
components/          HeroUI-Komponenten der App
db/                  Drizzle-Schema, Migrationen, Seed-Daten
lib/                 Rechte (viewer), Discord, Formulare, Formatierung
```

Formulare: Jede Leistung speichert ihre Felder in `services.fields`. Beim Antrag wird die
Felddefinition mitgespeichert, damit spätere Änderungen alte Anträge nicht verfälschen.

---

Fiktive Stadtverwaltung im Roleplay-Projekt Nordverkehr. Keine echte Behörde.
