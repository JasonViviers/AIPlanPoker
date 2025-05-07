import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';

export default function RegisterForm({ onSwitch }: { onSwitch?: (view: 'login') => void }) {
  const { signUp, loading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await signUp(email, password);
    setSuccess('Check your email for confirmation.');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/10 backdrop-blur border border-cyan-800 shadow-xl rounded-2xl px-8 py-10"
    >
      <div className="flex items-center mb-6">
        <Users className="h-7 w-7 text-cyan-400 mr-2" />
        <h2 className="text-2xl font-bold text-cyan-100 drop-shadow">Register</h2>
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
          {loading ? 'Registering...' : 'Register'}
        </button>
        {error && <div className="auth-error text-red-400 text-center font-medium mt-2">{error}</div>}
        {success && <div className="auth-success text-green-400 text-center font-medium mt-2">{success}</div>}
      </form>
      <div className="flex justify-between mt-6">
        <button type="button" onClick={() => onSwitch?.('login')} className="text-cyan-300 hover:underline font-medium">Back to Login</button>
      </div>
    </motion.div>
  );
}
