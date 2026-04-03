require('dotenv').config();
const express = require('express');
const path = require('path');
const { loadContent, getPage, getInstrumenten, searchContent } = require('./lib/markdown');
const { sendContactEmail } = require('./lib/mailer');
const { buildSystemPrompt, chatWithClaude } = require('./lib/chat');

const app = express();
const PORT = process.env.PORT || 3000;
const LANG = 'nl';

// Middleware
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Load all content at startup
let contentIndex;
loadContent(LANG).then(index => {
  contentIndex = index;
  console.log(`Loaded ${Object.keys(index.pages).length} pages, ${index.instrumenten.length} instrumenten`);
});

// Helper: common template data
function templateData(req, extra = {}) {
  return {
    currentPath: req.path,
    lang: LANG,
    instrumenten: contentIndex ? contentIndex.instrumenten : [],
    ...extra
  };
}

// ============================================================
// ROUTES
// ============================================================

// Home
app.get('/', (req, res) => {
  const popularPages = [
    { title: 'Eerste kennismaking', url: '/kennismaking', icon: 'book-open', desc: 'Maak kennis met het platform' },
    { title: 'Instrumenten', url: '/instrumenten', icon: 'clipboard-list', desc: 'Bekijk alle evaluatie-instrumenten' },
    { title: 'Ledenbeheer', url: '/ledenbeheer', icon: 'users', desc: 'Leden toevoegen, bewerken en beheren' },
    { title: 'Veelgestelde vragen', url: '/faq', icon: 'help-circle', desc: 'Antwoorden op veelgestelde vragen' },
    { title: 'Instrument-wizard', url: '/instrument-wizard', icon: 'compass', desc: 'Vind het juiste instrument' },
    { title: 'Contact', url: '/contact', icon: 'mail', desc: 'Stel uw vraag aan ons team' }
  ];
  res.render('home', templateData(req, { popularPages }));
});

// Eerste kennismaking
app.get('/kennismaking', (req, res) => {
  const page = getPage(contentIndex, 'eerste-kennismaking');
  if (!page) return res.status(404).render('404', templateData(req));
  res.render('article', templateData(req, { page, breadcrumb: 'Eerste kennismaking' }));
});

// Instrumenten overview
app.get('/instrumenten', (req, res) => {
  const instruments = getInstrumenten(contentIndex);
  res.render('instrumenten', templateData(req, { instruments }));
});

// Instrument detail
app.get('/instrumenten/:slug', (req, res) => {
  const page = getPage(contentIndex, `instrumenten/${req.params.slug}`);
  if (!page) return res.status(404).render('404', templateData(req));
  res.render('article', templateData(req, { page, breadcrumb: page.title, parentBreadcrumb: { title: 'Instrumenten', url: '/instrumenten' } }));
});

// Instrument wizard
app.get('/instrument-wizard', (req, res) => {
  const wizardFlow = require('./data/wizard-flow.json');
  res.render('wizard', templateData(req, { wizardFlow }));
});

// Ledenbeheer
app.get('/ledenbeheer', (req, res) => {
  const page = getPage(contentIndex, 'beheren-afdeling');
  if (!page) return res.status(404).render('404', templateData(req));
  res.render('article', templateData(req, { page, breadcrumb: 'Ledenbeheer' }));
});

// Evaluaties opzetten
app.get('/evaluaties', (req, res) => {
  const page = getPage(contentIndex, 'opzetten-evaluaties');
  if (!page) return res.status(404).render('404', templateData(req));
  res.render('article', templateData(req, { page, breadcrumb: 'Evaluaties opzetten' }));
});

// Rapportage
app.get('/rapportage', (req, res) => {
  const page = getPage(contentIndex, 'rapportage');
  if (!page) return res.status(404).render('404', templateData(req));
  res.render('article', templateData(req, { page, breadcrumb: 'Rapportage' }));
});

// FAQ
app.get('/faq', (req, res) => {
  const page = getPage(contentIndex, 'veelgestelde-vragen');
  if (!page) return res.status(404).render('404', templateData(req));
  res.render('faq', templateData(req, { page }));
});

// Videos
app.get('/videos', (req, res) => {
  const videos = require('./data/videos.json');
  res.render('videos', templateData(req, { videos }));
});

// Contact
app.get('/contact', (req, res) => {
  res.render('contact', templateData(req, { sent: false, error: null }));
});

app.post('/contact', async (req, res) => {
  const { naam, email, onderwerp, vraag } = req.body;
  if (!naam || !email || !vraag) {
    return res.render('contact', templateData(req, { sent: false, error: 'Vul alle verplichte velden in.' }));
  }
  try {
    await sendContactEmail({ naam, email, onderwerp, vraag });
    res.render('contact', templateData(req, { sent: true, error: null }));
  } catch (err) {
    console.error('Email error:', err);
    res.render('contact', templateData(req, { sent: false, error: 'Er is een fout opgetreden bij het versturen. Probeer het later opnieuw of mail direct naar support@peritoprofessionalperformance.nl.' }));
  }
});

// Chat API
let chatSystemPrompt = '';
app.post('/api/chat', async (req, res) => {
  // Build system prompt on first use (after content is loaded)
  if (!chatSystemPrompt && contentIndex) {
    chatSystemPrompt = buildSystemPrompt(contentIndex);
  }
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.json({ error: 'Geen bericht ontvangen.' });
  }
  // Limit conversation history to last 10 messages to manage token usage
  const recentMessages = messages.slice(-10);
  try {
    const reply = await chatWithClaude(recentMessages, chatSystemPrompt);
    res.json({ reply });
  } catch (err) {
    console.error('Chat error:', err.message);
    res.json({ error: err.message });
  }
});

// Search API
app.get('/api/search', (req, res) => {
  const query = req.query.q || '';
  if (query.length < 2) return res.json([]);
  const results = searchContent(contentIndex, query);
  res.json(results);
});

// Search results page
app.get('/zoeken', (req, res) => {
  const query = req.query.q || '';
  const results = query.length >= 2 ? searchContent(contentIndex, query) : [];
  res.render('search-results', templateData(req, { query, results }));
});

// 404 catch-all
app.use((req, res) => {
  res.status(404).render('404', templateData(req));
});

// Start server
app.listen(PORT, () => {
  console.log(`Perito Support Portal running on http://localhost:${PORT}`);
});
