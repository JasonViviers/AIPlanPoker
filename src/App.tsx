import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { EstimationSession } from './pages/EstimationSession';
import { AuthProvider } from './contexts/AuthContext';
import { EstimationProvider } from './contexts/EstimationContext';
import { ThemeProvider } from './contexts/ThemeContext';
import AuthGate from './components/auth/AuthGate';

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <EstimationProvider>
          <Router>
            <AuthGate>
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/session/:sessionId" element={<EstimationSession />} />
                </Routes>
              </Layout>
            </AuthGate>
          </Router>
        </EstimationProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;