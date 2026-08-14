const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');
const btnClear = document.getElementById('btn-clear');

// Multi-turn conversation history
const conversation = [];

// Configure marked.js for clean markdown parsing
if (window.marked) {
  marked.setOptions({
    gfm: true,
    breaks: true
  });
}

// Initial Submit Event
form.addEventListener('submit', function (e) {
  e.preventDefault();
  const userMessage = input.value.trim();
  if (!userMessage) return;
  sendMessage(userMessage);
  input.value = '';
});

// Function to handle sending a message
async function sendMessage(userMessage) {
  // Append user message to UI
  appendMessage('user', userMessage);

  // Add to conversation history array for context
  conversation.push({
    role: 'user',
    parts: [{ text: userMessage }]
  });

  // Display temporary bot loading state
  const botMsgElement = appendMessage('bot', '<i class="fa-solid fa-spinner fa-spin"></i> AI Travel Buddy sedang berpikir...');

  try {
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ conversation })
    });

    const data = await response.json();

    if (response.ok && data.result) {
      renderContent(botMsgElement, data.result);
      // Save model reply into conversation history
      conversation.push({
        role: 'model',
        parts: [{ text: data.result }]
      });
    } else {
      renderContent(botMsgElement, '⚠️ **Maaf**, terjadi kesalahan saat menghubungi server: ' + (data.error || 'Gagal mendapat respons.'));
      conversation.pop(); // Remove un-responded user message
    }
  } catch (error) {
    console.error('Fetch error:', error);
    renderContent(botMsgElement, '⚠️ **Gagal terhubung ke server backend**. Pastikan server Node.js berjalan di port 3000.');
    conversation.pop();
  }
}

// Append message element to chat container
function appendMessage(sender, text) {
  const msg = document.createElement('div');
  msg.classList.add('message', sender);
  renderContent(msg, text);
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
  return msg;
}

// Render content using Marked.js or fallback
function renderContent(element, text) {
  if (element.classList.contains('user')) {
    element.textContent = text;
    return;
  }

  if (window.marked && typeof window.marked.parse === 'function') {
    element.innerHTML = window.marked.parse(text);
  } else {
    // Basic Markdown fallback
    let formatted = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^\* (.*$)/gim, '<li>$1</li>')
      .replace(/\n/g, '<br>');
    element.innerHTML = formatted;
  }
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Switch Active Tab Function
function switchTab(targetTab) {
  // Update active tab buttons in search widget
  document.querySelectorAll('.tab-btn').forEach(btn => {
    if (btn.getAttribute('data-tab') === targetTab) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Update navbar active state if linked to a tab
  document.querySelectorAll('.nav-menu .nav-link').forEach(nav => {
    if (nav.getAttribute('data-tab-target') === targetTab) {
      nav.classList.add('active');
    } else if (nav.getAttribute('data-tab-target')) {
      nav.classList.remove('active');
    }
  });

  // Show target tab pane
  document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
  const targetPane = document.getElementById(`pane-${targetTab}`);
  if (targetPane) {
    targetPane.classList.add('active');
  }
}

// Tab Switching Event Listeners for Widget Buttons
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const targetTab = btn.getAttribute('data-tab');
    if (targetTab) switchTab(targetTab);
  });
});

// Navbar Link Click Handlers
document.querySelectorAll('.nav-menu .nav-link').forEach(nav => {
  nav.addEventListener('click', (e) => {
    const targetTab = nav.getAttribute('data-tab-target');
    if (targetTab) {
      e.preventDefault();
      switchTab(targetTab);
      const widget = document.getElementById('search-widget');
      if (widget) widget.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// Search Tab Submit Handlers
document.querySelectorAll('.btn-tab-submit').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    const type = btn.getAttribute('data-type');
    let promptText = '';

    if (type === 'flight') {
      const from = document.getElementById('flight-from').value.trim() || 'Jakarta';
      const to = document.getElementById('flight-to').value.trim() || 'Bali';
      const date = document.getElementById('flight-date').value || '20 Agustus 2026';
      promptText = `Cari penerbangan tiket pesawat dari ${from} ke ${to} pada tanggal ${date}. Berikan rekomendasi maskapai, estimasi harga tiket, dan tips waktu terbaik terbang.`;
    } else if (type === 'hotel') {
      const dest = document.getElementById('hotel-dest').value.trim() || 'Bandung';
      const checkin = document.getElementById('hotel-checkin').value || '20 Agustus 2026';
      const guests = document.getElementById('hotel-guests').value.trim() || '2 Tamu, 1 Kamar';
      promptText = `Rekomendasikan hotel dan penginapan terbaik di ${dest} untuk check-in tanggal ${checkin} dengan ${guests}. Sertakan rekomendasi hotel bintang 3-5, kisaran harga per malam, serta area yang strategis.`;
    } else if (type === 'train') {
      const from = document.getElementById('train-from').value.trim() || 'Gambir (Jakarta)';
      const to = document.getElementById('train-to').value.trim() || 'Tugu Yogyakarta';
      const date = document.getElementById('train-date').value || '20 Agustus 2026';
      promptText = `Cari info tiket kereta api dari stasiun ${from} ke ${to} untuk keberangkatan tanggal ${date}. Berikan rincian kelas kereta (Eksekutif/Ekonomi), nama kereta, jadwal, dan estimasi tarif.`;
    } else if (type === 'xperience') {
      const loc = document.getElementById('xperience-loc').value.trim() || 'Bali';
      const cat = document.getElementById('xperience-cat').value;
      const date = document.getElementById('xperience-date').value || '20 Agustus 2026';
      promptText = `Rekomendasikan tempat wisata Xperience & hiburan kategori "${cat}" di ${loc} untuk tanggal ${date}. Berikan daftar atraksi paling populer, harga tiket masuk, dan tips berkunjung.`;
    } else if (type === 'ai') {
      const dest = document.getElementById('ai-dest').value.trim() || 'Labuan Bajo';
      const duration = document.getElementById('ai-duration').value.trim() || '3 Hari 2 Malam';
      const budget = document.getElementById('ai-budget').value;
      promptText = `Buatkan rencana liburan lengkap (itinerary) ke ${dest} selama ${duration} dengan tipe budget ${budget}. Berikan rekomendasi rute harian, tempat wisata wajib, spot foto, kuliner lokal, dan perkiraan rincian biaya.`;
    }

    if (promptText) {
      scrollToAiSection();
      sendMessage(promptText);
    }
  });
});

// Suggestion Chips Click Handlers
document.querySelectorAll('.chip').forEach(chip => {
  chip.addEventListener('click', () => {
    const promptText = chip.getAttribute('data-prompt');
    if (promptText) {
      scrollToAiSection();
      sendMessage(promptText);
    }
  });
});

// Destination Cards "Tanya AI" Click Handlers
document.querySelectorAll('.btn-card-ask').forEach(btn => {
  btn.addEventListener('click', () => {
    const promptText = btn.getAttribute('data-prompt');
    if (promptText) {
      scrollToAiSection();
      sendMessage(promptText);
    }
  });
});

// Promo Buttons Click Handlers
document.querySelectorAll('.btn-promo-ask').forEach(btn => {
  btn.addEventListener('click', () => {
    const promptText = btn.getAttribute('data-prompt');
    if (promptText) {
      scrollToAiSection();
      sendMessage(promptText);
    }
  });
});

// Reset Chat Handler
if (btnClear) {
  btnClear.addEventListener('click', () => {
    conversation.length = 0;
    chatBox.innerHTML = `
      <div class="message bot welcome-message">
        <div class="bot-welcome-header">
          <i class="fa-solid fa-hand-wave"></i> Halo! Saya <strong>Travel Buddy AI Assistant</strong>.
        </div>
        Percakapan telah direset. Ada yang bisa saya bantu untuk rencana liburan Anda selanjutnya?
      </div>
    `;
  });
}

function scrollToAiSection() {
  const aiSection = document.getElementById('ai-assistant');
  if (aiSection) {
    aiSection.scrollIntoView({ behavior: 'smooth' });
  }
}
