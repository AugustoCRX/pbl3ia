export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  pinned: boolean;
  lastUpdated: Date;
}

export interface Settings {
  theme: 'light' | 'dark';
  aiModel: string;
  temperature: number;
}