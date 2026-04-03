const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');
const lunr = require('lunr');

// Configure marked for clean HTML
marked.setOptions({
  gfm: true,
  breaks: false
});

/**
 * Load all markdown content for a language and build search index
 */
async function loadContent(lang = 'nl') {
  const contentDir = path.join(__dirname, '..', 'content', lang);
  const pages = {};
  const searchDocs = [];

  // Load top-level pages
  const topFiles = fs.readdirSync(contentDir).filter(f => f.endsWith('.md'));
  for (const file of topFiles) {
    const slug = file.replace('.md', '');
    const fullPath = path.join(contentDir, file);
    const raw = fs.readFileSync(fullPath, 'utf-8');
    const { data: frontmatter, content } = matter(raw);
    const html = marked(content);
    const title = frontmatter.title || extractTitle(content);
    const plainText = stripHtml(html);

    pages[slug] = { slug, title, html, plainText, frontmatter, filePath: fullPath };
    searchDocs.push({ slug, title, body: plainText, url: slugToUrl(slug) });
  }

  // Load instrument pages
  const instrDir = path.join(contentDir, 'instrumenten');
  if (fs.existsSync(instrDir)) {
    const instrFiles = fs.readdirSync(instrDir).filter(f => f.endsWith('.md'));
    for (const file of instrFiles) {
      const slug = `instrumenten/${file.replace('.md', '')}`;
      const fullPath = path.join(instrDir, file);
      const raw = fs.readFileSync(fullPath, 'utf-8');
      const { data: frontmatter, content } = matter(raw);
      const html = marked(content);
      const title = frontmatter.title || extractTitle(content);
      const plainText = stripHtml(html);

      pages[slug] = { slug, title, html, plainText, frontmatter, filePath: fullPath };
      searchDocs.push({ slug, title, body: plainText, url: `/instrumenten/${file.replace('.md', '')}` });
    }
  }

  // Build Lunr search index
  const searchIndex = lunr(function () {
    this.ref('slug');
    this.field('title', { boost: 10 });
    this.field('body');

    // Dutch stemming approximation via pipeline
    this.pipeline.reset();
    this.pipeline.add(lunr.trimmer);

    for (const doc of searchDocs) {
      this.add(doc);
    }
  });

  // Build instrumenten list with metadata
  const instrumenten = getInstrumentList(pages);

  return { pages, searchIndex, searchDocs, instrumenten };
}

/**
 * Get instrument list with descriptions for the overview page
 */
function getInstrumentList(pages) {
  const instruments = [
    {
      slug: 'd-rect',
      name: 'D-RECT',
      shortDesc: 'Opleidingsklimaat evalueren vanuit het perspectief van A(N)IOS.',
      color: '#3290ce',
      icon: 'graduation-cap'
    },
    {
      slug: 'blinc',
      name: 'BLiNC',
      shortDesc: 'Leerklimaat evalueren vanuit het perspectief van verpleegkundigen.',
      color: '#02799f',
      icon: 'heart-pulse'
    },
    {
      slug: 'setq',
      name: 'SETQ / SETQ Focus',
      shortDesc: 'Opleiderskwaliteiten van medisch specialisten evalueren.',
      color: '#f16529',
      icon: 'star'
    },
    {
      slug: 'teamq',
      name: 'TeamQ',
      shortDesc: 'Functioneren van de opleider evalueren door stafleden.',
      color: '#933034',
      icon: 'users'
    },
    {
      slug: 'incept-ifms-coordinatoren',
      name: 'INCEPT/IFMS (coördinatoren)',
      shortDesc: '360-graden feedback voor medisch specialisten opzetten.',
      color: '#ea1d23',
      icon: 'refresh-cw'
    },
    {
      slug: 'incept-ifms-medisch-specialisten',
      name: 'INCEPT/IFMS (specialisten)',
      shortDesc: 'Zelf collega\'s uitnodigen en uw rapport inzien.',
      color: '#3290ce',
      icon: 'user-check'
    },
    {
      slug: 'wellnext-scan',
      name: 'WellNext Scan',
      shortDesc: 'Welzijn en werkbeleving in kaart brengen.',
      color: '#02799f',
      icon: 'smile'
    },
    {
      slug: 'whats-up',
      name: 'What\'s Up',
      shortDesc: 'Korte peiling met eigen open vragen (max. 6).',
      color: '#f16529',
      icon: 'message-circle'
    }
  ];
  return instruments;
}

/**
 * Get a page by slug
 */
function getPage(index, slug) {
  return index ? index.pages[slug] || null : null;
}

/**
 * Get instrumenten list
 */
function getInstrumenten(index) {
  return index ? index.instrumenten : [];
}

/**
 * Search content using Lunr index
 */
function searchContent(index, query) {
  if (!index || !index.searchIndex) return [];
  try {
    // Try exact + wildcard search
    let results = index.searchIndex.search(query);
    if (results.length === 0) {
      // Try with wildcard
      results = index.searchIndex.search(`${query}*`);
    }

    return results.slice(0, 10).map(result => {
      const doc = index.searchDocs.find(d => d.slug === result.ref);
      if (!doc) return null;
      // Create snippet
      const snippet = createSnippet(doc.body, query, 150);
      return {
        title: doc.title,
        url: doc.url,
        snippet
      };
    }).filter(Boolean);
  } catch (e) {
    // Fallback: simple text search
    return index.searchDocs
      .filter(doc => doc.body.toLowerCase().includes(query.toLowerCase()) || doc.title.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 10)
      .map(doc => ({
        title: doc.title,
        url: doc.url,
        snippet: createSnippet(doc.body, query, 150)
      }));
  }
}

/**
 * Extract title from markdown (first # heading)
 */
function extractTitle(markdown) {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : 'Zonder titel';
}

/**
 * Strip HTML tags from string
 */
function stripHtml(html) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Create a text snippet around the search query
 */
function createSnippet(text, query, maxLength = 150) {
  const lower = text.toLowerCase();
  const queryLower = query.toLowerCase();
  const pos = lower.indexOf(queryLower);

  if (pos === -1) {
    return text.substring(0, maxLength) + (text.length > maxLength ? '...' : '');
  }

  const start = Math.max(0, pos - 60);
  const end = Math.min(text.length, pos + query.length + 90);
  let snippet = text.substring(start, end);

  if (start > 0) snippet = '...' + snippet;
  if (end < text.length) snippet = snippet + '...';

  return snippet;
}

/**
 * Map slug to URL
 */
function slugToUrl(slug) {
  const urlMap = {
    'eerste-kennismaking': '/kennismaking',
    'beheren-afdeling': '/ledenbeheer',
    'opzetten-evaluaties': '/evaluaties',
    'rapportage': '/rapportage',
    'veelgestelde-vragen': '/faq'
  };
  return urlMap[slug] || `/${slug}`;
}

module.exports = { loadContent, getPage, getInstrumenten, searchContent };
