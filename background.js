// ==== FILE 2: background.js ====
// Background service worker - the brain of the extension
console.log('🎵 HUM Background Script Loading...');

// AI Platform Detection Patterns
const AI_PLATFORMS = {
  'claude.ai': {
    name: 'Claude',
    icon: '🤖',
    selectors: {
      chatContainer: '[data-testid="conversation"]',
      messageInput: 'div[contenteditable="true"]',
      messages: '[data-testid="message"]'
    }
  },
  'chat.openai.com': {
    name: 'ChatGPT', 
    icon: '💬',
    selectors: {
      chatContainer: 'main',
      messageInput: '#prompt-textarea',
      messages: '[data-message-author-role]'
    }
  },
  'x.com': {
    name: 'Grok',
    icon: '⚡', 
    selectors: {
      chatContainer: '[data-testid="grok-chat"]',
      messageInput: '[data-testid="grok-input"]',
      messages: '[data-testid="grok-message"]'
    }
  },
  'gemini.google.com': {
    name: 'Gemini',
    icon: '💎',
    selectors: {
      chatContainer: '[data-testid="chat-container"]',
      messageInput: 'rich-textarea',
      messages: 'message-content'
    }
  }
};

// Track active AI tabs
let activeAITabs = new Map();

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    checkForAIPlatform(tabId, tab.url);
  }
});

// Listen for tab activation
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab.url) {
      checkForAIPlatform(activeInfo.tabId, tab.url);
    }
  });
});

// Check if URL matches any AI platform
function checkForAIPlatform(tabId, url) {
  const urlObj = new URL(url);
  const domain = urlObj.hostname;
  
  // Check if this domain matches any AI platform
  for (const [platformDomain, platformInfo] of Object.entries(AI_PLATFORMS)) {
    if (domain.includes(platformDomain.split('.')[0])) {
      console.log(`🎯 Detected ${platformInfo.name} on tab ${tabId}`);
      
      // Store active AI tab info
      activeAITabs.set(tabId, {
        platform: platformDomain,
        name: platformInfo.name,
        icon: platformInfo.icon,
        url: url,
        detected: Date.now()
      });
      
      // Check if this AI is enabled in user preferences
      checkUserPreferences(tabId, platformDomain, platformInfo);
      return;
    }
  }
  
  // Remove from active tabs if not an AI platform
  if (activeAITabs.has(tabId)) {
    console.log(`📤 Left AI platform on tab ${tabId}`);
    activeAITabs.delete(tabId);
  }
}

// Check user preferences and activate overlay if enabled
function checkUserPreferences(tabId, platformDomain, platformInfo) {
  chrome.storage.local.get(['hum_selected_ais'], (result) => {
    const selectedAIs = result.hum_selected_ais || {};
    const platformKey = platformDomain.split('.')[0]; // claude, chatgpt, etc.
    
    if (selectedAIs[platformKey]) {
      console.log(`✅ ${platformInfo.name} is enabled - activating overlay`);
      activateOverlay(tabId, platformInfo);
    } else {
      console.log(`❌ ${platformInfo.name} not selected - overlay inactive`);
    }
  });
}

// Activate the overlay on the detected tab
function activateOverlay(tabId, platformInfo) {
  // Inject the overlay content script if not already injected
  chrome.tabs.sendMessage(tabId, {
    action: 'ACTIVATE_HUM_OVERLAY',
    platform: platformInfo
  }, (response) => {
    if (chrome.runtime.lastError) {
      console.log('🔄 Injecting HUM overlay script...');
      // Content script not ready, it will auto-activate when loaded
    } else {
      console.log(`🎵 HUM overlay activated on ${platformInfo.name}`);
    }
  });
}

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('📨 Background received:', message);
  
  switch (message.action) {
    case 'HUM_OVERLAY_READY':
      console.log(`🎵 Overlay ready on ${message.platform}`);
      sendResponse({ status: 'acknowledged' });
      break;
      
    case 'CONVERSATION_CAPTURED':
      console.log(`💾 Conversation captured: ${message.data.length} messages`);
      // Store conversation data
      storeConversation(message.data, message.platform);
      sendResponse({ status: 'stored' });
      break;
      
    case 'GET_ACTIVE_PLATFORMS':
      sendResponse({ platforms: Array.from(activeAITabs.values()) });
      break;
  }
});

// Store captured conversation
function storeConversation(conversationData, platform) {
  const timestamp = Date.now();
  const conversationId = `${platform}_${timestamp}`;
  
  chrome.storage.local.set({
    [`conversation_${conversationId}`]: {
      id: conversationId,
      platform: platform,
      timestamp: timestamp,
      messages: conversationData,
      captured: new Date().toISOString()
    }
  }, () => {
    console.log(`💾 Stored conversation: ${conversationId}`);
  });
}
