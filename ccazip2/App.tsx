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

  // Handle auth state changes for navigation
  useEffect(() => {
    if (!loadingAuth) {
      if (currentUser) {
        navigate('/dashboard'); 
      } else {
        navigate('/login');
      }
    }
  }, [currentUser, loadingAuth, navigate]);

  const handleOpenReader = (id: string) => {
    setActiveStoryId(id);
    navigate(`/story/${id}`);
  };

  const handleOpenEditor = (id?: string) => {
    setActiveStoryId(id || null);
    navigate(id ? `/editor/${id}` : '/editor/new');
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
      <Route path="/login" element={<LoginView />} />
      <Route path="*" element={<Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/library" replace />} />
          <Route path="/library" element={<LibraryView onRead={handleOpenReader} />} />
          <Route path="/archive" element={<ArchiveView onRead={handleOpenReader} onBack={() => navigate('/library')} />} />
          <Route path="/story/:storyId" element={<ReaderView onBack={() => navigate('/library')} />} />
          <Route path="/news" element={<NewsView onBack={() => navigate('/library')} />} />
          <Route path="/world" element={<WorldView onBack={() => navigate('/library')} />} />
          <Route path="/dashboard" element={<DashboardView onCreate={() => handleOpenEditor()} onEdit={handleOpenEditor} />} />
          <Route path="/editor/new" element={<EditorView onCancel={() => navigate('/dashboard')} />} />
          <Route path="/editor/:storyId" element={<EditorView onCancel={() => navigate('/dashboard')} />} />
          <Route path="*" element={<div>404 Not Found</div>} />
        </Routes>
      </Layout>} />
    </Routes>
  );
}