import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, User } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Message } from '../types';
import { WelcomeScreen } from './WelcomeScreen';

// Componente para indicador de digitação
const TypingIndicator: React.FC = () => (
  <div className="flex space-x-2 p-2">
    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
  </div>
);

export const ChatArea: React.FC = () => {
  const { chats, activeChat } = useStore();
  const [isLoading, setIsLoading] = useState(false);
  const activeMessages = chats.find((chat) => chat.id === activeChat)?.messages || [];

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        {activeMessages.length === 0 ? (
          <WelcomeScreen />
        ) : (
          <AnimatePresence>
            {activeMessages.map((message, index) => (
              <MessageItem key={message.id} message={message} index={index} />
            ))}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-4 mb-6"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg bg-gray-700 dark:bg-gray-800">
                  <Bot size={20} className="text-white" />
                </div>
                <div className="flex-1 max-w-[80%] p-4 rounded-xl shadow-md glassmorphism">
                  <TypingIndicator />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
      <ChatInput setIsLoading={setIsLoading} isLoading={isLoading} />
    </div>
  );
};

const MessageItem: React.FC<{ message: Message; index: number }> = ({ message, index }) => {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.1 }}
      className={`flex gap-4 mb-6 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      <motion.div
        whileHover={{ scale: 1.1 }}
        className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${
          isUser ? 'message-gradient' : 'bg-gray-700 dark:bg-gray-800'
        }`}
      >
        {isUser ? (
          <User size={20} className="text-white" />
        ) : (
          <Bot size={20} className="text-white" />
        )}
      </motion.div>
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        className={`flex-1 max-w-[80%] p-4 rounded-xl shadow-md ${
          isUser 
            ? 'message-gradient text-white' 
            : 'glassmorphism'
        }`}
      >
        {message.content}
      </motion.div>
    </motion.div>
  );
};

const ChatInput: React.FC<{ 
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  isLoading: boolean;
}> = ({ setIsLoading, isLoading }) => {
  const [input, setInput] = useState('');
  const { activeChat, addMessage } = useStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeChat) return;

    // Adiciona a mensagem do usuário ao chat
    addMessage(activeChat, {
      content: input.trim(),
      role: 'user',
    });

    // Limpa o input
    const userQuestion = input.trim();
    setInput('');
    
    // Indica que está carregando
    setIsLoading(true);
    
    console.log("1. Enviando pergunta:", userQuestion);
    
    try {
      // Faz a requisição para a API Flask
      console.log("2. Iniciando fetch para API");
      const response = await fetch('http://127.0.0.1:5000/get_answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'question': userQuestion
        })
      });
      
      console.log("3. Resposta recebida, status:", response.status);
      
      // Captura o texto da resposta antes de tentar converter para JSON
      const responseText = await response.text();
      console.log("4. Texto da resposta:", responseText);
      
      let data;
      try {
        // Tenta converter a resposta para JSON
        data = JSON.parse(responseText);
        console.log("5. Dados JSON:", data);
      } catch (jsonError) {
        console.error("6. Erro ao fazer parse do JSON:", jsonError);
        throw new Error(`Resposta não é JSON válido: ${responseText}`);
      }
      
      if (!response.ok) {
        console.error("7. Resposta não-OK:", data);
        throw new Error(`Erro na requisição: ${response.status} - ${data.error || 'Erro desconhecido'}`);
      }
      
      // Adiciona a resposta da IA ao chat
      console.log("8. Adicionando resposta ao chat");
      addMessage(activeChat, {
        content: data.answer || "Desculpe, não consegui processar sua pergunta.",
        role: 'assistant',
      });
    } catch (error) {
      console.error("9. Erro completo:", error);
      
      // Adiciona mensagem de erro ao chat com detalhes
      addMessage(activeChat, {
        content: `Erro técnico: ${error instanceof Error ? error.message : 'Erro desconhecido'}. Verifique o console para mais detalhes.`,
        role: 'assistant',
      });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <motion.form
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm"
      onSubmit={handleSubmit}
    >
      <div className="max-w-4xl mx-auto relative">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Digite sua pergunta médica..."
          className="w-full p-4 pr-12 rounded-xl gradient-border bg-white dark:bg-gray-900 focus:outline-none transition-shadow hover:shadow-md"
          disabled={isLoading}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          type="submit"
          disabled={isLoading}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
        >
          {isLoading ? (
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg
              className="w-5 h-5 transform rotate-90"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          )}
        </motion.button>
      </div>
    </motion.form>
  );
};
