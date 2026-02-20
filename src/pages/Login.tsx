import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, ArrowRight, Loader2, Phone, KeyRound, ArrowLeft } from 'lucide-react';
import { cn } from '../lib/utils';
import { ThemeToggle } from '../components/ThemeToggle';

export default function Login() {
    const [mode, setMode] = useState<'login' | 'forgot-password'>('login');

    // Login State
    const [userCode, setUserCode] = useState('');
    const [password, setPassword] = useState('');

    // Forgot Password State
    const [resetCode, setResetCode] = useState('');
    const [resetMobile, setResetMobile] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [resetSuccess, setResetSuccess] = useState('');

    // Common State
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            await login(userCode, password);
            navigate('/');
        } catch (err: any) {
            setError(err.message || 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setResetSuccess('');

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match");
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userCode: resetCode,
                    mobile: resetMobile,
                    newPassword
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to reset password');
            }

            setResetSuccess('Password reset successful! You can now login.');

            setTimeout(() => {
                setMode('login');
                setResetSuccess('');
                setResetCode('');
                setResetMobile('');
                setNewPassword('');
                setConfirmPassword('');
            }, 2000);

        } catch (err: any) {
            setError(err.message || 'Reset failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
            {/* Ambient Background */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/20 dark:bg-indigo-500/10 blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/20 dark:bg-blue-500/10 blur-[120px] animate-pulse delay-700" />
            </div>

            {/* Theme Toggle Absolute Position */}
            <div className="absolute top-6 right-6 z-50">
                <ThemeToggle />
            </div>

            <div className="w-full max-w-lg p-4 relative z-10">
                <div className="glass-card p-8 md:p-10 shadow-2xl relative overflow-hidden border-t border-white/50 dark:border-white/10">

                    {/* Decorative Top Line */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50" />

                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 shadow-lg shadow-indigo-500/30 text-white font-bold text-2xl mb-4">
                            C
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white font-display tracking-tight">
                            Gyandhara Industries
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
                            {mode === 'login' ? 'Sign in to access your dashboard' : 'Recover your account access'}
                        </p>
                    </div>

                    <AnimatePresence mode="wait">
                        {mode === 'login' ? (
                            <motion.div
                                key="login"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-6"
                            >
                                <form onSubmit={handleLogin} className="space-y-6">
                                    {error && (
                                        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-100 dark:border-red-900/30 animate-pulse">
                                            {error}
                                        </div>
                                    )}
                                    {resetSuccess && (
                                        <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm rounded-lg border border-green-100 dark:border-green-900/30">
                                            {resetSuccess}
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">User Code</label>
                                        <div className="relative group">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors" />
                                            <input
                                                type="text"
                                                value={userCode}
                                                onChange={(e) => setUserCode(e.target.value)}
                                                className="glass-input pl-12"
                                                placeholder="e.g. 600271"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
                                        <div className="relative group">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors" />
                                            <input
                                                type="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="glass-input pl-12"
                                                placeholder="••••••••"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between text-sm">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 bg-transparent" />
                                            <span className="text-slate-600 dark:text-slate-400">Remember me</span>
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => { setError(''); setMode('forgot-password'); }}
                                            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium hover:underline"
                                        >
                                            Forgot password?
                                        </button>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className={cn(
                                            "glass-btn w-full",
                                            isLoading && "cursor-not-allowed opacity-90"
                                        )}
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            {isLoading ? (
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                            ) : (
                                                <>
                                                    <span>Sign In</span>
                                                    <ArrowRight className="h-4 w-4" />
                                                </>
                                            )}
                                        </div>
                                    </button>
                                </form>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="forgot-password"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-6"
                            >
                                <div className="text-center lg:text-left">
                                    <button
                                        onClick={() => { setError(''); setMode('login'); }}
                                        className="flex items-center text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-4 transition-colors"
                                    >
                                        <ArrowLeft className="h-4 w-4 mr-1" />
                                        Back to Login
                                    </button>
                                </div>

                                <form onSubmit={handleResetPassword} className="space-y-5">
                                    {error && (
                                        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-100 dark:border-red-900/30 animate-pulse">
                                            {error}
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">User Code</label>
                                            <div className="relative group">
                                                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors" />
                                                <input
                                                    type="text"
                                                    value={resetCode}
                                                    onChange={(e) => setResetCode(e.target.value)}
                                                    className="glass-input pl-12"
                                                    placeholder="e.g. 600271"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Mobile Number</label>
                                            <div className="relative group">
                                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors" />
                                                <input
                                                    type="tel"
                                                    value={resetMobile}
                                                    onChange={(e) => setResetMobile(e.target.value)}
                                                    className="glass-input pl-12"
                                                    placeholder="e.g. 9876543210"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">New Password</label>
                                            <div className="relative group">
                                                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors" />
                                                <input
                                                    type="password"
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    className="glass-input pl-12"
                                                    placeholder="New password"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Confirm Password</label>
                                            <div className="relative group">
                                                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors" />
                                                <input
                                                    type="password"
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    className="glass-input pl-12"
                                                    placeholder="Confirm password"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className={cn(
                                            "glass-btn w-full",
                                            isLoading && "cursor-not-allowed opacity-90"
                                        )}
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            {isLoading ? (
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                            ) : (
                                                <span>Reset Password</span>
                                            )}
                                        </div>
                                    </button>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
                <div className="text-center mt-8 text-slate-500 dark:text-slate-400 text-sm">
                    &copy; 2024 Gyandhara Industries. All rights reserved.
                </div>
            </div>
        </div>
    );
}
