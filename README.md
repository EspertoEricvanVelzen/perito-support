# Perito Support Portal

Support portaal voor **Perito Professional Performance** — evaluatie-instrumenten voor medische opleidingen.

Live op: `support.perito.website`

## Snel starten

```bash
# 1. Installeer dependencies
npm install

# 2. Kopieer en configureer environment variables
cp .env.example .env
# Pas de SMTP-instellingen aan in .env

# 3. Start de server
npm start
```

De app draait op `http://localhost:3000`.

## Structuur

```
content/nl/         → Support-teksten in Markdown
views/              → EJS templates
public/             → CSS, JavaScript, afbeeldingen
lib/                → Server-side modules (markdown, search, mailer)
data/               → Wizard-logica en video-metadata
```

## Content aanpassen

Alle support-teksten staan als Markdown-bestanden in `content/nl/`. Om een pagina aan te passen:

1. Bewerk het `.md`-bestand
2. Commit en push naar GitHub
3. Hostinger pikt de wijziging automatisch op (of herstart de app)

## Deployment op Hostinger

1. Maak een Node.js hosting plan aan op Hostinger
2. Koppel de GitHub repository
3. Stel de environment variables in via het Hostinger dashboard
4. Configureer DNS: `support.perito.website` → Hostinger server

## Technologie

- Node.js + Express
- EJS templates
- Lunr.js (zoekfunctionaliteit)
- Nodemailer (contactformulier)
- Poppins (Google Fonts)
