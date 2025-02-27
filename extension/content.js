// State management
let settings = {
    enabled: true,
    languageLevel: 'A1'
};

// Cache for simplified texts
const simplificationCache = new Map();

// Initialize settings from storage
chrome.storage.sync.get(['enabled', 'languageLevel'], (result) => {
    settings = { ...settings, ...result };
});

// Listen for messages from popup and background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
        case 'toggleExtension':
            settings.enabled = request.enabled;
            break;
        case 'updateLanguageLevel':
            settings.languageLevel = request.level;
            simplificationCache.clear();
            break;
        case 'simplifySelectedText':
            if (settings.enabled) {
                handleTextSimplification(request.text);
            }
            break;
    }
});

// Create tooltip
function createTooltip() {
    const tooltip = document.createElement('div');
    tooltip.id = 'plus-facile-tooltip';
    tooltip.className = 'plus-facile-tooltip';
    tooltip.style.display = 'none';
    document.body.appendChild(tooltip);
    return tooltip;
}

// Check if text might be French
function isFrenchText(text) {
    const frenchPatterns = [
        /\b(le|la|les|un|une|des)\b/i,
        /\b(je|tu|il|elle|nous|vous|ils|elles)\b/i,
        /\b(être|avoir|faire|aller)\b/i,
        /\b(dans|sur|avec|pour|par)\b/i
    ];
    
    const minPatternMatches = 2;
    const matches = frenchPatterns.filter(pattern => pattern.test(text)).length;
    return matches >= minPatternMatches;
}

// Process text through local LLM server
async function simplifyText(text) {
    if (simplificationCache.has(text)) {
        return simplificationCache.get(text);
    }

    try {
        const response = await fetch('http://localhost:5001/simplify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            mode: 'cors',
            credentials: 'omit',
            body: JSON.stringify({
                text,
                level: settings.languageLevel
            })
        });
        
        if (!response.ok) {
            throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        simplificationCache.set(text, data.simplified_text);
        return data.simplified_text;
    } catch (error) {
        console.error('Simplification error:', error);
        return `Error: Could not simplify text. Please check if the server is running. (${error.message})`;
    }
}

// Show tooltip with simplified text
async function showSimplifiedTooltip(selectedText) {
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    let tooltip = document.getElementById('plus-facile-tooltip');
    if (!tooltip) {
        tooltip = createTooltip();
    }

    // Position tooltip
    const viewportWidth = window.innerWidth;
    const tooltipWidth = 400; // Maximum tooltip width from CSS
    let tooltipX = rect.left + window.scrollX;
    
    // Adjust position if it would go off-screen
    if (tooltipX + tooltipWidth > viewportWidth) {
        tooltipX = viewportWidth - tooltipWidth - 20;
    }

    tooltip.innerHTML = '<div class="tooltip-loading">Simplifying...<div class="spinner"></div></div>';
    tooltip.style.display = 'block';
    tooltip.style.left = `${tooltipX}px`;
    tooltip.style.top = `${rect.bottom + window.scrollY + 10}px`;

    try {
        const simplified = await simplifyText(selectedText);
        
        if (simplified.startsWith('Error:')) {
            tooltip.innerHTML = `
                <div class="tooltip-error">
                    ${simplified}
                    <button class="tooltip-retry-btn" onclick="retrySimplification('${encodeURIComponent(selectedText)}')">
                        Retry
                    </button>
                </div>
            `;
        } else {
            tooltip.innerHTML = `
                <div class="tooltip-header">Simplified Version:</div>
                <div class="tooltip-content">${simplified}</div>
                <div class="tooltip-original">Original: ${selectedText}</div>
            `;
        }
    } catch (error) {
        tooltip.innerHTML = `
            <div class="tooltip-error">
                Error: ${error.message}
                <button class="tooltip-retry-btn" onclick="retrySimplification('${encodeURIComponent(selectedText)}')">
                    Retry
                </button>
            </div>
        `;
    }
}

// Handle text simplification request
async function handleTextSimplification(text) {
    if (text && text.length > 10 && isFrenchText(text)) {
        await showSimplifiedTooltip(text);
    }
}

// Hide tooltip when clicking outside
document.addEventListener('click', (e) => {
    const tooltip = document.getElementById('plus-facile-tooltip');
    if (tooltip && !tooltip.contains(e.target)) {
        tooltip.style.display = 'none';
    }
});

// Retry simplification
window.retrySimplification = async function(encodedText) {
    const text = decodeURIComponent(encodedText);
    await handleTextSimplification(text);
};
