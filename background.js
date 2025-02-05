// Create context menu on install
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: 'simplifyFrenchText',
        title: 'Simplify French Text',
        contexts: ['selection']
    });
});

// Function to be injected and executed
async function processSelectedText(selectedText) {
    // Create or get tooltip
    let tooltip = document.getElementById('plus-facile-tooltip');
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'plus-facile-tooltip';
        tooltip.className = 'plus-facile-tooltip';
        document.body.appendChild(tooltip);
    }

    // Get selection coordinates
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // Position tooltip
    tooltip.style.position = 'fixed';
    tooltip.style.left = `${rect.left}px`;
    tooltip.style.top = `${rect.bottom + 10}px`;
    tooltip.style.display = 'block';
    tooltip.innerHTML = '<div class="tooltip-loading">Simplifying...</div>';

    try {
        // Get language level from storage
        const storage = await chrome.storage.sync.get(['languageLevel']);
        const languageLevel = storage.languageLevel || 'B1';

        // Call API
        const response = await fetch('http://localhost:5001/simplify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: selectedText,
                level: languageLevel
            })
        });

        if (!response.ok) throw new Error('Simplification failed');

        const data = await response.json();
        
        // Update tooltip with result
        tooltip.innerHTML = `
            <div class="tooltip-header">Simplified Version</div>
            <div class="tooltip-content">${data.simplified_text}</div>
            <div class="tooltip-original">Original: ${selectedText}</div>
        `;

        // Add click handler to hide tooltip
        document.addEventListener('click', function hideTooltip(e) {
            if (!tooltip.contains(e.target)) {
                tooltip.style.display = 'none';
                document.removeEventListener('click', hideTooltip);
            }
        });

    } catch (error) {
        tooltip.innerHTML = `
            <div class="tooltip-error">
                Error: ${error.message}
                <button onclick="this.parentElement.parentElement.style.display='none'">
                    Close
                </button>
            </div>
        `;
    }
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === 'simplifyFrenchText' && tab.id) {
        try {
            // Execute script directly
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: processSelectedText,
                args: [info.selectionText]
            });
        } catch (error) {
            console.error('Error executing script:', error);
        }
    }
});

// Server status check
async function checkServerStatus() {
    try {
        const response = await fetch('http://localhost:5001/health');
        updateExtensionIcon(response.ok);
    } catch (error) {
        updateExtensionIcon(false);
    }
}

// Update extension icon
function updateExtensionIcon(isConnected) {
    chrome.action.setIcon({
        path: {
            16: `/images/icon16${isConnected ? '' : '_offline'}.png`,
            48: `/images/icon48${isConnected ? '' : '_offline'}.png`,
            128: `/images/icon128${isConnected ? '' : '_offline'}.png`
        }
    });
}

// Start status check
checkServerStatus();
setInterval(checkServerStatus, 5000);