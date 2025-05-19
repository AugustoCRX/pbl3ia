from flask import Flask, request, jsonify, render_template
from flask_cors import CORS # Importar Flask-CORS
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel
import torch
import re

app = Flask(__name__)
CORS(app) # Habilitar CORS para todas as rotas e origens

# Global variables for model and tokenizer
model = None
tokenizer = None

def remove_chain_stitches(text):
    # Remove sequences of special characters that form "chain stitch" patterns
    # This targets repetitive sequences of |, +, -, =, ~, *, ^, and other symbols
    pattern = r'[|+\-=~*^#@<>{}[\]\\/:;,.!?]{2,}'
    
    # Apply the regex substitution
    cleaned_text = re.sub(pattern, ' ', text)
    
    # Also remove single occurrences of vertical bars which are common in your output
    cleaned_text = re.sub(r'\|', '', cleaned_text)

    # Remove dots at the beginning of words (e.g., .synthetic -> synthetic)
    cleaned_text = re.sub(r'(\s|^)\.(\w)', r'\1\2', cleaned_text)
    
    # Remove Unicode replacement characters (�)
    cleaned_text = re.sub(r'�', '', cleaned_text)
    
    # Clean up extra whitespace
    cleaned_text = re.sub(r'\s{2,}', ' ', cleaned_text)
    
    return cleaned_text.strip()

def transform_case(text):
    # Split text into sentences using regex that captures sentence endings
    sentences = re.split(r'(?<=[.!?])\s+', text)
    
    transformed_sentences = []
    for sentence in sentences:
        # Split sentence into words
        words = sentence.split()
        
        if not words:
            transformed_sentences.append(sentence)
            continue
        
        new_words = [words[0]]  # Keep first word as is
        
        # For other words, transform words with uppercase letters to lowercase if no dot before
        for i in range(1, len(words)):
            word = words[i]
            prev_word = words[i-1]
            
            # Check if word has any uppercase letter and previous word does not end with a dot
            if any(c.isupper() for c in word) and not prev_word.endswith('.'):
                new_words.append(word.lower())
            else:
                new_words.append(word)
        
        transformed_sentences.append(' '.join(new_words))
    
    return ' '.join(transformed_sentences)

def load_model():
    global model, tokenizer
    try:
        # Load base model in CPU mode
        base_model = AutoModelForCausalLM.from_pretrained(
            "deepseek-ai/DeepSeek-R1-Distill-Llama-8B",
            torch_dtype=torch.float16,
            device_map="cpu"  # Force CPU
        )
        
        base_model.resize_token_embeddings(128270)
        
        # Load your adapter weights
        model = PeftModel.from_pretrained(
            base_model,
            "H:\\api_qa_medical\\deepseek_medical_qa_peft"
        )
        
        # Load the tokenizer from your saved files
        tokenizer = AutoTokenizer.from_pretrained(
            "H:\\api_qa_medical\\deepseek_medical_qa_peft"
        )
        
        print("Model and tokenizer loaded successfully!")
    except Exception as e:
        print(f"Error loading model: {str(e)}")

def generate_medical_answer(question, model, tokenizer, max_length=200):
    # Format the prompt with your special tokens
    prompt = f"<|patient|>{question}<|endofprompt|>"
    
    # Tokenize
    inputs = tokenizer(prompt, return_tensors="pt").to(model.device)
    
    # Generate
    with torch.no_grad():
        outputs = model.generate(
            input_ids=inputs.input_ids,
            attention_mask=inputs.attention_mask,
            max_new_tokens=max_length,
            do_sample=True,
            temperature=0.7,
            top_p=0.9,
            top_k=50,
            repetition_penalty=1.2
        )
    
    # Decode
    generated_text = tokenizer.decode(outputs[0], skip_special_tokens=False)
    
    generated_text = generated_text.replace("<|endoftext|>", "")
    generated_text = generated_text.replace(prompt, "")
    generated_text = generated_text.replace("<|doctor|>", "")
    generated_text = generated_text.replace(r"<｜begin▁of▁sentence｜>", "")
    generated_text = remove_chain_stitches(generated_text)
    generated_text = transform_case(generated_text)
    return generated_text

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/get_answer', methods=['POST'])
def get_answer():
    try:
        question = request.form.get('question')
        if model is None or tokenizer is None:
            return jsonify({'error': 'Model not loaded yet'}), 500
        
        answer = generate_medical_answer(question, model, tokenizer)
        return jsonify({'answer': answer})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Load the model before starting the Flask app
    load_model()
    app.run(debug=True, use_reloader=False)  # Set use_reloader=False to avoid loading the model twice
