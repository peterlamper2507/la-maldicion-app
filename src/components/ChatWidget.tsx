import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Send, User, ChevronDown } from 'lucide-react';
import { createChat, sendMessage, subscribeToMessages, Message, trackVisitor, subscribeToInvites } from '../services/chatService';
import { cn, formatDate } from '../lib/utils';

interface ChatWidgetProps {
  defaultOpen?: boolean;
  hideLauncher?: boolean;
}

export default function ChatWidget({ defaultOpen = false, hideLauncher = false }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isStarted, setIsStarted] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [sessionId, setSessionId] = useState<string>('');

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Session management
    let sid = localStorage.getItem('streamline_session_id');
    if (!sid) {
      sid = Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem('streamline_session_id', sid);
    }
    setSessionId(sid);

    // Tracking pulse
    const track = () => trackVisitor(sid!, window.location.href, document.title);
    track();
    const interval = setInterval(track, 30000); // 30s heartbeat

    // Listen for agent initiated chats
    const unsubscribeInvites = subscribeToInvites(sid!, (newChatId) => {
      if (!isStarted) {
        setChatId(newChatId);
        setIsStarted(true);
        setIsOpen(true);
        if (!customerName) setCustomerName('Visitor');
      }
    });

    return () => {
      clearInterval(interval);
      unsubscribeInvites();
    };
  }, [isStarted, customerName]);

  useEffect(() => {
    if (chatId) {
      const unsubscribe = subscribeToMessages(chatId, (newMessages) => {
        setMessages(newMessages);
      });
      return () => unsubscribe();
    }
  }, [chatId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleStartChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) return;

    const id = await createChat(customerName, customerEmail, sessionId);
    setChatId(id);
    setIsStarted(true);

    await sendMessage(id, "Hi! How can we help you today?", "agent", "system", "Support Bot");
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !chatId) return;

    const text = inputText;
    setInputText('');
    await sendMessage(chatId, text, "customer", sessionId, customerName || 'Visitor');
  };

  return (
    <div className={cn("flex flex-col items-end", !hideLauncher ? "fixed bottom-6 right-6 z-50" : "h-full w-full justify-end")}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 w-[238px] h-[375px] bg-white rounded-lg shadow-2xl border border-[#eeeeee] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-[#3b82f6] p-4 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="status-badge bg-[#10b981] w-2 h-2 rounded-full" />
                <h3 className="font-semibold text-xs">Support</h3>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-1 rounded transition-colors">
                <X size={14} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 bg-[#fafafa] flex flex-col gap-4" ref={scrollRef}>
              {!isStarted ? (
                <div className="h-full flex flex-col justify-center">
                  <div className="text-center mb-5">
                    <h4 className="text-sm font-bold text-[#1a1a1a] mb-1">How can we help?</h4>
                  </div>
                  <form onSubmit={handleStartChat} className="space-y-4">
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-[#94a3b8] font-bold block mb-1.5">Name</label>
                      <input
                        type="text"
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Name"
                        className="w-full px-3 py-2 border border-[#e2e8f0] rounded text-xs outline-none bg-[#f8fafc]"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-[#3b82f6] text-white py-2.5 rounded font-bold text-xs hover:opacity-90 active:scale-[0.98] transition-all"
                    >
                      Start Chat
                    </button>
                  </form>
                </div>
              ) : (
                <>
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "px-3 py-2 rounded-md text-xs leading-snug max-w-[90%]",
                        msg.sender === 'customer' ? 'self-end bg-[#3b82f6] text-white rounded-br-none' : 'self-start bg-white border border-[#eeeeee] rounded-bl-none',
                        msg.sender === 'system' && "self-center bg-transparent text-[#94a3b8] text-[9px] uppercase tracking-widest font-bold border-none text-center"
                      )}
                    >
                      {msg.text}
                    </motion.div>
                  ))}
                </>
              )}
            </div>

            {/* Input */}
            {isStarted && (
              <div className="p-4 bg-white border-t border-[#eeeeee]">
                <form onSubmit={handleSendMessage}>
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type a message..."
                    className="w-full px-3 py-2 border border-[#e2e8f0] rounded text-xs outline-none bg-[#f8fafc]"
                  />
                </form>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {!hideLauncher && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 bg-[#3b82f6] text-white rounded-full shadow-lg flex items-center justify-center transition-all bg-dark relative"
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div key="close" initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 90 }}>
                <ChevronDown size={28} />
              </motion.div>
            ) : (
              <motion.div key="open" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}>
                <MessageCircle size={28} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      )}
    </div>
  );
}
