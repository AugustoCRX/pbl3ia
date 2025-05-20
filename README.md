# GPT-IA Medical QA Frontend

    Sistema completo de Perguntas e Respostas Médicas utilizando IA, composto por um backend Python (Flask) com modelo ajustado via PEFT e um frontend moderno em React + TypeScript.

## Estrutura do Projeto

    api_qa_medical/
    │
    ├── data/                        # Dados para treino/teste
    ├── deepseek_medical_qa_peft/    # Modelo customizado (PEFT)
    ├── notebook/                    # Notebooks de experimentação OBS: Modelos com outputs grandes, baixar para visualizar-los
    ├── templates/                   # Templates 
    ├── main.py                      # API Flask principal
    ├── .gitignore
    ├── package-lock.json
    │
    └── gpt-ia-master/               # Frontend React + TypeScript
        ├── .bolt/
        ├── node_modules/
        ├── src/
        │   ├── components/
        │   │   ├── ChatArea.tsx
        │   │   ├── Logo.tsx
        │   │   ├── Settings.tsx
        │   │   ├── Sidebar.tsx
        │   │   └── WelcomeScreen.tsx
        │   ├── store/
        │   │   └── useStore.ts
        │   ├── App.tsx
        │   ├── index.css
        │   ├── main.tsx
        │   ├── types.ts
        │   └── vite-env.d.ts
        ├── .gitignore
        ├── eslint.config.js
        ├── index.html
        ├── package.json
        ├── package-lock.json
        ├── postcss.config.js
        ├── tailwind.config.js
        ├── tsconfig.app.json
        ├── tsconfig.json
        ├── tsconfig.node.json
        └── vite.config.ts

# Backend (API)

    Tecnologias: Python, Flask, HuggingFace Transformers, PEFT, Torch, Flask-CORS.

    Arquivo principal: main.py

### Funções principais:

    Carregamento do modelo customizado (PEFT).

### Endpoints REST:

    /status — Verifica se o modelo está carregado.

    /get_answer — Recebe uma pergunta e retorna a resposta gerada.

### Pastas de suporte:

    data/ para datasets.

    deepseek_medical_qa_peft/ para arquivos do modelo.

    notebook/ para experimentos.

# Frontend (gpt-ia-master)

## Tecnologias: React, TypeScript, Zustand (estado global), Tailwind CSS, Vite, Framer Motion.

## Estrutura:

    - src/components/ — Componentes reutilizáveis:

        - ChatArea.tsx: Área de chat e histórico.

        - Logo.tsx: Marca visual.

        - Settings.tsx: Modal de configurações (tema, modelo, temperatura).

        - Sidebar.tsx: Navegação e gerenciamento de chats.

        - WelcomeScreen.tsx: Tela inicial.

    - src/store/useStore.ts — Estado global com Zustand.

    - src/App.tsx — Componente raiz.

    - src/main.tsx — Ponto de entrada React.

    - src/index.css — Estilos globais com Tailwind.

    - src/types.ts — Tipos TypeScript.

### Configurações: tailwind.config.js, postcss.config.js, tsconfig*.json, vite.config.ts.

# Como Executar
## 1. Backend
    pip install -r requirements.txt
    python main.py
- A API Flask será iniciada em http://localhost:5000

## 2. Frontend
    cd gpt-ia-master
    npm install
    npm run dev
- O app estará disponível em http://localhost:5173