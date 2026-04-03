// ============================================================
// FAQ — filtering by category + search + accordion
// ============================================================
(function() {
  const faqContent = document.getElementById('faqContent');
  const faqSearch = document.getElementById('faqSearch');
  const faqFilters = document.getElementById('faqFilters');
  const noResults = document.getElementById('faqNoResults');

  if (!faqContent) return;

  // Parse FAQ content into sections and items
  const sections = [];
  const allH2 = faqContent.querySelectorAll('h2');

  // Category mapping (h2 text to filter key)
  const categoryMap = {
    'inloggen en toegang': 'inloggen',
    'links en vragenlijsten': 'links',
    'herinneringen en e-mails': 'herinneringen',
    'evaluatierondes opzetten': 'evaluatierondes',
    'deelnemers en ledenbeheer': 'deelnemers',
    'rapporten': 'rapporten',
    'incept/ifms': 'incept',
    'privacy en anonimiteit': 'privacy',
    'technische problemen': 'technisch'
  };

  allH2.forEach(function(h2) {
    const sectionTitle = h2.textContent.trim().toLowerCase();
    const category = categoryMap[sectionTitle] || 'other';

    // Collect all elements between this h2 and the next h2
    let el = h2.nextElementSibling;
    const items = [];
    let currentQuestion = null;
    let currentAnswer = [];

    while (el && el.tagName !== 'H2') {
      if (el.tagName === 'HR') {
        el = el.nextElementSibling;
        continue;
      }

      // Check if this <p> starts with a <strong> that contains a question
      var strong = (el.tagName === 'P') ? el.querySelector('strong:first-child') : null;
      var isQuestion = false;

      if (strong) {
        var strongText = strong.textContent.trim();
        // The <strong> must end with ? and be at the start of the <p>
        if (strongText.endsWith('?')) {
          isQuestion = true;
        }
      }

      if (isQuestion) {
        // Save previous Q&A
        if (currentQuestion) {
          items.push({ question: currentQuestion, answer: currentAnswer.join(''), category: category });
        }
        currentQuestion = strong.textContent.trim();
        currentAnswer = [];

        // The answer might be in the same <p> element, after the <strong>
        // Extract the text after </strong> as the first part of the answer
        var clone = el.cloneNode(true);
        var strongInClone = clone.querySelector('strong:first-child');
        if (strongInClone) strongInClone.remove();
        var remainingHtml = clone.innerHTML.trim();
        // Remove leading <br> tags
        remainingHtml = remainingHtml.replace(/^(<br\s*\/?>|\s)+/i, '');
        if (remainingHtml) {
          currentAnswer.push('<p>' + remainingHtml + '</p>');
        }
      } else if (currentQuestion) {
        currentAnswer.push(el.outerHTML);
      }

      el = el.nextElementSibling;
    }
    // Save last Q&A
    if (currentQuestion) {
      items.push({ question: currentQuestion, answer: currentAnswer.join(''), category: category });
    }

    sections.push({ title: h2.textContent.trim(), category: category, items: items, h2: h2 });
  });

  // Rebuild as accordion
  function renderFaq(filter, searchQuery) {
    var html = '';
    var visibleCount = 0;
    var query = (searchQuery || '').toLowerCase();

    sections.forEach(function(section) {
      var filteredItems = section.items.filter(function(item) {
        var matchesCategory = filter === 'all' || item.category === filter;
        var matchesSearch = !query ||
          item.question.toLowerCase().includes(query) ||
          item.answer.toLowerCase().includes(query);
        return matchesCategory && matchesSearch;
      });

      if (filteredItems.length === 0) return;
      visibleCount += filteredItems.length;

      html += '<div class="faq-section" data-category="' + section.category + '">';
      html += '<h2 class="faq-section-title">' + section.title + '</h2>';
      filteredItems.forEach(function(item) {
        var highlighted = query ? highlightText(item.question, query) : escapeHtml(item.question);
        html += '<div class="faq-item">';
        html += '<button class="faq-question" aria-expanded="false">';
        html += '<span>' + highlighted + '</span>';
        html += '<svg class="faq-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>';
        html += '</button>';
        html += '<div class="faq-answer">' + item.answer + '</div>';
        html += '</div>';
      });
      html += '</div>';
    });

    faqContent.innerHTML = html;
    if (noResults) noResults.style.display = visibleCount === 0 ? 'block' : 'none';

    // Bind accordion clicks
    faqContent.querySelectorAll('.faq-question').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var expanded = this.getAttribute('aria-expanded') === 'true';
        this.setAttribute('aria-expanded', String(!expanded));
        this.parentElement.classList.toggle('open');
      });
    });
  }

  function highlightText(text, query) {
    var safe = escapeHtml(text);
    var regex = new RegExp('(' + escapeRegex(query) + ')', 'gi');
    return safe.replace(regex, '<mark>$1</mark>');
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Filter buttons
  var activeCategory = 'all';
  if (faqFilters) {
    faqFilters.addEventListener('click', function(e) {
      var btn = e.target.closest('.faq-filter');
      if (!btn) return;
      activeCategory = btn.dataset.category;
      faqFilters.querySelectorAll('.faq-filter').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      renderFaq(activeCategory, faqSearch ? faqSearch.value : '');
    });
  }

  // Search input
  if (faqSearch) {
    var debounceTimer;
    faqSearch.addEventListener('input', function() {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function() {
        renderFaq(activeCategory, faqSearch.value);
      }, 200);
    });
  }

  // Initial render
  renderFaq('all', '');
})();
