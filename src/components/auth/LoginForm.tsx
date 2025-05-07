import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';

export default function LoginForm({ onSwitch }: { onSwitch?: (view: 'register' | 'reset') => void }) {
  const { signIn, loading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await signIn(email, password);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/10 backdrop-blur border border-cyan-800 shadow-xl rounded-2xl px-8 py-10"
    >
      <div className="flex items-center mb-6">
        <Users className="h-7 w-7 text-cyan-400 mr-2" />
        <h2 className="text-2xl font-bold text-cyan-100 drop-shadow">Sign In</h2>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoFocus
            className="mt-1 block w-full rounded-xl border border-cyan-700 bg-cyan-950/30 text-cyan-100 placeholder-cyan-400 shadow focus:border-cyan-400 focus:ring-cyan-400 sm:text-base px-4 py-3 transition-all"
          />
        </div>
        <div>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="mt-1 block w-full rounded-xl border border-cyan-700 bg-cyan-950/30 text-cyan-100 placeholder-cyan-400 shadow focus:border-cyan-400 focus:ring-cyan-400 sm:text-base px-4 py-3 transition-all"
          />
        </div>
        <button type="submit" disabled={loading} className="inline-flex items-center px-6 py-2 border border-cyan-700 rounded-xl shadow-cyan-500/30 shadow-lg text-white bg-cyan-600 hover:bg-cyan-700 font-semibold text-base tracking-wide transition-all duration-200 w-full justify-center">
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
        {error && <div className="auth-error text-red-400 text-center font-medium mt-2">{error}</div>}
      </form>
      <div className="flex justify-between mt-6">
        <button type="button" onClick={() => onSwitch?.('register')} className="text-cyan-300 hover:underline font-medium">Register</button>
        <button type="button" onClick={() => onSwitch?.('reset')} className="text-cyan-300 hover:underline font-medium">Forgot Password?</button>
      </div>
    </motion.div>
  );
}
