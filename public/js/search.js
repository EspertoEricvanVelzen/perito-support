// ============================================================
// Search functionality — header search + hero search + suggestions
// ============================================================
(function() {
  const searchToggle = document.getElementById('searchToggle');
  const searchOverlay = document.getElementById('searchOverlay');
  const searchClose = document.getElementById('searchClose');
  const searchInputHeader = document.getElementById('searchInputHeader');
  const searchSuggestions = document.getElementById('searchSuggestions');
  const heroSearchInput = document.getElementById('heroSearchInput');
  const heroSuggestions = document.getElementById('heroSuggestions');
  const mobileMenuToggle = document.getElementById('mobileMenuToggle');
  const mainNav = document.getElementById('mainNav');

  // Mobile menu toggle
  if (mobileMenuToggle && mainNav) {
    mobileMenuToggle.addEventListener('click', function() {
      mainNav.classList.toggle('open');
      this.classList.toggle('active');
    });
  }

  // Header search toggle
  if (searchToggle && searchOverlay) {
    searchToggle.addEventListener('click', function() {
      searchOverlay.classList.add('open');
      if (searchInputHeader) searchInputHeader.focus();
    });
  }
  if (searchClose && searchOverlay) {
    searchClose.addEventListener('click', function() {
      searchOverlay.classList.remove('open');
    });
  }

  // Debounce helper
  function debounce(fn, delay) {
    let timer;
    return function(...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  // Fetch search results
  async function fetchSuggestions(query) {
    if (query.length < 2) return [];
    try {
      const res = await fetch('/api/search?q=' + encodeURIComponent(query));
      return await res.json();
    } catch (e) {
      return [];
    }
  }

  // Render suggestions dropdown
  function renderSuggestions(container, results) {
    if (!container) return;
    if (results.length === 0) {
      container.innerHTML = '';
      container.style.display = 'none';
      return;
    }
    container.innerHTML = results.map(function(r) {
      return '<a href="' + r.url + '" class="suggestion-item">' +
        '<strong>' + escapeHtml(r.title) + '</strong>' +
        '<span>' + escapeHtml(r.snippet) + '</span>' +
        '</a>';
    }).join('');
    container.style.display = 'block';
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Bind search inputs
  function bindSearchInput(input, suggestionsContainer) {
    if (!input) return;
    input.addEventListener('input', debounce(async function() {
      const query = this.value.trim();
      if (query.length < 2) {
        renderSuggestions(suggestionsContainer, []);
        return;
      }
      const results = await fetchSuggestions(query);
      renderSuggestions(suggestionsContainer, results);
    }, 250));

    // Close suggestions on click outside
    document.addEventListener('click', function(e) {
      if (suggestionsContainer && !suggestionsContainer.contains(e.target) && e.target !== input) {
        suggestionsContainer.style.display = 'none';
      }
    });
  }

  bindSearchInput(searchInputHeader, searchSuggestions);
  bindSearchInput(heroSearchInput, heroSuggestions);

  // Close overlay on Escape
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && searchOverlay) {
      searchOverlay.classList.remove('open');
    }
  });
})();
