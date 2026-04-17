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
  UserCheck,
  Globe,
  Terminal,
  Copy
} from 'lucide-react';
import {
  subscribeToActiveChats,
  subscribeToMessages,
  sendMessage,
  acceptChat,
  closeChat,
  Chat,
  Message,
  Visitor,
  setupAgent,
  subscribeToVisitors,
  inviteToChat
} from '../services/chatService';
import { auth, logout, changeUserPassword } from '../lib/firebase';
import { cn, formatDate } from '../lib/utils';

export default function AgentDashboard() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'chats' | 'visitors' | 'settings' | 'profile'>('chats');
  const [copied, setCopied] = useState(false);

  // Profile management state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

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
    const unsubscribe = subscribeToVisitors((newVisitors) => {
      setVisitors(newVisitors);
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

  const handleInviteToChat = async (v: Visitor) => {
    try {
      const cid = await inviteToChat(v.sessionId);
      setActiveTab('chats');
      setSelectedChatId(cid);
    } catch (error) {
      console.error("Invite failed", error);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) return;

    setProfileLoading(true);
    setProfileMessage(null);

    try {
      await changeUserPassword(oldPassword, newPassword);
      setProfileMessage({ type: 'success', text: 'Password updated successfully!' });
      setOldPassword('');
      setNewPassword('');
    } catch (error: any) {
      setProfileMessage({ type: 'error', text: error.message || 'Failed to update password' });
    } finally {
      setProfileLoading(false);
    }
  };

  const filteredChats = chats.filter(c =>
    c.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const embedCode = `<iframe 
  src="${window.location.origin}/#widget" 
  style="position:fixed; bottom:24px; right:24px; width:240px; height:380px; border:none; z-index:999999; border-radius:12px; overflow:hidden;"
  allow="clipboard-read; clipboard-write;"
></iframe>`;

  const copyEmbedCode = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex h-screen bg-[#f7f9fb] overflow-hidden font-sans">
      {/* Mini Sidebar */}
      <div className="w-[68px] bg-[#1a1a1a] flex flex-col items-center py-6 gap-8 shrink-0">
        <button
          onClick={() => setActiveTab('chats')}
          className={cn("nav-icon-min", activeTab === 'chats' && "active")}
        >
          <MessageSquare size={18} />
        </button>
        <div className="flex flex-col gap-8 text-gray-500">
          <div className="nav-icon-min"><Inbox size={18} /></div>
          <button
            onClick={() => setActiveTab('visitors')}
            className={cn("nav-icon-min", activeTab === 'visitors' && "active")}
          >
            <Users size={18} />
          </button>
          <div className="nav-icon-min"><Clock size={18} /></div>
          <button
            onClick={() => setActiveTab('settings')}
            className={cn("nav-icon-min", activeTab === 'settings' && "active")}
          >
            <Settings size={18} />
          </button>
        </div>
        <div className="mt-auto pb-4">
          <button onClick={() => logout()} className="nav-icon-min hover:bg-red-500/20 hover:text-red-400">
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Side Panel (Context Sensitive) */}
      <div className="w-[300px] bg-white border-r border-[#eeeeee] flex flex-col shrink-0">
        {activeTab === 'chats' && (
          <>
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
          </>
        )}

        {activeTab === 'visitors' && (
          <>
            <div className="p-6 border-b border-[#eeeeee]">
              <h1 className="text-xl font-bold text-[#1a1a1a] mb-2">Live Visitors</h1>
              <p className="text-xs text-[#94a3b8]">Real-time website traffic</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {visitors.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <Globe size={32} className="mx-auto mb-4 opacity-10" />
                  <p className="text-sm">No active visitors</p>
                </div>
              ) : (
                visitors.map(v => (
                  <div key={v.id} className="p-4 border-b border-[#f9f9f9] hover:bg-[#fcf8f8] transition-colors group">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs">
                        V
                      </div>
                      <div className="flex-1 truncate">
                        <div className="text-xs font-bold text-[#1a1a1a]">Anonymous Visitor</div>
                        <div className="text-[10px] text-[#94a3b8] truncate">{v.url}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleInviteToChat(v)}
                      className="w-full py-1.5 border border-blue-100 text-blue-600 rounded text-[10px] font-bold uppercase tracking-wider hover:bg-blue-600 hover:text-white transition-all"
                    >
                      Invite to Chat
                    </button>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {activeTab === 'settings' && (
          <div className="p-6">
            <h1 className="text-xl font-bold text-[#1a1a1a] mb-6">Settings</h1>
            <div className="section-title-min">Installation</div>
            <p className="text-xs text-[#64748b] mb-4">Paste this code into your website's HEAD or before the closing BODY tag.</p>
            <div className="bg-[#1a1a1a] rounded p-4 relative group">
              <pre className="text-[10px] text-gray-400 font-mono whitespace-pre-wrap leading-relaxed">
                {embedCode}
              </pre>
              <button
                onClick={copyEmbedCode}
                className="absolute top-2 right-2 p-2 bg-white/10 rounded text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
              </button>
            </div>
          </div>
        )}

        {/* User Card */}
        <button
          onClick={() => setActiveTab('profile')}
          className={cn(
            "p-5 bg-[#fafafa] border-t border-[#eeeeee] flex items-center gap-3 w-full text-left transition-all",
            activeTab === 'profile' ? "bg-white ring-1 ring-inset ring-blue-500/10" : "hover:bg-gray-100"
          )}
        >
          <div className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center text-[#1a1a1a] font-bold text-xs ring-2 ring-white">
            {user?.displayName?.charAt(0) || 'A'}
          </div>
          <div className="flex-1 truncate">
            <p className="text-sm font-semibold truncate text-[#1a1a1a]">{user?.displayName || 'Agent'}</p>
            <p className="text-[10px] text-[#10b981] flex items-center gap-1 font-bold">
              <span className="w-1.5 h-1.5 bg-[#10b981] rounded-full" /> ONLINE
            </p>
          </div>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-white">
        {activeTab === 'chats' ? (
          selectedChat ? (
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
          )
        ) : activeTab === 'profile' ? (
          <div className="flex-1 bg-[#f8fafc] overflow-y-auto p-12 md:p-24">
            <div className="max-w-xl mx-auto">
              <div className="mb-12">
                <h1 className="text-4xl font-bold tracking-tight text-[#1a1a1a] mb-4">Account Settings</h1>
                <p className="text-lg text-[#64748b]">Manage your personal information and security.</p>
              </div>

              <div className="bg-white rounded-lg border border-[#eeeeee] shadow-sm overflow-hidden mb-8">
                <div className="p-8 border-b border-[#f9f9f9]">
                  <div className="section-title-min">Personal Information</div>
                  <div className="grid gap-6">
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-[#94a3b8] font-bold block mb-1">Display Name</label>
                      <p className="text-sm font-medium text-[#1a1a1a]">{user?.displayName || 'Not set'}</p>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-[#94a3b8] font-bold block mb-1">Email Address</label>
                      <p className="text-sm font-medium text-[#1a1a1a]">{user?.email}</p>
                    </div>
                  </div>
                </div>

                <div className="p-8">
                  <div className="section-title-min">Security</div>
                  <form onSubmit={handleChangePassword} className="space-y-6">
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-[#94a3b8] font-bold block mb-2">Current Password</label>
                      <input
                        type="password"
                        required
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        className="input-box-min !bg-[#fafafa]"
                        placeholder="••••••••"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-[#94a3b8] font-bold block mb-2">New Password</label>
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="input-box-min !bg-[#fafafa]"
                        placeholder="••••••••"
                      />
                    </div>

                    {profileMessage && (
                      <div className={cn(
                        "p-4 rounded-md text-xs font-semibold",
                        profileMessage.type === 'success' ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"
                      )}>
                        {profileMessage.text}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={profileLoading}
                      className="w-full bg-[#1a1a1a] text-white py-3.5 rounded-md font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                      {profileLoading ? 'Updating...' : 'Update Password'}
                    </button>
                  </form>
                </div>
              </div>

              <div className="p-8 bg-red-50 rounded-lg border border-red-100">
                <h4 className="text-sm font-bold text-red-700 mb-2">Danger Zone</h4>
                <p className="text-xs text-red-600 mb-4 opacity-80">Once you delete your account, there is no going back. Please be certain.</p>
                <button className="px-5 py-2.5 bg-red-600 text-white rounded font-bold text-xs hover:bg-red-700 transition-colors">
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 p-20 flex flex-col items-center justify-center text-center">
            <Terminal size={48} className="text-[#eeeeee] mb-8" />
            <h1 className="text-4xl font-bold tracking-tight text-[#1a1a1a] mb-4">Command Center</h1>
            <p className="text-lg text-[#64748b] max-w-lg">
              Switch between active chats or browse live visitors from the left panel.
            </p>
          </div>
        )}
      </div>

      {/* Customer Info Panel */}
      {selectedChat && activeTab === 'chats' && (
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
