console.log('🎵 HUM Extension Popup Loading...');

// Update platform status when popup opens
document.addEventListener('DOMContentLoaded', function() {
    updatePlatformStatus();
    
    // Add event listeners for buttons (CSP compliant)
    document.getElementById('settingsBtn').addEventListener('click', openHumPage);
    document.getElementById('testBtn').addEventListener('click', testOverlay);
});

function updatePlatformStatus() {
    // Get current tab to check if it's an AI platform
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const currentTab = tabs[0];
        if (currentTab && currentTab.url) {
            checkCurrentPlatform(currentTab.url);
        }
    });
    
    // Get active platforms from background script
    chrome.runtime.sendMessage({action: 'GET_ACTIVE_PLATFORMS'}, function(response) {
        if (response && response.platforms) {
            displayActivePlatforms(response.platforms);
        }
    });
}

function checkCurrentPlatform(url) {
    const hostname = new URL(url).hostname;
    const platforms = ['claude', 'openai', 'x.com', 'gemini'];
    
    platforms.forEach(platform => {
        const elements = document.querySelectorAll(`[data-platform="${platform}"]`);
        elements.forEach(el => {
            if (hostname.includes(platform)) {
                el.classList.remove('platform-inactive');
                el.classList.add('platform-active');
                el.querySelector('.platform-status').textContent = 'Active';
                el.querySelector('.platform-status').className = 'platform-status status-active';
            }
        });
    });
}

function displayActivePlatforms(platforms) {
    platforms.forEach(platform => {
        const platformKey = platform.platform.split('.')[0];
        const element = document.querySelector(`[data-platform="${platformKey}"]`);
        if (element) {
            element.classList.remove('platform-inactive');
            element.classList.add('platform-active');
            element.querySelector('.platform-status').textContent = 'Detected';
            element.querySelector('.platform-status').className = 'platform-status status-active';
        }
    });
}

function openHumPage() {
    chrome.tabs.create({
        url: 'https://tellyourphone.com/AlternativeIntelligenceHUM/'
    });
    window.close();
}

function testOverlay() {
    console.log('🧪 Test button clicked');
    
    // Send test message to current tab
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, {
                action: 'TEST_OVERLAY'
            }, function(response) {
                if (chrome.runtime.lastError) {
                    console.log('❌ Error:', chrome.runtime.lastError);
                    alert('Please visit an AI platform (Claude, ChatGPT, Grok, or Gemini) to test the overlay!');
                } else {
                    console.log('✅ Test message sent');
                    window.close();
                }
            });
        }
    });
}

console.log('✅ HUM Extension Popup Ready');
