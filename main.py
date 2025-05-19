from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel
from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
import re
import os

app = Flask(__name__)
CORS(app) 

model = None
tokenizer = None
model_loaded = False

def remove_chain_stitches(text):
    pattern = r'[|+\-=~*^#@<>{}[\]\\/:;,.!?]{2,}'
    
    cleaned_text = re.sub(pattern, ' ', text)
    
    cleaned_text = re.sub(r'\|', '', cleaned_text)

    cleaned_text = re.sub(r'(\s|^)\.(\w)', r'\1\2', cleaned_text)
    
    cleaned_text = re.sub(r'�', '', cleaned_text)
    
    cleaned_text = re.sub(r'\s{2,}', ' ', cleaned_text)
    
    return cleaned_text.strip()

def transform_case(text):
    sentences = re.split(r'(?<=[.!?])\s+', text)
    
    transformed_sentences = []
    for sentence in sentences:
        words = sentence.split()
        
        if not words:
            transformed_sentences.append(sentence)
            continue
        
        new_words = [words[0]] 
        
        for i in range(1, len(words)):
            word = words[i]
            prev_word = words[i-1]
            
            if any(c.isupper() for c in word) and not prev_word.endswith('.'):
                new_words.append(word.lower())
            else:
                new_words.append(word)
        
        transformed_sentences.append(' '.join(new_words))
    
    return ' '.join(transformed_sentences)

def load_model():
    global model, tokenizer, model_loaded
    
    try:
        model_path = r"I:\\api_qa_medical\\deepseek_medical_qa_peft"
        
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"O diretório do modelo não foi encontrado: {model_path}")
        
        print(f"Carregando modelo de: {model_path}")
        print("Este processo pode demorar alguns minutos...")
        
        base_model = AutoModelForCausalLM.from_pretrained(
            "deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B",
            torch_dtype=torch.float16,
            device_map="cpu" 
        )
        
        base_model.resize_token_embeddings(151679)
        
        model = PeftModel.from_pretrained(
            base_model,
            model_path
        )
        
        tokenizer = AutoTokenizer.from_pretrained(
            model_path,
        )
        
        model_loaded = True
        print("Modelo e tokenizer carregados com sucesso!")
        return True
    except Exception as e:
        print(f"ERRO ao carregar o modelo: {str(e)}")
        import traceback
        traceback.print_exc()
        model_loaded = False
        return False

def generate_medical_answer(question, model, tokenizer, max_length=256):

    prompt = f"<think>\n{question}"
    

    inputs = tokenizer(prompt, return_tensors="pt").to(model.device)
    

    with torch.no_grad():
        outputs = model.generate(
            input_ids=inputs.input_ids,
            attention_mask=inputs.attention_mask,
            max_new_tokens=max_length,
            do_sample=True,
            temperature=0.6,
            top_p=0.9,
            top_k=50,
            repetition_penalty=1.2
        )
    print(outputs)
    generated_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
    
    if generated_text.startswith(prompt):
        generated_text = generated_text[len(prompt):]
    generated_text = generated_text.replace("<|doctor|>", "")
    generated_text = generated_text.replace(r"<｜begin▁of▁sentence｜>", "")
    generated_text = generated_text.replace("<|endoftext|>", "")
    generated_text = remove_chain_stitches(generated_text)
    generated_text = transform_case(generated_text)
    return generated_text

@app.route('/status')
def status():
    if model_loaded:
        return jsonify({'status': 'ready', 'message': 'Modelo carregado e pronto para uso'})
    else:
        return jsonify({'status': 'not_ready', 'message': 'Modelo não carregado. Inicie o servidor novamente.'}), 503

@app.route('/get_answer', methods=['POST'])
def get_answer():
    try:
        print("Requisição recebida em /get_answer")
        
        if not model_loaded:
            print("ERRO: Modelo ou tokenizer não carregado")
            return jsonify({
                'error': 'Modelo não carregado',
                'message': 'Reinicie o servidor para carregar o modelo novamente'
            }), 503
        
        question = request.form.get('question')
        if not question:
            data = request.get_json(silent=True)
            if data and 'question' in data:
                question = data['question']
            else:
                return jsonify({'error': 'Nenhuma pergunta fornecida'}), 400
                
        print(f"Pergunta recebida: {question}")
        
        print("Gerando resposta com o modelo...")
        answer = generate_medical_answer(question, model, tokenizer)
        print(f"Resposta gerada com sucesso: {answer[:50]}...")
        return jsonify({'answer': answer})
    except Exception as e:
        print(f"Erro detalhado: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    load_model()
    app.run(debug=True, use_reloader = False) 
