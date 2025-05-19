import { create } from 'zustand';
import { Chat, Message, Settings } from '../types';

interface State {
  chats: Chat[];
  activeChat: string | null;
  settings: Settings;
  isDark: boolean;
  addChat: () => void;
  setActiveChat: (id: string) => void;
  addMessage: (chatId: string, message: Omit<Message, 'id' | 'timestamp'>) => void;
  togglePin: (chatId: string) => void;
  clearChats: () => void;
  toggleTheme: () => void;
  updateSettings: (settings: Partial<Settings>) => void;
}

export const useStore = create<State>((set) => ({
  chats: [],
  activeChat: null,
  settings: {
    theme: 'light',
    aiModel: 'gpt-4',
    temperature: 0.7,
  },
  isDark: false,
  addChat: () => set((state) => {
    const newChat: Chat = {
      id: crypto.randomUUID(),
      title: 'New Chat',
      messages: [],
      pinned: false,
      lastUpdated: new Date(),
    };
    return { 
      chats: [...state.chats, newChat],
      activeChat: newChat.id,
    };
  }),
  setActiveChat: (id) => set({ activeChat: id }),
  addMessage: (chatId, message) => set((state) => ({
    chats: state.chats.map((chat) => 
      chat.id === chatId 
        ? {
            ...chat,
            messages: [...chat.messages, { 
              ...message, 
              id: crypto.randomUUID(),
              timestamp: new Date(),
            }],
            lastUpdated: new Date(),
          }
        : chat
    ),
  })),
  togglePin: (chatId) => set((state) => ({
    chats: state.chats.map((chat) =>
      chat.id === chatId ? { ...chat, pinned: !chat.pinned } : chat
    ),
  })),
  clearChats: () => set({ chats: [], activeChat: null }),
  toggleTheme: () => set((state) => ({ isDark: !state.isDark })),
  updateSettings: (newSettings) => set((state) => ({
    settings: { ...state.settings, ...newSettings },
  })),
}));