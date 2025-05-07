import React, { useState } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export const CreateSessionModal: React.FC<Props> = ({ open, onClose, onCreate, loading, error }) => {
  const [name, setName] = useState('');
  const [touched, setTouched] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!name.trim()) return;
    await onCreate(name.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur">
      <div className="bg-gradient-to-br from-cyan-900/90 to-cyan-800/90 border border-cyan-600/30 rounded-2xl shadow-xl p-8 w-full max-w-md relative">
        <button
          className="absolute top-4 right-4 text-cyan-300 hover:text-cyan-100 text-xl font-bold"
          onClick={onClose}
          disabled={loading}
        >
          ×
        </button>
        <h2 className="text-2xl font-bold text-cyan-100 mb-4">Create Session</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="session-name" className="block text-cyan-200 mb-1 font-medium">Session Name</label>
            <input
              id="session-name"
              type="text"
              className="w-full rounded-xl px-4 py-2 bg-cyan-950/30 border border-cyan-700 text-cyan-100 placeholder-cyan-400 focus:border-cyan-400 focus:ring-cyan-400"
              placeholder="e.g. Sprint 12 Planning"
              value={name}
              onChange={e => setName(e.target.value)}
              disabled={loading}
              autoFocus
            />
            {touched && !name.trim() && (
              <div className="text-red-400 text-sm mt-1">Session name is required.</div>
            )}
          </div>
          {error && <div className="text-red-400 font-semibold mt-1">{error}</div>}
          <button
            type="submit"
            className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold px-6 py-2 rounded-xl shadow-lg mt-2"
            disabled={loading || !name.trim()}
          >
            {loading ? 'Creating...' : 'Create Session'}
          </button>
        </form>
      </div>
    </div>
  );
};
