import { useEffect, useRef } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import { Navigate } from 'react-router-dom';
import ProtectedRoute from '@/components/ProtectedRoute';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import AppLayout from '@/components/AppLayout';
import Dashboard from '@/pages/Dashboard';
import CreateNPC from '@/pages/CreateNPC';
import Library from '@/pages/Library';
import NPCDetail from '@/pages/NPCDetail';
import EditNPC from '@/pages/EditNPC';
import Roleplay from '@/pages/Roleplay';
import Campaigns from '@/pages/Campaigns';
import Conversations from '@/pages/Conversations';
import Templates from '@/pages/Templates';
import Settings from '@/pages/Settings';
import AgentRoleplay from '@/pages/AgentRoleplay';
import PersonalityInterview from '@/pages/PersonalityInterview';
import CharacterSheet from '@/pages/CharacterSheet';
import PlayerCharacters from '@/pages/PlayerCharacters';
import { ThemeProvider } from '@/components/ThemeProvider';
import { loadDraft, hasDraftData } from '@/lib/npcDraft';
// Add page imports here

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const navigate = useNavigate();
  const restoredRef = useRef(false);

  useEffect(() => {
    if (restoredRef.current) return;
    if (isLoadingAuth || isLoadingPublicSettings || authError) return;
    restoredRef.current = true;
    const draft = loadDraft();
    if (draft?.active_creator && draft.npc && hasDraftData(draft.npc)) {
      navigate('/create', { replace: true });
    }
  }, [isLoadingAuth, isLoadingPublicSettings, authError, navigate]);

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/create" element={<CreateNPC />} />
          <Route path="/library" element={<Library />} />
          <Route path="/npc/:id" element={<NPCDetail />} />
          <Route path="/edit/:id" element={<EditNPC />} />
          <Route path="/campaigns" element={<Campaigns />} />
          <Route path="/conversations" element={<Conversations />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/agent-roleplay" element={<AgentRoleplay />} />
          <Route path="/personality-interview" element={<PersonalityInterview />} />
          <Route path="/sheet/:id" element={<CharacterSheet />} />
          <Route path="/player-characters" element={<PlayerCharacters />} />
        </Route>
        <Route path="/roleplay/:npcId" element={<Roleplay />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <ThemeProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <ScrollToTop />
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </ThemeProvider>
    </AuthProvider>
  )
}

export default App