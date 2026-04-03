// ============================================================
// Perito Support Chat Widget — Claude-powered AI assistant
// ============================================================
(function() {
  // State
  var isOpen = false;
  var messages = [];
  var isLoading = false;

  // Create chat widget HTML
  var widget = document.createElement('div');
  widget.id = 'chatWidget';
  widget.innerHTML = [
    '<button class="chat-fab" id="chatFab" aria-label="Chat openen">',
    '  <svg class="chat-fab-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>',
    '  <svg class="chat-fab-close" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
    '</button>',
    '<div class="chat-window" id="chatWindow">',
    '  <div class="chat-header">',
    '    <div class="chat-header-info">',
    '      <div class="chat-avatar">P</div>',
    '      <div>',
    '        <div class="chat-header-title">Perito Support</div>',
    '        <div class="chat-header-status">AI-assistent</div>',
    '      </div>',
    '    </div>',
    '    <button class="chat-header-close" id="chatClose" aria-label="Chat sluiten">',
    '      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
    '    </button>',
    '  </div>',
    '  <div class="chat-messages" id="chatMessages">',
    '    <div class="chat-message assistant">',
    '      <div class="chat-bubble">Hallo! Ik ben de Perito support-assistent. Stel gerust uw vraag over het platform, de instrumenten of het opzetten van evaluaties.</div>',
    '    </div>',
    '  </div>',
    '  <form class="chat-input-form" id="chatForm">',
    '    <input type="text" class="chat-input" id="chatInput" placeholder="Stel uw vraag..." autocomplete="off">',
    '    <button type="submit" class="chat-send" id="chatSend" aria-label="Versturen">',
    '      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>',
    '    </button>',
    '  </form>',
    '</div>'
  ].join('\n');

  document.body.appendChild(widget);

  // Elements
  var fab = document.getElementById('chatFab');
  var chatWindow = document.getElementById('chatWindow');
  var chatClose = document.getElementById('chatClose');
  var chatMessages = document.getElementById('chatMessages');
  var chatForm = document.getElementById('chatForm');
  var chatInput = document.getElementById('chatInput');

  // Toggle chat
  function toggleChat() {
    isOpen = !isOpen;
    widget.classList.toggle('open', isOpen);
    if (isOpen) chatInput.focus();
  }

  fab.addEventListener('click', toggleChat);
  chatClose.addEventListener('click', toggleChat);

  // Add message to chat
  function addMessage(role, content) {
    var msgDiv = document.createElement('div');
    msgDiv.className = 'chat-message ' + role;
    var bubble = document.createElement('div');
    bubble.className = 'chat-bubble';

    // Convert markdown-like links to HTML
    var html = escapeHtml(content);
    // Convert [text](url) to links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
    // Convert **bold** to <strong>
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    // Convert newlines
    html = html.replace(/\n/g, '<br>');

    bubble.innerHTML = html;
    msgDiv.appendChild(bubble);
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // Show typing indicator
  function showTyping() {
    var typing = document.createElement('div');
    typing.className = 'chat-message assistant';
    typing.id = 'chatTyping';
    typing.innerHTML = '<div class="chat-bubble chat-typing"><span></span><span></span><span></span></div>';
    chatMessages.appendChild(typing);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function hideTyping() {
    var typing = document.getElementById('chatTyping');
    if (typing) typing.remove();
  }

  // Send message
  chatForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    var text = chatInput.value.trim();
    if (!text || isLoading) return;

    // Add user message
    messages.push({ role: 'user', content: text });
    addMessage('user', text);
    chatInput.value = '';
    isLoading = true;

    showTyping();

    try {
      var res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: messages })
      });
      var data = await res.json();

      hideTyping();

      if (data.error) {
        addMessage('assistant', 'Er is een fout opgetreden: ' + data.error);
      } else {
        messages.push({ role: 'assistant', content: data.reply });
        addMessage('assistant', data.reply);
      }
    } catch (err) {
      hideTyping();
      addMessage('assistant', 'Er is een verbindingsfout opgetreden. Probeer het later opnieuw of neem contact op via support@peritoprofessionalperformance.nl.');
    }

    isLoading = false;
  });

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
})();
