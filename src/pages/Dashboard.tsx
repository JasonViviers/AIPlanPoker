import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { useEstimation } from '../contexts/EstimationContext';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { CreateSessionModal } from '../components/CreateSessionModal';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};


const onboardingSteps = [
  {
    title: 'Welcome to Scrum Poker',
    description: 'Estimate stories collaboratively with your team in a futuristic, guided environment.'
  },
  {
    title: 'Create a Session',
    description: 'Click "New Session" to start planning. Invite your team and add stories to estimate.'
  },
  {
    title: 'Vote with Style',
    description: 'Use animated cards to vote on complexity. Hover or tap cards for guidelines.'
  }
];

export function Dashboard() {
  const navigate = useNavigate();
  const store = useEstimation();
  const { user } = useAuth();
  const [showOnboarding, setShowOnboarding] = React.useState(true);
  const [step, setStep] = React.useState(0);
  const [joinId, setJoinId] = React.useState('');
  const [joinError, setJoinError] = React.useState<string | null>(null);
  const [createLoading, setCreateLoading] = React.useState(false);
  const [createError, setCreateError] = React.useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [sessions, setSessions] = React.useState<any[]>([]);
  const [sessionsLoading, setSessionsLoading] = React.useState(false);
  const [sessionsError, setSessionsError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setSessionsLoading(true);
    setSessionsError(null);
    import('../api/supabaseApi').then(api =>
      api.getActiveSessions()
        .then(setSessions)
        .catch(e => setSessionsError((e as Error).message))
        .finally(() => setSessionsLoading(false))
    );
  }, []);

  const handleCreateSession = async (name: string) => {
    setCreateError(null);
    setCreateLoading(true);
    if (!user) {
      setCreateError('User not authenticated');
      setCreateLoading(false);
      return;
    }
    const sessionId = crypto.randomUUID();
    try {
      await import('../api/supabaseApi').then(api => api.createSession(sessionId, user.id, name));
      store.getState().setActiveSession(sessionId);
      setShowCreateModal(false);
      navigate(`/session/${sessionId}`);
    } catch (e) {
      setCreateError('Failed to create session: ' + (e as Error).message);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleJoinSession = () => {
    setJoinError(null);
    if (!joinId) {
      setJoinError('Please enter a session ID.');
      return;
    }
    // Optionally: check if session exists
    navigate(`/session/${joinId}`);
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6 min-h-screen bg-gradient-to-br from-gray-900 via-cyan-900 to-black py-8 px-2 md:px-0"
    >
      <AnimatePresence>
        {showOnboarding && (
          <motion.div
            key="onboarding"
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="max-w-xl mx-auto bg-white/10 p-8 rounded-2xl shadow-xl mb-8"
          >
            <h2 className="text-2xl font-bold text-cyan-200 mb-2 text-center drop-shadow">{onboardingSteps[step].title}</h2>
            <p className="text-cyan-100 mb-6 text-center">{onboardingSteps[step].description}</p>
            <div className="flex gap-4">
              {step > 0 && (
                <button
                  className="px-4 py-2 rounded-lg bg-cyan-800 text-cyan-100 hover:bg-cyan-700"
                  onClick={() => setStep(step - 1)}
                >
                  Back
                </button>
              )}
              {step < onboardingSteps.length - 1 ? (
                <button
                  className="px-4 py-2 rounded-lg bg-cyan-600 text-white font-semibold hover:bg-cyan-500 shadow-cyan-400/30 shadow"
                  onClick={() => setStep(step + 1)}
                >
                  Next
                </button>
              ) : (
                <button
                  className="px-4 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-500 shadow-green-400/30 shadow"
                  onClick={() => setShowOnboarding(false)}
                >
                  Get Started
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Session Controls */}
      <div className="max-w-xl mx-auto bg-white/10 p-8 rounded-2xl shadow-xl">
        <h2 className="text-xl font-bold text-cyan-100 mb-6">Start or Join a Session</h2>
        <div className="flex flex-col gap-4">
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg mb-2"
            disabled={createLoading}
          >
            Create Session
          </button>
          {createError && <div className="text-red-400 font-semibold mt-2">{createError}</div>}
          <CreateSessionModal
            open={showCreateModal}
            onClose={() => { setShowCreateModal(false); setCreateError(null); }}
            onCreate={handleCreateSession}
            loading={createLoading}
            error={createError}
          />
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Enter Session ID"
              value={joinId}
              onChange={e => setJoinId(e.target.value)}
              className="flex-1 rounded-xl px-4 py-2 bg-cyan-950/30 border border-cyan-700 text-cyan-100 placeholder-cyan-400"
            />
            <button
              onClick={handleJoinSession}
              className="bg-cyan-500 hover:bg-cyan-600 text-white font-semibold px-4 py-2 rounded-xl shadow"
            >
              Join
            </button>
          </div>
          {joinError && <div className="text-red-400 font-semibold mt-2">{joinError}</div>}
        </div>
      </div>

      <h2 className="text-2xl font-bold text-cyan-100 mb-4 mt-10">Planning Sessions</h2>
      {sessionsLoading ? (
        <div className="text-cyan-200">Loading sessions...</div>
      ) : sessionsError ? (
        <div className="text-red-400">{sessionsError}</div>
      ) : sessions.length === 0 ? (
        <div className="text-cyan-300">No active sessions found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {sessions.map(session => (
            <div key={session.id} className="bg-white/10 p-6 rounded-xl shadow flex flex-col gap-2 border border-cyan-800">
              <div className="flex items-center justify-between">
                <span className="text-cyan-200 font-mono text-xs">ID: {session.id}</span>
                <span className="text-cyan-400 text-xs">{new Date(session.created_at).toLocaleString()}</span>
              </div>
              <div className="text-cyan-100 font-bold text-lg truncate">{session.name || 'Untitled Session'}</div>
              <div className="flex gap-2 mt-2">
                <button
                  className="bg-cyan-700 hover:bg-cyan-600 text-white px-4 py-1 rounded text-sm"
                  onClick={() => navigate(`/session/${session.id}`)}
                >Join</button>
                <button
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                  onClick={async () => {
                    if (window.confirm(`Delete session '${session.name || session.id}'? This cannot be undone.`)) {
                      try {
                        setSessionsLoading(true);
                        await import('../api/supabaseApi').then(api => api.deleteSession(session.id));
                        setSessions(sessions => sessions.filter(s => s.id !== session.id));
                      } catch (e) {
                        alert('Failed to delete session: ' + (e instanceof Error ? e.message : e));
                      } finally {
                        setSessionsLoading(false);
                      }
                    }
                  }}
                >Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}