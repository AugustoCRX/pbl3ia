import React from 'react';
import { motion } from 'framer-motion';
import { Bot, MessageSquare, Settings, Zap } from 'lucide-react';

export const WelcomeScreen: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full flex flex-col items-center justify-center welcome-gradient"
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-6 shadow-xl"
      >
        <Bot size={40} className="text-white" />
      </motion.div>

      <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
        Welcome to G(eovane)PT
      </h1>
      
      <p className="text-gray-600 dark:text-gray-400 mb-8 text-center max-w-md">
        Your intelligent AI assistant, ready to help with any task
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl">
        <FeatureCard
          icon={<MessageSquare className="text-indigo-500" />}
          title="Natural Conversations"
          description="Chat naturally with advanced language understanding"
        />
        <FeatureCard
          icon={<Zap className="text-purple-500" />}
          title="Quick Responses"
          description="Get instant, accurate answers to your questions"
        />
        <FeatureCard
          icon={<Settings className="text-pink-500" />}
          title="Customizable"
          description="Adjust settings to match your preferences"
        />
      </div>
    </motion.div>
  );
};

const FeatureCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
}> = ({ icon, title, description }) => (
  <motion.div
    whileHover={{ scale: 1.05 }}
    className="p-4 rounded-xl glassmorphism"
  >
    <div className="w-10 h-10 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center mb-3 shadow-md">
      {icon}
    </div>
    <h3 className="font-semibold mb-1">{title}</h3>
    <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
  </motion.div>
);