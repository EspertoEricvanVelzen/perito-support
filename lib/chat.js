const https = require('https');

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';
const MODEL = process.env.CHAT_MODEL || 'claude-sonnet-4-20250514';
const MAX_TOKENS = 1024;

/**
 * Build the system prompt with all support content for context
 */
function buildSystemPrompt(contentIndex) {
  let context = '';

  // Add all page content as context
  if (contentIndex && contentIndex.pages) {
    for (const [slug, page] of Object.entries(contentIndex.pages)) {
      context += `\n\n--- ${page.title} ---\n${page.plainText.substring(0, 3000)}`;
    }
  }

  return `Je bent de support-assistent van Perito Professional Performance, een online platform voor evaluaties in de medische opleiding en het medisch functioneren.

Je beantwoordt vragen van gebruikers over het platform in het Nederlands. Je bent vriendelijk, behulpzaam en professioneel.

BELANGRIJKE REGELS:
- Antwoord uitsluitend op basis van de informatie hieronder. Verzin geen functies of features die niet beschreven staan.
- Als je het antwoord niet weet, zeg dan eerlijk dat je het niet weet en verwijs naar support@peritoprofessionalperformance.nl.
- Houd antwoorden kort en concreet (maximaal 3-4 alinea's).
- Gebruik "u" en "uw" (formele aanspreking).
- Verwijs waar relevant naar specifieke pagina's op het support portaal.
- Je mag GEEN informatie geven over prijzen, contracten of commerciële afspraken.

BESCHIKBARE SUPPORT-PAGINA'S:
- /kennismaking — Eerste kennismaking met het platform
- /instrumenten — Overzicht van alle instrumenten
- /instrumenten/d-rect — D-RECT handleiding
- /instrumenten/blinc — BLiNC handleiding
- /instrumenten/setq — SETQ handleiding
- /instrumenten/teamq — TeamQ handleiding
- /instrumenten/incept-ifms-coordinatoren — INCEPT/IFMS voor coördinatoren
- /instrumenten/incept-ifms-medisch-specialisten — INCEPT/IFMS voor specialisten
- /instrumenten/wellnext-scan — WellNext Scan handleiding
- /instrumenten/whats-up — What's Up handleiding
- /ledenbeheer — Leden beheren
- /evaluaties — Evaluaties opzetten
- /rapportage — Rapportage
- /faq — Veelgestelde vragen
- /videos — Instructievideo's
- /contact — Contact opnemen

INHOUD VAN HET SUPPORT PORTAAL:
${context}`;
}

/**
 * Send a chat message to Claude API and return the response
 */
async function chatWithClaude(messages, systemPrompt) {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is niet geconfigureerd. Voeg deze toe aan het .env bestand.');
  }

  // Convert messages to Claude API format
  const apiMessages = messages.map(m => ({
    role: m.role === 'user' ? 'user' : 'assistant',
    content: m.content
  }));

  const requestBody = JSON.stringify({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: systemPrompt,
    messages: apiMessages
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode !== 200) {
            reject(new Error(parsed.error?.message || `API error: ${res.statusCode}`));
            return;
          }
          const text = parsed.content?.[0]?.text || 'Geen antwoord ontvangen.';
          resolve(text);
        } catch (e) {
          reject(new Error('Ongeldig API-antwoord'));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('API timeout'));
    });

    req.write(requestBody);
    req.end();
  });
}

module.exports = { buildSystemPrompt, chatWithClaude };
