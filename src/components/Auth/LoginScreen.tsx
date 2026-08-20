import React, { useState } from 'react';
import { useEvent } from '../../context/EventContext';
import { Lock, Mail, ArrowRight, ArrowLeft, Shield } from 'lucide-react';
import { ButtonSpinner } from '../Shared/Loaders';

export const LoginScreen: React.FC = () => {
  const { login, error, clearError, setActiveView } = useEvent();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email.trim(), password);
    } catch {
      // Error is handled in context
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4.5rem)] flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200/80 p-6 sm:p-8 relative">
        
        {/* Back button */}
        <button
          onClick={() => setActiveView('participant')}
          className="absolute top-6 left-6 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          title="Back to audience view"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="text-center mb-8 pt-2">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20">
            <Shield className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Host Sign In</h2>
          <p className="text-slate-500 text-sm mt-1">Access Presenter Controls & Admin Studio</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 text-rose-700 text-xs font-semibold rounded-2xl border border-rose-200 flex justify-between items-center animate-fade-in">
            <span>{error}</span>
            <button onClick={clearError} className="text-rose-400 hover:text-rose-700 font-bold text-base ml-2">✕</button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Mail className="w-4 h-4 text-slate-400" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none transition-all"
                placeholder="host@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Lock className="w-4 h-4 text-slate-400" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3.5 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-70 cursor-pointer"
          >
            {isLoading ? (
              <span className="flex items-center space-x-2">
                <ButtonSpinner size="w-4 h-4" color="text-white" />
                <span className="animate-pulse tracking-wider text-xs uppercase">Authenticating...</span>
              </span>
            ) : (
              <>
                <span>Enter Presenter Studio</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 text-center border-t border-slate-100">
          <p className="text-xs text-slate-400">
            Need an account? Create one in your Supabase Auth dashboard.
          </p>
        </div>
      </div>
    </div>
  );
};
