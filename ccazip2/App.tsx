import React, { useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';

// Import stores
import { useAuthStore } from './stores/authStore';
import { useUIStore } from './stores/uiStore';
import { useStoryStore } from './stores/storyStore';
import { useContentStore } from './stores/contentStore';

// Import views
import { LibraryView } from './views/LibraryView';
import { ReaderView } from './views/ReaderView';
import { EditorView } from './views/EditorView';
import { DashboardView } from './views/DashboardView';
import { ArchiveView } from './views/ArchiveView';
import { NewsView } from './views/NewsView';
import { WorldView } from './views/WorldView';
import { LoginView } from './views/LoginView';

// Import Layout component
import { Layout } from './components/Layout';

// A component to protect routes and apply the Layout
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, loadingAuth } = useAuthStore();
  if (loadingAuth) {
    return <div className="min-h-screen bg-dark text-primary flex items-center justify-center">Carregando...</div>;
  }
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  return <Layout>{children}</Layout>;
};

export default function App() {
  const navigate = useNavigate();

  // Get state and actions from stores
  const { currentUser, loadingAuth, initAuth, logout } = useAuthStore();
  const { notification } = useUIStore();
  const { initStoryListener, setActiveStoryId } = useStoryStore();
  const { initContentListeners } = useContentStore();

  // Initialize all firebase listeners once
  useEffect(() => {
    const unsubAuth = initAuth();
    const unsubStories = initStoryListener();
    const unsubContent = initContentListeners();

    return () => {
      unsubAuth();
      unsubStories();
      unsubContent();
    };
  }, [initAuth, initStoryListener, initContentListeners]);

  // The previous useEffect responsible for unconditional navigation is removed.

  const handleOpenReader = (id: string) => {
    setActiveStoryId(id);
    navigate(`/story/${id}`);
  };

  const handleOpenEditor = (id?: string) => {
    setActiveStoryId(id || null);
    navigate(id ? `/editor/${id}` : `/editor/new`);
  };

  const handleNavigateToOrganizations = () => {
    navigate('/library');
    setTimeout(() => {
      document.getElementById('organizations-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  if (loadingAuth) {
    return <div className="min-h-screen bg-dark text-primary flex items-center justify-center">Carregando...</div>;
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginView />} />
      <Route path="/" element={<Navigate to="/library" replace />} />
      <Route path="/library" element={<LibraryView onRead={handleOpenReader} />} />
      <Route path="/story/:storyId" element={<ReaderView onBack={() => navigate('/library')} />} />
      <Route path="/news" element={<NewsView onBack={() => navigate('/library')} />} />
      <Route path="/world" element={<WorldView onBack={() => navigate('/library')} />} />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardView onCreate={() => handleOpenEditor()} onEdit={handleOpenEditor} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/editor/new"
        element={
          <ProtectedRoute>
            <EditorView onCancel={() => navigate('/dashboard')} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/editor/:storyId"
        element={
          <ProtectedRoute>
            <EditorView onCancel={() => navigate('/dashboard')} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/archive"
        element={
          <ProtectedRoute>
            <ArchiveView onRead={handleOpenReader} onBack={() => navigate('/library')} />
          </ProtectedRoute>
        }
      />

      {/* Catch-all for undefined routes */}
      <Route path="*" element={<div>404 Not Found</div>} />
    </Routes>
  );
}