# Plus Facile - French Text Simplifier

A Chrome extension that simplifies French text to different language learning levels (A1-B2) using local LLM processing.

## Prerequisites

- macOS or Linux
- Python 3.8 or higher
- Google Chrome browser
- Terminal access

## Installation Steps

### 1. Install Ollama
```bash
# On macOS
brew install ollama

# On Linux
curl -fsSL https://ollama.com/install.sh | sh
```

### 2. Start Ollama Service
```bash
# Start the Ollama service
ollama serve
```

### 3. Download Required Model
```bash
# In a new terminal window
ollama pull mistral
```

### 4. Set Up Python Environment
Clone or download this repository
```bash
# Navigate to project directory

# Create virtual environment
python -m venv venv

# Activate virtual environment
source venv/bin/activate
```

### 5. Install Python Dependencies (backend/requirements.txt)
```txt
flask==2.3.3
flask-cors==4.0.0
ollama==0.1.6
python-dotenv==1.0.0
```

Install:
```bash
pip install -r requirements.txt
```

### 6. The Extension Files
Make sure all provided files in their correct locations:
- `backend/app.py` - Flask server code
- `manifest.json` - Extension manifest
- `popup.html` - Extension popup interface
- `popup.js` - Popup logic
- `content.js` - Content script
- `background.js` - Background script
- `styles.css` - Extension styles

### 8. Icons
The /images directory holds icons for showing a connected or not connected server (greyscale)

## Running the Extension

### 1. Start the Backend Server
```bash
# Make sure you're in the virtual environment
source venv/bin/activate

# Start the Flask server (from the backend directory)
cd backend
python app.py
```

### 2. Install the Chrome Extension
1. Open Chrome
2. Go to `chrome://extensions/`
3. Enable "Developer mode" (top-right corner)
4. Click "Load unpacked"
5. Select the top directory from your project

## Testing the Extension

1. Make sure both Ollama and the Flask server are running
2. Visit any French webpage
3. Select some French text
4. A popup should appear with the simplified version

## Troubleshooting

### Server Issues
- Check if Flask server is running (http://localhost:5001)
- Check if Ollama is running (http://localhost:11434)
- If port 5001 is in use, modify the port in `app.py` and `content.js`

### Extension Issues
- Check the extension popup's server status indicator
- Check Chrome's developer console for errors
- Try reloading the extension from chrome://extensions/
