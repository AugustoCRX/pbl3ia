import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { Settings as SettingsIcon } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { Settings } from './components/Settings';
import { useStore } from './store/useStore';

function App() {
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const isDark = useStore((state) => state.isDark);

  React.useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col relative">
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-lg glassmorphism hover:shadow-lg transition-shadow"
          >
            <SettingsIcon size={20} />
          </button>
        </div>
        <ChatArea />
      </div>
      <AnimatePresence>
        {isSettingsOpen && (
          <Settings isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;