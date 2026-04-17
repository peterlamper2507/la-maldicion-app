import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Send, User, ChevronDown } from 'lucide-react';
import { createChat, sendMessage, subscribeToMessages, Message } from '../services/chatService';
import { cn, formatDate } from '../lib/utils';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  
  const scrollRef = useRef<HTMLDivElement>(null);

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
    
    const id = await createChat(customerName, customerEmail);
    setChatId(id);
    setIsStarted(true);
    
    // Send welcome message locally or wait for system?
    await sendMessage(id, "Hi! How can we help you today?", "agent", "system", "Support Bot");
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !chatId) return;

    const text = inputText;
    setInputText('');
    await sendMessage(chatId, text, "customer", "customer-anon", customerName);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 w-[380px] h-[550px] bg-white rounded-xl shadow-2xl border border-[#eeeeee] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-[#3b82f6] p-5 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="status-badge bg-[#10b981] w-2 h-2 rounded-full" />
                <h3 className="font-semibold text-sm">StreamLine Support</h3>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-1 rounded transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-[#fafafa] flex flex-col gap-5" ref={scrollRef}>
              {!isStarted ? (
                <div className="h-full flex flex-col justify-center px-4">
                  <div className="text-center mb-10">
                    <h4 className="text-xl font-bold text-[#1a1a1a] mb-2">How can we help?</h4>
                    <p className="text-sm text-[#64748b]">Search our help center or start a chat.</p>
                  </div>
                  <form onSubmit={handleStartChat} className="space-y-6">
                    <div>
                      <label className="section-title-min">Full Name</label>
                      <input
                        type="text"
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Julianne Moore"
                        className="input-box-min"
                      />
                    </div>
                    <div>
                      <label className="section-title-min">Email Address</label>
                      <input
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="j.moore@example.com"
                        className="input-box-min"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-[#3b82f6] text-white py-3.5 rounded-md font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-sm"
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
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "message-bubble",
                        msg.sender === 'customer' ? 'message-outgoing-min' : 'message-incoming-min',
                        msg.sender === 'system' && "self-center bg-transparent text-[#94a3b8] text-[10px] uppercase tracking-widest font-bold border-none"
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
              <div className="p-6 bg-white border-t border-[#eeeeee]">
                <form onSubmit={handleSendMessage}>
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type a message..."
                    className="input-box-min"
                  />
                </form>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

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
    </div>
  );
}
