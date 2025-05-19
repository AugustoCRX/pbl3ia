from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import torch
import re
import os
import sys

app = Flask(__name__)
CORS(app)  # Habilitando CORS para todas as rotas

# Global variables for model and tokenizer
model = None
tokenizer = None
model_loaded = False

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
    global model, tokenizer, model_loaded
    
    # Só importamos essas bibliotecas quando realmente precisamos delas
    try:
        from transformers import AutoModelForCausalLM, AutoTokenizer
        from peft import PeftModel
    except ImportError:
        print("ERRO: Bibliotecas 'transformers' ou 'peft' não instaladas.")
        print("Execute: pip install transformers peft")
        sys.exit(1)
    
    try:
        # Define o caminho do modelo usando string raw (r"") para evitar problemas de escape
        model_path = r"C:\Users\steph\GitHub\pbl3ia\deepseek_medical_qa_peft"
        
        # Verifica se o diretório existe
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"O diretório do modelo não foi encontrado: {model_path}")
        
        print(f"Carregando modelo de: {model_path}")
        print("Este processo pode demorar alguns minutos...")
        
        # Tenta carregar o modelo base em modo CPU
        base_model = AutoModelForCausalLM.from_pretrained(
            "deepseek-ai/DeepSeek-R1-Distill-Llama-8B",
            torch_dtype=torch.float16,
            device_map="cpu"  # Força CPU
        )
        
        base_model.resize_token_embeddings(128270)
        
        # Carrega os pesos do adaptador
        model = PeftModel.from_pretrained(
            base_model,
            model_path
        )
        
        # Carrega o tokenizer dos arquivos salvos
        tokenizer = AutoTokenizer.from_pretrained(model_path)
        
        # Marca que o modelo foi carregado com sucesso
        model_loaded = True
        print("Modelo e tokenizer carregados com sucesso!")
        return True
    except Exception as e:
        print(f"ERRO ao carregar o modelo: {str(e)}")
        # Imprime detalhes mais específicos sobre o erro
        import traceback
        traceback.print_exc()
        model_loaded = False
        return False

def generate_medical_answer(question, max_length=200):
    global model, tokenizer
    
    if not model_loaded or model is None or tokenizer is None:
        raise RuntimeError("Modelo não carregado. Execute o carregamento do modelo primeiro.")
    
    # Formata o prompt com seus tokens especiais
    prompt = f"<|patient|>{question}<|endofprompt|>"
    
    # Tokeniza
    inputs = tokenizer(prompt, return_tensors="pt").to(model.device)
    
    # Gera
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
    
    # Decodifica
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

@app.route('/status')
def status():
    """Endpoint para verificar se o modelo está carregado"""
    if model_loaded:
        return jsonify({'status': 'ready', 'message': 'Modelo carregado e pronto para uso'})
    else:
        return jsonify({'status': 'not_ready', 'message': 'Modelo não carregado. Inicie o servidor novamente.'}), 503

@app.route('/get_answer', methods=['POST'])
def get_answer():
    try:
        print("Requisição recebida em /get_answer")
        
        # Verifica se o modelo está carregado
        if not model_loaded:
            print("ERRO: Modelo ou tokenizer não carregado")
            return jsonify({
                'error': 'Modelo não carregado',
                'message': 'Reinicie o servidor para carregar o modelo novamente'
            }), 503
        
        # Obtém a pergunta do formulário
        question = request.form.get('question')
        if not question:
            # Tenta obter do JSON se não estiver no formulário
            data = request.get_json(silent=True)
            if data and 'question' in data:
                question = data['question']
            else:
                return jsonify({'error': 'Nenhuma pergunta fornecida'}), 400
                
        print(f"Pergunta recebida: {question}")
        
        print("Gerando resposta com o modelo...")
        answer = generate_medical_answer(question)
        print(f"Resposta gerada com sucesso: {answer[:50]}...")
        return jsonify({'answer': answer})
    except Exception as e:
        print(f"Erro detalhado: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Carrega o modelo antes de iniciar o app Flask
    success = load_model()
    
    if not success:
        print("AVISO: O servidor será iniciado, mas o modelo não foi carregado corretamente.")
        print("As requisições para /get_answer falharão até que o modelo seja carregado.")
        print("Verifique os erros acima e reinicie o servidor.")
    
    # Inicia o servidor Flask
    app.run(debug=True, use_reloader=False, host='0.0.0.0', port=5000)