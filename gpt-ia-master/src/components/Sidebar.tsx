import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquarePlus, Pin, Trash2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Logo } from './Logo';

export const Sidebar: React.FC = () => {
  const { chats, activeChat, addChat, setActiveChat, togglePin, clearChats } = useStore();

  const pinnedChats = chats.filter((chat) => chat.pinned);
  const unpinnedChats = chats.filter((chat) => !chat.pinned);

  return (
    <motion.div
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      className="w-64 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col"
    >
      <Logo />
      
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={addChat}
        className="mx-4 py-3 px-4 rounded-lg gradient-border bg-white dark:bg-gray-900 flex items-center justify-center gap-2 transition-shadow hover:shadow-lg"
      >
        <MessageSquarePlus size={20} />
        New Chat
      </motion.button>

      <div className="mt-6 flex-1 overflow-y-auto px-4">
        {pinnedChats.length > 0 && (
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 px-2">
              PINNED CHATS
            </h3>
            {pinnedChats.map((chat) => (
              <ChatItem
                key={chat.id}
                chat={chat}
                isActive={chat.id === activeChat}
                onSelect={() => setActiveChat(chat.id)}
                onPin={() => togglePin(chat.id)}
              />
            ))}
          </div>
        )}

        {unpinnedChats.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 px-2">
              CHATS
            </h3>
            {unpinnedChats.map((chat) => (
              <ChatItem
                key={chat.id}
                chat={chat}
                isActive={chat.id === activeChat}
                onSelect={() => setActiveChat(chat.id)}
                onPin={() => togglePin(chat.id)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={clearChats}
          className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg w-full"
        >
          <Trash2 size={18} />
          Clear all chats
        </motion.button>
      </div>
    </motion.div>
  );
};

const ChatItem: React.FC<{
  chat: { id: string; title: string; pinned: boolean };
  isActive: boolean;
  onSelect: () => void;
  onPin: () => void;
}> = ({ chat, isActive, onSelect, onPin }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer mb-1 transition-all ${
      isActive
        ? 'bg-indigo-50 dark:bg-indigo-900/20 shadow-md'
        : 'hover:bg-gray-100 dark:hover:bg-gray-800'
    }`}
    onClick={onSelect}
  >
    <span className="flex-1 truncate">{chat.title}</span>
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={(e) => {
        e.stopPropagation();
        onPin();
      }}
      className={`opacity-60 hover:opacity-100 ${chat.pinned ? 'text-indigo-600' : ''}`}
    >
      <Pin size={16} />
    </motion.button>
  </motion.div>
);