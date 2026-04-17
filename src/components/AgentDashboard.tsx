import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  MessageSquare, 
  Inbox, 
  Settings, 
  Search, 
  Send, 
  MoreVertical, 
  CheckCircle, 
  Clock,
  LogOut,
  UserCheck
} from 'lucide-react';
import { 
  subscribeToActiveChats, 
  subscribeToMessages, 
  sendMessage, 
  acceptChat, 
  closeChat,
  Chat,
  Message,
  setupAgent
} from '../services/chatService';
import { auth, logout } from '../lib/firebase';
import { cn, formatDate } from '../lib/utils';

export default function AgentDashboard() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const user = auth.currentUser;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      setupAgent(user.uid, user.displayName || 'Agent', user.email || '');
    }
  }, [user]);

  useEffect(() => {
    const unsubscribe = subscribeToActiveChats((newChats) => {
      setChats(newChats);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (selectedChatId) {
      const unsubscribe = subscribeToMessages(selectedChatId, (newMessages) => {
        setMessages(newMessages);
      });
      return () => unsubscribe();
    } else {
      setMessages([]);
    }
  }, [selectedChatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const selectedChat = chats.find(c => c.id === selectedChatId);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedChatId || !user) return;

    const text = inputText;
    setInputText('');
    await sendMessage(selectedChatId, text, "agent", user.uid, user.displayName || 'Agent');
  };

  const handleAcceptChat = async (chatId: string) => {
    if (!user) return;
    await acceptChat(chatId, user.uid);
    setSelectedChatId(chatId);
  };

  const handleCloseChat = async (chatId: string) => {
    await closeChat(chatId);
    if (selectedChatId === chatId) setSelectedChatId(null);
  };

  const filteredChats = chats.filter(c => 
    c.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-[#f7f9fb] overflow-hidden font-sans">
      {/* Mini Sidebar */}
      <div className="w-[68px] bg-[#1a1a1a] flex flex-col items-center py-6 gap-8 shrink-0">
        <div className="nav-icon-min active">
          <MessageSquare size={18} />
        </div>
        <div className="flex flex-col gap-8 text-gray-500">
          <div className="nav-icon-min"><Inbox size={18} /></div>
          <div className="nav-icon-min"><Users size={18} /></div>
          <div className="nav-icon-min"><Clock size={18} /></div>
          <div className="nav-icon-min"><Settings size={18} /></div>
        </div>
        <div className="mt-auto pb-4">
          <button onClick={() => logout()} className="nav-icon-min hover:bg-red-500/20 hover:text-red-400">
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Chat List */}
      <div className="w-[300px] bg-white border-r border-[#eeeeee] flex flex-col shrink-0">
        <div className="p-6 border-b border-[#eeeeee]">
          <h1 className="text-xl font-bold text-[#1a1a1a] mb-4">Chats</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 pl-10 pr-4 py-2 rounded-md text-sm outline-none border border-transparent focus:border-[#eeeeee]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredChats.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <p className="text-sm">No conversations</p>
            </div>
          ) : (
            filteredChats.map(chat => (
              <div 
                key={chat.id}
                onClick={() => setSelectedChatId(chat.id)}
                className={cn(
                  "chat-item-min",
                  selectedChatId === chat.id && "active"
                )}
              >
                <div className="w-11 h-11 rounded-full bg-gray-100 shrink-0 flex items-center justify-center text-gray-400 font-bold uppercase">
                  {chat.customerName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold text-sm text-[#1a1a1a] truncate">{chat.customerName}</span>
                    <span className="text-xs text-[#94a3b8]">{formatDate(chat.updatedAt)}</span>
                  </div>
                  <p className="text-xs text-[#64748b] truncate">
                    {chat.lastMessage || 'Hey, I wanted to check...'}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* User Card */}
        <div className="p-5 bg-[#fafafa] border-t border-[#eeeeee] flex items-center gap-3">
          <div className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center text-[#1a1a1a] font-bold text-xs">
            {user?.displayName?.charAt(0) || 'A'}
          </div>
          <div className="flex-1 truncate">
            <p className="text-sm font-semibold truncate text-[#1a1a1a]">{user?.displayName || 'Agent'}</p>
            <p className="text-[10px] text-[#10b981] flex items-center gap-1 font-bold">
              <span className="w-1.5 h-1.5 bg-[#10b981] rounded-full" /> ONLINE
            </p>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedChat ? (
          <>
            {/* Header */}
            <div className="h-[72px] border-b border-[#eeeeee] px-8 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[#10b981]" />
                <span className="font-semibold text-[#1a1a1a]">{selectedChat.customerName}</span>
              </div>
              <div className="flex items-center gap-4">
                {selectedChat.status === 'waiting' && (
                  <button 
                    onClick={() => handleAcceptChat(selectedChat.id)}
                    className="bg-[#3b82f6] text-white px-4 py-2 rounded text-sm font-bold hover:opacity-90 transition-all"
                  >
                    Accept Chat
                  </button>
                )}
                {selectedChat.status === 'open' && (
                   <button 
                    onClick={() => handleCloseChat(selectedChat.id)}
                    className="text-xs text-[#64748b] hover:text-red-500 font-bold uppercase tracking-wider transition-colors"
                  >
                    Close
                  </button>
                )}
                <div className="text-[13px] text-[#94a3b8] ml-2 font-mono">ID: #C-{selectedChat.id.slice(-4).toUpperCase()}</div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-8 bg-[#fafafa] flex flex-col gap-6">
              {messages.map((msg) => (
                <div key={msg.id} className={cn(
                  "message-bubble",
                  msg.sender === 'agent' ? "message-outgoing-min" : "message-incoming-min",
                  msg.sender === 'system' && "self-center bg-transparent text-[#94a3b8] text-[10px] uppercase tracking-widest font-bold border-none"
                )}>
                  {msg.text}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-6 px-8 border-t border-[#eeeeee]">
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
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-[#f8fafc]">
            <div className="w-16 h-16 bg-white border border-[#eeeeee] rounded flex items-center justify-center text-[#94a3b8] mb-6">
              <MessageSquare size={32} />
            </div>
            <h2 className="text-xl font-bold text-[#1a1a1a] mb-2 tracking-tight">Select a Chat</h2>
            <p className="text-[#64748b] text-sm max-w-xs">
              Choose a conversation from the list to start providing support.
            </p>
          </div>
        )}
      </div>

      {/* Customer Info Panel */}
      {selectedChat && (
        <div className="w-[250px] bg-white border-l border-[#eeeeee] p-8 shrink-0 overflow-y-auto">
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-[#cbd5e1] mx-auto mb-4 flex items-center justify-center text-white text-3xl font-bold uppercase">
               {selectedChat.customerName.charAt(0)}
            </div>
            <h3 className="text-base font-semibold text-[#1a1a1a]">{selectedChat.customerName}</h3>
            <p className="text-xs text-[#94a3b8]">Live Visitor</p>
          </div>

          <div className="section-title-min">Contact</div>
          <div className="mb-6">
            <div className="text-[10px] uppercase tracking-widest text-[#94a3b8] font-bold mb-1">Email</div>
            <div className="text-[13px] font-medium text-[#1a1a1a] truncate">{selectedChat.customerEmail || 'Not provided'}</div>
          </div>

          <div className="section-title-min">Tags</div>
          <div className="flex flex-wrap gap-1.5 mb-8">
            <span className="tag-min">New User</span>
            <span className="tag-min">Customer</span>
          </div>

          <div className="section-title-min">Activity</div>
          <div className="mb-5">
            <div className="text-[13px] font-medium text-[#1a1a1a]">Conversation Started</div>
            <div className="text-[11px] text-[#94a3b8] mt-1">{formatDate(selectedChat.createdAt)}</div>
          </div>
        </div>
      )}
    </div>
  );
}
