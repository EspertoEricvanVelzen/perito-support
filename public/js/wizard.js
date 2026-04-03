// ============================================================
// Instrument Wizard — step-by-step decision flow
// ============================================================
(function() {
  if (typeof wizardFlow === 'undefined') return;

  const steps = wizardFlow.steps;
  const stepEl = document.getElementById('wizardStep');
  const resultEl = document.getElementById('wizardResult');
  const backBtn = document.getElementById('wizardBack');
  const restartBtn = document.getElementById('wizardRestart');
  const progressBar = document.getElementById('wizardProgressBar');

  let history = [];
  let currentStepId = steps[0].id;
  let maxDepth = 3; // max questions before result

  function findStep(id) {
    return steps.find(function(s) { return s.id === id; });
  }

  function updateProgress() {
    const pct = Math.min((history.length / maxDepth) * 100, 100);
    if (progressBar) progressBar.style.width = pct + '%';
  }

  function renderStep(stepId) {
    const step = findStep(stepId);
    if (!step) return;

    currentStepId = stepId;
    updateProgress();

    // Show/hide back button
    if (backBtn) backBtn.style.display = history.length > 0 ? 'inline-flex' : 'none';
    if (restartBtn) restartBtn.style.display = 'none';

    if (step.result) {
      // Show result
      stepEl.style.display = 'none';
      resultEl.style.display = 'block';
      resultEl.innerHTML =
        '<div class="wizard-result-card" style="border-left-color: ' + step.result.color + '">' +
          '<div class="wizard-result-badge" style="background: ' + step.result.color + '">Aanbevolen instrument</div>' +
          '<h2>' + step.result.instrument + '</h2>' +
          '<p>' + step.result.description + '</p>' +
          '<a href="' + step.result.url + '" class="btn btn-primary">Bekijk de handleiding</a>' +
        '</div>';
      if (restartBtn) restartBtn.style.display = 'inline-flex';
      if (progressBar) progressBar.style.width = '100%';
    } else {
      // Show question
      stepEl.style.display = 'block';
      resultEl.style.display = 'none';
      stepEl.innerHTML =
        '<h2 class="wizard-question">' + step.question + '</h2>' +
        '<div class="wizard-options">' +
          step.options.map(function(opt) {
            return '<button class="wizard-option" data-next="' + opt.next + '">' +
              '<span class="wizard-option-label">' + opt.label + '</span>' +
              '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>' +
            '</button>';
          }).join('') +
        '</div>';

      // Bind option clicks
      stepEl.querySelectorAll('.wizard-option').forEach(function(btn) {
        btn.addEventListener('click', function() {
          history.push(currentStepId);
          renderStep(this.dataset.next);
        });
      });
    }
  }

  // Back button
  if (backBtn) {
    backBtn.addEventListener('click', function() {
      if (history.length > 0) {
        var prevId = history.pop();
        renderStep(prevId);
      }
    });
  }

  // Restart
  if (restartBtn) {
    restartBtn.addEventListener('click', function() {
      history = [];
      renderStep(steps[0].id);
    });
  }

  // Initialize
  renderStep(steps[0].id);
})();
