// ==== FILE 3: content.js ====
// Content script - runs on AI websites
console.log('🎵 HUM Content Script Loading...');

let humOverlayActive = false;
let platformInfo = null;
let conversationObserver = null;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeHUM);
} else {
  initializeHUM();
}

function initializeHUM() {
  console.log('🔄 Initializing HUM on:', window.location.hostname);
  
  // Detect which platform we're on
  detectPlatform();
  
  // Listen for activation messages from background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'ACTIVATE_HUM_OVERLAY') {
      platformInfo = message.platform;
      activateOverlay();
      sendResponse({ status: 'activated' });
    }
  });
  
  // Auto-check if we should be active
  checkShouldBeActive();
}

function detectPlatform() {
  const hostname = window.location.hostname;
  
  if (hostname.includes('claude')) {
    platformInfo = { name: 'Claude', icon: '🤖', key: 'claude' };
  } else if (hostname.includes('openai')) {
    platformInfo = { name: 'ChatGPT', icon: '💬', key: 'chatgpt' };
  } else if (hostname.includes('x.com')) {
    platformInfo = { name: 'Grok', icon: '⚡', key: 'grok' };
  } else if (hostname.includes('gemini')) {
    platformInfo = { name: 'Gemini', icon: '💎', key: 'gemini' };
  }
  
  if (platformInfo) {
    console.log(`🎯 Platform detected: ${platformInfo.name}`);
  }
}

function checkShouldBeActive() {
  if (!platformInfo) return;
  
  // Check with background script if this platform is enabled
  chrome.runtime.sendMessage({
    action: 'CHECK_PLATFORM_ENABLED',
    platform: platformInfo.key
  });
}

function activateOverlay() {
  if (humOverlayActive) {
    console.log('🎵 HUM overlay already active');
    return;
  }
  
  console.log(`🎵 Activating HUM overlay on ${platformInfo.name}`);
  
  // Create the overlay
  createOverlayInterface();
  
  // Start conversation monitoring
  startConversationMonitoring();
  
  // Mark as active
  humOverlayActive = true;
  
  // Notify background script
  chrome.runtime.sendMessage({
    action: 'HUM_OVERLAY_READY',
    platform: platformInfo.name
  });
}

function createOverlayInterface() {
  // Create overlay container
  const overlay = document.createElement('div');
  overlay.id = 'hum-overlay';
  overlay.innerHTML = `
    <div class="hum-status-bar">
      <div class="hum-indicator">
        <div class="hum-icon">${platformInfo.icon}</div>
        <div class="hum-text">HUM Active on ${platformInfo.name}</div>
        <div class="hum-pulse"></div>
      </div>
      <div class="hum-controls">
        <button class="hum-btn" onclick="humToggleCapture()" title="Toggle conversation capture">
          📝
        </button>
        <button class="hum-btn" onclick="humShowTools()" title="Show HUM tools">
          🔧
        </button>
        <button class="hum-btn" onclick="humMinimize()" title="Minimize">
          ➖
        </button>
      </div>
    </div>
    <div class="hum-tools" id="hum-tools" style="display: none;">
      <div class="hum-tool-section">
        <h4>🎵 Enhancement Tools</h4>
        <button class="hum-tool-btn" onclick="humBroadcastMode()">📡 Broadcast Mode</button>
        <button class="hum-tool-btn" onclick="humExportChat()">📤 Export Chat</button>
        <button class="hum-tool-btn" onclick="humSummarize()">📋 Summarize</button>
      </div>
      <div class="hum-status">
        <span id="hum-capture-status">🟢 Capturing: ON</span> | 
        <span id="hum-message-count">Messages: 0</span>
      </div>
    </div>
  `;
  
  document.body.appendChild(overlay);
  console.log('🎨 HUM overlay interface created');
}

function startConversationMonitoring() {
  console.log('👁️ Starting conversation monitoring...');
  
  // Look for existing messages
  captureExistingMessages();
  
  // Set up observer for new messages
  setupMessageObserver();
}

function captureExistingMessages() {
  // This will be platform-specific in Hour 3
  // For now, just detect that there are messages
  const messageElements = document.querySelectorAll('[role="presentation"], [data-testid="message"], .message');
  
  if (messageElements.length > 0) {
    console.log(`📝 Found ${messageElements.length} existing messages`);
    updateMessageCount(messageElements.length);
  }
}

function setupMessageObserver() {
  // Watch for DOM changes to detect new messages
  conversationObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length > 0) {
        // Check if new message-like elements were added
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1 && isMessageElement(node)) {
            console.log('📝 New message detected');
            onNewMessage(node);
          }
        });
      }
    });
  });
  
  // Start observing
  conversationObserver.observe(document.body, {
    childList: true,
    subtree: true
  });
}

function isMessageElement(element) {
  // Basic detection - will be refined in Hour 3
  const messageSelectors = ['message', 'chat-message', 'conversation-turn'];
  return messageSelectors.some(selector => 
    element.classList?.contains(selector) || 
    element.querySelector?.(`[class*="${selector}"]`)
  );
}

function onNewMessage(messageElement) {
  // Update message count
  const currentCount = parseInt(document.getElementById('hum-message-count')?.textContent?.match(/\d+/)?.[0] || '0');
  updateMessageCount(currentCount + 1);
  
  // In Hour 4, this will extract and store the actual message content
  console.log('📝 Message captured (content extraction in Hour 4)');
}

function updateMessageCount(count) {
  const countElement = document.getElementById('hum-message-count');
  if (countElement) {
    countElement.textContent = `Messages: ${count}`;
  }
}

// Global functions for overlay buttons
window.humToggleCapture = function() {
  const status = document.getElementById('hum-capture-status');
  const isCapturing = status.textContent.includes('ON');
  
  if (isCapturing) {
    status.textContent = '🔴 Capturing: OFF';
    status.style.color = '#ef4444';
    if (conversationObserver) {
      conversationObserver.disconnect();
    }
  } else {
    status.textContent = '🟢 Capturing: ON'; 
    status.style.color = '#4ade80';
    setupMessageObserver();
  }
  
  console.log(`📝 Capture toggled: ${!isCapturing ? 'ON' : 'OFF'}`);
};

window.humShowTools = function() {
  const tools = document.getElementById('hum-tools');
  tools.style.display = tools.style.display === 'none' ? 'block' : 'none';
};

window.humMinimize = function() {
  const overlay = document.getElementById('hum-overlay');
  overlay.classList.toggle('minimized');
};

window.humBroadcastMode = function() {
  alert('📡 Broadcast Mode\n\nThis will allow you to send messages to multiple AIs simultaneously!\n\nComing in Hour 3! 🚀');
};

window.humExportChat = function() {
  alert('📤 Export Chat\n\nThis will export the current conversation in multiple formats (MD, PDF, JSON)!\n\nComing in Hour 4! 🚀');
};

window.humSummarize = function() {
  alert('📋 Summarize\n\nThis will generate an AI-powered summary of the conversation!\n\nComing in Hour 4! 🚀');
};

console.log('✅ HUM Content Script Ready');
