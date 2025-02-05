# Plus Facile - French Text Simplifier

A Chrome extension that simplifies French text to your desired language level using local LLM processing.

## Quick Start Guide

### 1. Start Ollama Server
```bash
# Start the Ollama server (if not already running)
ollama serve
```
You can use any model you like, e.g. https://ollama.com/library/mistral-small:24b

### 2. Start Flask Backend
```bash
# Activate virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Navigate to the backend directory
cd backend

# Start Flask server
python app.py
```
The server should be running on http://localhost:5001

### 3. Enable Chrome Extension
1. Open Chrome
2. Go to chrome://extensions/
3. Add the Plus Facile extension from your local files

### 4. Usage
1. Go to any webpage with French text
2. Select French text
3. Use the context menu with right mouse click and choose "Simplify French Text"
4. Use the extension popup to:
   - Enable/disable the extension
   - Change the target language level (A1-B2)

## Troubleshooting

### Server Connection Issues
If the extension shows "Disconnected":
1. Check if Flask server is running (http://localhost:5001)
2. Check if Ollama is running (http://localhost:11434)
3. Restart Flask server if needed

### Extension Not Working
1. Check server status in extension popup
2. Make sure selected text is French
3. Text must be at least 10 characters long


## Requirements
- Python 3.7+
- Chrome browser
- Ollama installed
- e.g. Mistral model downloaded

<img width="1440" alt="Screenshot-Plus-Facile" src="https://github.com/user-attachments/assets/17057921-94e5-4022-bf3f-604a700d276a" />

