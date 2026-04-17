/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { auth, loginWithGoogle } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import AgentDashboard from './components/AgentDashboard';
import ChatWidget from './components/ChatWidget';
import { LogIn, Rocket, Shield, Zap, Globe, MessageCircle, Users } from 'lucide-react';
import { motion } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAgentView, setIsAgentView] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      // If user is logged in, default to agent view if hash says so or we just want to
      if (u && window.location.hash === '#agent') {
        setIsAgentView(true);
      }
    });

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      unsubscribe();
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const handleHashChange = () => {
    setIsAgentView(window.location.hash === '#agent');
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#f7f9fb] font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-[#3b82f6] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#94a3b8] font-medium text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Agent Login View
  if (isAgentView && !user) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#f7f9fb] font-sans p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-12 rounded-lg shadow-sm border border-[#eeeeee] w-full max-w-md text-center"
        >
          <div className="w-12 h-12 bg-[#1a1a1a] rounded flex items-center justify-center text-white mx-auto mb-8">
            <Shield size={24} />
          </div>
          <h1 className="text-2xl font-bold text-[#1a1a1a] mb-2 tracking-tight">Agent Console</h1>
          <p className="text-[#64748b] mb-10 text-sm">Sign in to manage active support sessions.</p>
          
          <button
            onClick={loginWithGoogle}
            className="w-full flex items-center justify-center gap-3 bg-white border border-[#e2e8f0] py-4 rounded-md font-semibold text-sm hover:bg-[#f8fafc] transition-all"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
            Sign in with Google
          </button>
          
          <div className="mt-12 pt-8 border-t border-[#f9f9f9]">
            <button className="text-xs text-[#94a3b8] hover:text-[#3b82f6] font-medium transition-colors" onClick={() => window.location.hash = ''}>
               Back to Home
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Agent Dashboard
  if (isAgentView && user) {
    return <AgentDashboard />;
  }

  // Public Marketing Site
  return (
    <div className="min-h-screen bg-white font-sans text-[#1a1a1a] selection:bg-blue-50">
      {/* Nav */}
      <nav className="max-w-6xl mx-auto px-8 py-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#1a1a1a] rounded flex items-center justify-center text-white">
            <Zap size={16} fill="white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-[#1a1a1a]">StreamLine</span>
        </div>
        <div className="hidden md:flex items-center gap-10 font-medium text-[#64748b] text-sm">
          <a href="#" className="hover:text-[#1a1a1a] transition-colors">Platform</a>
          <a href="#" className="hover:text-[#1a1a1a] transition-colors">Customers</a>
          <a href="#" className="hover:text-[#1a1a1a] transition-colors">Pricing</a>
        </div>
        <div className="flex items-center gap-6">
          <button 
            onClick={() => window.location.hash = 'agent'}
            className="text-sm font-semibold text-[#64748b] hover:text-[#1a1a1a] transition-colors"
          >
            Agent Console
          </button>
          <button className="bg-[#3b82f6] text-white px-5 py-2.5 rounded text-sm font-bold shadow-sm hover:opacity-90 active:scale-95 transition-all">
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero */}
      <main className="max-w-6xl mx-auto px-8 pt-24 pb-32">
        <div className="max-w-3xl">
          <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold leading-tight tracking-tight mb-8">
              Human support <br/>at <span className="text-[#3b82f6]">internet scale.</span>
            </h1>
            <p className="text-xl text-[#64748b] max-w-xl mb-12">
              The minimalist platform for high-growth support teams. Real-time chat, customer context, and agent insights.
            </p>
            <div className="flex items-center gap-4">
               <button className="px-8 py-4 bg-[#1a1a1a] text-white rounded font-bold text-base hover:opacity-90 transition-all">
                  Start Trial
               </button>
               <button className="px-8 py-4 bg-white border border-[#e2e8f0] rounded font-bold text-base hover:bg-[#f8fafc] transition-all">
                  Watch Demo
               </button>
            </div>
          </motion.div>
        </div>

        {/* Console Preview */}
        <div className="mt-32 border border-[#eeeeee] rounded-lg shadow-2xl overflow-hidden bg-[#fafafa]">
           <div className="h-10 border-b border-[#eeeeee] px-4 flex items-center gap-1.5">
             <div className="w-2.5 h-2.5 rounded-full bg-[#eeeeee]" />
             <div className="w-2.5 h-2.5 rounded-full bg-[#eeeeee]" />
             <div className="w-2.5 h-2.5 rounded-full bg-[#eeeeee]" />
           </div>
           <div className="h-[400px] flex">
              <div className="w-16 bg-[#1a1a1a] border-r border-[#eeeeee]" />
              <div className="w-64 bg-white border-r border-[#eeeeee]" />
              <div className="flex-1 bg-[#fafafa]" />
           </div>
        </div>
      </main>

      {/* Features */}
      <section className="border-t border-[#f9f9f9] py-32 bg-[#f8fafc]">
         <div className="max-w-6xl mx-auto px-8 grid md:grid-cols-3 gap-16">
            {[
              { title: "Universal Real-time", desc: "Built on an event-driven architecture that keeps every agent in sync instantly." },
              { title: "Total Context", desc: "Never ask for an email again. Full customer profile data displayed in every session." },
              { title: "Team Workflow", desc: "Intuitive queue management that lets agents focus on solving problems, not triage." }
            ].map((f, i) => (
              <div key={i}>
                <h3 className="text-sm font-bold uppercase tracking-widest text-[#94a3b8] mb-6">{f.title}</h3>
                <p className="text-[#64748b] leading-relaxed text-sm">{f.desc}</p>
              </div>
            ))}
         </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-20 border-t border-[#eeeeee]">
         <div className="max-w-6xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-10">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 bg-[#1a1a1a] rounded flex items-center justify-center text-white">
                <Zap size={14} fill="white" />
              </div>
              <span className="text-base font-bold tracking-tight">StreamLine</span>
            </div>
            <p className="text-xs text-[#94a3b8]">© 2026 StreamLine. Designed for performance.</p>
            <div className="flex gap-8 text-xs font-bold text-[#64748b]">
               <a href="#" className="hover:text-[#1a1a1a]">Privacy</a>
               <a href="#" className="hover:text-[#1a1a1a]">Terms</a>
               <a href="#" className="hover:text-[#1a1a1a]">Cookies</a>
            </div>
         </div>
      </footer>

      {/* The Actual Chat Widget */}
      <ChatWidget />
    </div>
  );
}
