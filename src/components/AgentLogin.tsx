import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import { loginWithGoogle, signInWithEmail, signUpWithEmail } from '../lib/firebase';

interface AgentLoginProps {
    onBackToHome: () => void;
}

export default function AgentLogin({ onBackToHome }: AgentLoginProps) {
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            if (mode === 'login') {
                await signInWithEmail(email, password);
            } else {
                await signUpWithEmail(email, password, name);
            }
        } catch (err: any) {
            setError(err.message || 'Authentication failed');
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError(null);
        try {
            await loginWithGoogle();
        } catch (err: any) {
            setError(err.message || 'Google login failed');
            setLoading(false);
        }
    };

    return (
        <div className="h-screen w-screen flex items-center justify-center bg-[#f7f9fb] font-sans p-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-white rounded-xl shadow-sm border border-[#eeeeee] w-full max-w-md overflow-hidden"
            >
                <div className="p-10 text-center border-b border-[#f9f9f9]">
                    <div className="w-12 h-12 bg-[#1a1a1a] rounded flex items-center justify-center text-white mx-auto mb-6">
                        <Shield size={24} />
                    </div>
                    <h1 className="text-2xl font-bold text-[#1a1a1a] mb-2 tracking-tight">Agent Console</h1>
                    <p className="text-[#64748b] text-sm">Manage your support sessions with ease.</p>
                </div>

                <div className="p-10">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <AnimatePresence mode="wait">
                            {mode === 'signup' && (
                                <motion.div
                                    key="name"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                >
                                    <label htmlFor="display-name" className="text-[10px] uppercase tracking-widest text-[#94a3b8] font-bold block mb-2">Display Name</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <input
                                            type="text"
                                            required
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            id="display-name" placeholder="John Doe"
                                            className="w-full bg-[#f8fafc] border border-[#e2e8f0] pl-10 pr-4 py-3 rounded-md text-sm outline-none focus:border-[#3b82f6] transition-all"
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div>
                            <label htmlFor="email-address" className="text-[10px] uppercase tracking-widest text-[#94a3b8] font-bold block mb-2">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    id="email-address" placeholder="name@company.com"
                                    className="w-full bg-[#f8fafc] border border-[#e2e8f0] pl-10 pr-4 py-3 rounded-md text-sm outline-none focus:border-[#3b82f6] transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="text-[10px] uppercase tracking-widest text-[#94a3b8] font-bold block mb-2">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    id="password" placeholder="••••••••"
                                    className="w-full bg-[#f8fafc] border border-[#e2e8f0] pl-10 pr-4 py-3 rounded-md text-sm outline-none focus:border-[#3b82f6] transition-all"
                                />
                            </div>
                        </div>

                        {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

                        <button
                            type="submit"
                            disabled={loading} aria-busy={loading}
                            className="w-full bg-[#1a1a1a] text-white py-3.5 rounded-md font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" size={18} />
                            ) : (
                                <>
                                    {mode === 'login' ? 'Sign In' : 'Create Account'}
                                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-[#eeeeee]"></div>
                        </div>
                        <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold">
                            <span className="bg-white px-4 text-[#94a3b8]">OR</span>
                        </div>
                    </div>

                    <button
                        onClick={handleGoogleLogin}
                        disabled={loading} aria-busy={loading}
                        aria-label="Continue with Google" className="w-full flex items-center justify-center gap-3 bg-white border border-[#e2e8f0] py-3.5 rounded-md font-semibold text-sm hover:bg-[#f8fafc] transition-all"
                    >
                        <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
                        Continue with Google
                    </button>

                    <div className="mt-8 text-center">
                        <button
                            type="button"
                            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                            className="text-xs text-[#3b82f6] font-bold hover:underline"
                        >
                            {mode === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
                        </button>
                    </div>
                </div>

                <div className="p-6 bg-[#f8fafc] border-t border-[#eeeeee] text-center">
                    <button
                        className="text-xs text-[#94a3b8] hover:text-[#3b82f6] font-medium transition-colors"
                        onClick={onBackToHome}
                    >
                        Back to Marketing Site
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
