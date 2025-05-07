import { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import ResetPasswordForm from './ResetPasswordForm';
import { useAuth } from '../../contexts/AuthContext';
import { Layout } from '../Layout';

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [view, setView] = useState<'login' | 'register' | 'reset'>('login');

  if (loading) return (
    <Layout>
      <div className="auth-loading glass neon-cyan flex items-center justify-center min-h-screen text-xl">Loading...</div>
    </Layout>
  );
  if (user) return <>{children}</>;

  return (
    <Layout>
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-full max-w-md">
          {view === 'login' && <LoginForm onSwitch={setView} />}
          {view === 'register' && <RegisterForm onSwitch={() => setView('login')} />}
          {view === 'reset' && <ResetPasswordForm onSwitch={() => setView('login')} />}
        </div>
      </div>
    </Layout>
  );
}
