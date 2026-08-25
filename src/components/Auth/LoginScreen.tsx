import React, { useState } from 'react';
import { useEvent } from '../../context/EventContext';
import { Lock, Mail, ArrowRight, ArrowLeft } from 'lucide-react';
import { ButtonSpinner } from '../Shared/Loaders';
import { BrandLogo } from '../Shared/BrandLogo';
import { PikteraMascot } from '../Shared/PikteraMascot';

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
      // Error handled in context
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full flex-1 flex items-center justify-center p-4 sm:p-6 pb-safe bg-dot-grid">
      <div className="max-w-md w-full neo-card p-6 sm:p-8 relative">
        
        {/* Back button */}
        <button
          onClick={() => setActiveView('participant')}
          className="absolute top-4 left-4 neo-btn bg-white p-2"
          title="Back to audience mode"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        {/* Piktera Mascot at Top */}
        <div className="flex flex-col items-center text-center mb-6 pt-2">
          <div className="mb-2">
            <PikteraMascot size="sm" mood="happy" headOnly={false} />
          </div>
          <BrandLogo size="md" showText={true} showTagline={true} className="mb-2 justify-center" />
          <h2 className="text-xl sm:text-2xl font-black text-[#000000] tracking-tight font-heading uppercase">
            Host Sign In
          </h2>
          <p className="text-gray-600 text-xs mt-1 font-mono">
            Access Presenter Controls & Admin Studio
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-[#FF1784] text-white text-xs font-bold rounded-lg border-2 border-[#000000] flex justify-between items-center" style={{ boxShadow: '2px 2px 0px #000000' }}>
            <span>{error}</span>
            <button onClick={clearError} className="font-black ml-2 hover:opacity-70 cursor-pointer">✕</button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-black text-[#000000] uppercase tracking-wider mb-1.5 font-mono">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="w-4 h-4 text-gray-400" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="neo-input w-full pl-9"
                placeholder="host@piktera.live"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-black text-[#000000] uppercase tracking-wider mb-1.5 font-mono">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="w-4 h-4 text-gray-400" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="neo-input w-full pl-9"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="neo-btn w-full mt-2 py-3 px-4 bg-[#C1FF33] text-[#000000] font-black text-sm"
          >
            {isLoading ? (
              <span className="flex items-center space-x-2">
                <ButtonSpinner size="w-4 h-4" color="text-[#000000]" />
                <span className="tracking-wider text-xs font-mono">Authenticating...</span>
              </span>
            ) : (
              <>
                <span>Enter Host Studio</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
