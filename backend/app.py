from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
from typing import Dict, Any
import ollama

app = Flask(__name__)
# Enable CORS for all routes with all origins
CORS(app, resources={r"/*": {"origins": "*"}})

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Ollama client
ollama_client = ollama.Client(host='http://localhost:11434')

LEVEL_PROMPTS = {
    'A1': """Tu es un expert en français qui simplifie les textes pour les apprenants.
           Simplifie le texte suivant au niveau A1 (Débutant):
           - Utilise uniquement le présent
           - Utilise un vocabulaire très simple et courant
           - Garde les phrases très courtes et basiques
           - Utilise des connecteurs simples (et, mais, parce que)
           IMPORTANT: Garde le texte en français, ne traduis pas.
           Texte à simplifier: """,
    
    'A2': """Tu es un expert en français qui simplifie les textes pour les apprenants.
           Simplifie le texte suivant au niveau A2 (Élémentaire):
           - Utilise le présent et le passé composé
           - Utilise un vocabulaire courant avec quelques expressions basiques
           - Garde les phrases simples avec des propositions subordonnées basiques
           - Utilise des connecteurs courants (puis, alors, donc)
           IMPORTANT: Garde le texte en français, ne traduis pas.
           Texte à simplifier: """,
    
    'B1': """Tu es un expert en français qui simplifie les textes pour les apprenants.
           Simplifie le texte suivant au niveau B1 (Intermédiaire):
           - Utilise les temps courants (présent, passé composé, imparfait)
           - Utilise un vocabulaire de niveau intermédiaire
           - Permets une complexité modérée des phrases
           - Utilise des connecteurs variés
           IMPORTANT: Garde le texte en français, ne traduis pas.
           Texte à simplifier: """,
    
    'B2': """Tu es un expert en français qui simplifie les textes pour les apprenants.
           Adapte le texte suivant au niveau B2 (Intermédiaire supérieur):
           - Garde la plupart des temps mais simplifie les constructions complexes
           - Maintiens le vocabulaire sophistiqué quand le contexte est clair
           - Préserve le sens en rendant la structure plus claire
           - Garde les bons éléments stylistiques
           IMPORTANT: Garde le texte en français, ne traduis pas.
           Texte à simplifier: """
}

@app.route('/health', methods=['GET'])
def health_check() -> Dict[str, Any]:
    """Health check endpoint to verify server status."""
    try:
        # Check if Ollama is responsive
        models = ollama_client.list()
        return jsonify({'status': 'healthy', 'message': 'Server and Ollama are running', 'models': models})
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return jsonify({'status': 'unhealthy', 'message': str(e)}), 503

@app.route('/simplify', methods=['POST', 'OPTIONS'])
def simplify_text() -> Dict[str, Any]:
    """Endpoint to simplify French text according to specified language level."""
    if request.method == 'OPTIONS':
        # Handle preflight request
        return jsonify({'status': 'ok'})

    try:
        data = request.get_json()
        if not data or 'text' not in data or 'level' not in data:
            return jsonify({'error': 'Missing required fields'}), 400

        text = data['text']
        level = data['level']

        if level not in LEVEL_PROMPTS:
            return jsonify({'error': 'Invalid language level'}), 400

        # Construct prompt
        prompt = LEVEL_PROMPTS[level] + text

        # Get response from Ollama
        response = ollama_client.chat(
            model='mistral',  # Using Mistral model
            messages=[{
                'role': 'system',
                'content': 'Tu es un expert en français spécialisé dans la simplification de textes pour les apprenants.'
            }, {
                'role': 'user',
                'content': prompt
            }]
        )

        simplified_text = response['message']['content']

        return jsonify({
            'original_text': text,
            'simplified_text': simplified_text,
            'level': level
        })

    except Exception as e:
        logger.error(f"Simplification error: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)