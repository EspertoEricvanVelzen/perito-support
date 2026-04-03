// ============================================================
// Contact form — smart suggestions before submitting
// ============================================================
(function() {
  const vraagInput = document.getElementById('vraag');
  const suggestionsEl = document.getElementById('contactSuggestions');
  const resultsEl = document.getElementById('suggestionResults');

  if (!vraagInput || !suggestionsEl || !resultsEl) return;

  let debounceTimer;

  vraagInput.addEventListener('input', function() {
    clearTimeout(debounceTimer);
    const query = this.value.trim();
    if (query.length < 5) {
      suggestionsEl.style.display = 'none';
      return;
    }
    debounceTimer = setTimeout(async function() {
      try {
        const res = await fetch('/api/search?q=' + encodeURIComponent(query));
        const results = await res.json();
        if (results.length > 0) {
          resultsEl.innerHTML = results.slice(0, 3).map(function(r) {
            return '<a href="' + r.url + '" class="suggestion-card" target="_blank">' +
              '<strong>' + escapeHtml(r.title) + '</strong>' +
              '<p>' + escapeHtml(r.snippet) + '</p>' +
            '</a>';
          }).join('');
          suggestionsEl.style.display = 'block';
        } else {
          suggestionsEl.style.display = 'none';
        }
      } catch (e) {
        suggestionsEl.style.display = 'none';
      }
    }, 400);
  });

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
})();
