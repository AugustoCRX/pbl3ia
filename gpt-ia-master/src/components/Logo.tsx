import React from 'react';
import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';

export const Logo: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 p-4"
    >
      <motion.div
        whileHover={{ rotate: 360 }}
        transition={{ duration: 0.5 }}
        className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg"
      >
        <Bot size={24} className="text-white" />
      </motion.div>
      <div>
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
          G.PT
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400">AI Assistant</p>
      </div>
    </motion.div>
  );
};