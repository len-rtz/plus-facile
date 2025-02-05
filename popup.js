document.addEventListener('DOMContentLoaded', async function() {
    // Get DOM elements
    const enableSwitch = document.getElementById('enableExtension');
    const languageLevel = document.getElementById('languageLevel');
    const serverStatus = document.getElementById('serverStatus');
    const serverStatusText = document.getElementById('serverStatusText');

    // Function to send message to content script
    async function sendMessageToActiveTab(message) {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab?.id) {
                console.log('No active tab found');
                return;
            }

            // Check if we can inject content script
            const canInject = tab.url?.startsWith('http') || tab.url?.startsWith('https');
            if (!canInject) {
                console.log('Cannot inject into this page');
                return;
            }

            // Try to send message, inject if needed
            try {
                await chrome.tabs.sendMessage(tab.id, message);
            } catch (error) {
                if (error.message.includes('Receiving end does not exist')) {
                    // Inject content script
                    await chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        files: ['content.js']
                    });
                    // Retry sending message
                    await chrome.tabs.sendMessage(tab.id, message);
                } else {
                    throw error;
                }
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    }

    // Load saved settings
    chrome.storage.sync.get(
        {
            enabled: true,
            languageLevel: 'B1'
        },
        function(items) {
            if (enableSwitch) enableSwitch.checked = items.enabled;
            if (languageLevel) languageLevel.value = items.languageLevel;
        }
    );

    // Handle enable/disable toggle
    if (enableSwitch) {
        enableSwitch.addEventListener('change', async function() {
            const enabled = this.checked;
            await chrome.storage.sync.set({ enabled });
            await sendMessageToActiveTab({
                action: 'toggleExtension',
                enabled: enabled
            });
        });
    }

    // Handle language level change
    if (languageLevel) {
        languageLevel.addEventListener('change', async function() {
            const level = this.value;
            await chrome.storage.sync.set({ languageLevel: level });
            await sendMessageToActiveTab({
                action: 'updateLanguageLevel',
                level: level
            });
        });
    }

    // Server status check function
    async function checkServerStatus() {
        if (!serverStatus || !serverStatusText) return;
        
        try {
            const response = await fetch('http://localhost:5001/health');
            const data = await response.json();
            const connected = response.ok;
            
            serverStatus.className = `status-indicator ${connected ? 'status-connected' : 'status-disconnected'} me-2`;
            serverStatusText.textContent = connected ? 'Connected' : 'Disconnected';
            
            if (connected) {
                console.log('Server health check response:', data);
            }
        } catch (error) {
            console.error('Server status check failed:', error);
            serverStatus.className = 'status-indicator status-disconnected me-2';
            serverStatusText.textContent = 'Disconnected';
        }
    }

    // Initial server status check
    await checkServerStatus();
    
    // Set up periodic status check
    const statusInterval = setInterval(checkServerStatus, 5000);

    // Clean up on unload
    window.addEventListener('unload', () => {
        clearInterval(statusInterval);
    });
});