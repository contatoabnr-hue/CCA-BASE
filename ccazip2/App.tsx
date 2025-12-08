
import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, setDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from './firebase-config';
import { Story, ViewMode, NewsPost, City } from './types';
import { LibraryView } from './views/LibraryView';
import { ReaderView } from './views/ReaderView';
import { EditorView } from './views/EditorView';
import { DashboardView } from './views/DashboardView';
import { ArchiveView } from './views/ArchiveView';
import { NewsView } from './views/NewsView';
import { WorldView } from './views/WorldView';
import { BookOpen, LayoutDashboard, X, User, LogIn, LogOut, CheckCircle } from 'lucide-react';
import { Button } from './components/Button';



const INITIAL_NEWS: NewsPost[] = [
  {
    id: 'n1',
    title: "Reunião do Conselho das Sombras",
    bannerImage: "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=2094&auto=format&fit=crop",
    content: "<p>Os líderes das cinco guildas se reunirão na próxima lua cheia para discutir as anomalias detectadas nas fronteiras do norte.</p>",
    date: Date.now(),
    author: "Admin"
  }
];

const INITIAL_CITIES: City[] = [
  {
    id: 'c1',
    name: "Cidadela de Aethelgard",
    image: "https://images.unsplash.com/photo-1519999482648-25049ddd37b1?q=80&w=2026&auto=format&fit=crop",
    description: "Uma fortaleza construída sobre as nuvens, lar dos antigos dragões e dos primeiros magos."
  },
  {
    id: 'c2',
    name: "Porto da Névoa",
    image: "https://images.unsplash.com/photo-1516466723877-e4ec1d736c8a?q=80&w=2134&auto=format&fit=crop",
    description: "Onde os navios fantasmas atracam e o comércio de almas é moeda corrente nos becos escuros."
  }
];

// Allowed emails for login (move to .env in production)
const ALLOWED_EMAILS = [import.meta.env.VITE_ALLOWED_EMAILS || 'admin@example.com'];

export default function App() {
  const [view, setView] = useState<ViewMode>('library');

  const [news, setNews] = useState<NewsPost[]>(INITIAL_NEWS);
  const [cities, setCities] = useState<City[]>(INITIAL_CITIES);
  const [stories, setStories] = useState<Story[]>([]);
  const [activeStoryId, setActiveStoryId] = useState<string | null>(null);
  
  // Auth State
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginError, setLoginError] = useState('');

  // Notification State
  const [notification, setNotification] = useState<string | null>(null);

  // Load data from Firestore on mount with real-time listener
  useEffect(() => {
    // Load Stories
    const unsubscribeStories = onSnapshot(collection(db, 'Leitura'), (snapshot) => {
      const fetchedStories: Story[] = [];
      snapshot.forEach((doc) => {
        fetchedStories.push({ id: doc.id, ...doc.data() as Omit<Story, 'id'> });
      });
      setStories(fetchedStories);
    });

    // Load News
    const unsubscribeNews = onSnapshot(collection(db, 'Noticias'), (snapshot) => {
      const newsData: NewsPost[] = [];
      snapshot.forEach((doc) => {
        newsData.push({ id: doc.id, ...doc.data() as Omit<NewsPost, 'id'> });
      });
      setNews(newsData);
    });

    // Load Cities
    const unsubscribeCities = onSnapshot(collection(db, 'Cidades'), (snapshot) => {
      const citiesData: City[] = [];
      snapshot.forEach((doc) => {
        citiesData.push({ id: doc.id, ...doc.data() as Omit<City, 'id'> });
      });
      setCities(citiesData);
    });

    // Check session from localStorage
    const savedUser = localStorage.getItem('ink_scroll_user');
    if (savedUser) setCurrentUser(savedUser);

    // Cleanup subscriptions
    return () => {
      unsubscribeStories();
      unsubscribeNews();
      unsubscribeCities();
    };
  }, []);

  // Scroll to top whenever view changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view, activeStoryId]);

  const showToast = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (ALLOWED_EMAILS.includes(loginEmail.toLowerCase().trim())) {
      setCurrentUser(loginEmail);
      localStorage.setItem('ink_scroll_user', loginEmail);
      setShowLoginModal(false);
      setLoginEmail('');
      setLoginError('');
      setView('dashboard');
    } else {
      setLoginError('Email não autorizado. Apenas membros da guilda.');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('ink_scroll_user');
    setView('library');
  };

  // Story Handlers




  // News Handlers
  const handleSaveNews = async (post: NewsPost) => {
    try {
      const newsId = post.id;
      await setDoc(doc(db, 'Noticias', newsId), post);
      showToast("Notícia publicada!");
    } catch (err) {
      console.error("Error saving news:", err);
      showToast("Erro ao publicar notícia!");
    }
  };

  const handleDeleteNews = async (id: string) => {
    if(window.confirm("Excluir esta notícia?")) {
      try {
        await deleteDoc(doc(db, 'Noticias', id));
        showToast("Notícia removida!");
      } catch (err) {
        console.error("Error deleting news:", err);
        showToast("Erro ao remover notícia!");
      }
    }
  };

  // City Handlers
  const handleSaveCity = async (city: City) => {
    try {
      const cityId = city.id;
      await setDoc(doc(db, 'Cidades', cityId), city);
      showToast("Cidade atualizada no catálogo!");
    } catch (err) {
      console.error("Error saving city:", err);
      showToast("Erro ao atualizar cidade!");
    }
  };

  const handleDeleteCity = async (id: string) => {
    if(window.confirm("Remover esta cidade do catálogo?")) {
      try {
        await deleteDoc(doc(db, 'Cidades', id));
        showToast("Cidade removida do catálogo!");
      } catch (err) {
        console.error("Error deleting city:", err);
        showToast("Erro ao remover cidade!");
      }
    }
  };

  const handleOpenReader = (id: string) => {
    setActiveStoryId(id);
    setView('reader');
  };

  const handleOpenEditor = (id?: string) => {
    setActiveStoryId(id || null);
    setView('editor');
  };

  const handleNavigateToOrganizations = () => {
    setView('library');
    setTimeout(() => {
      document.getElementById('organizations-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const renderView = () => {
    switch (view) {
      case 'library':
        return (
          <LibraryView 
            stories={stories}
            onRead={handleOpenReader}
            currentUser={currentUser}
            onLogin={() => setShowLoginModal(true)}
            onEnterDashboard={() => setView('dashboard')}
            onViewAll={() => setView('archive')}
            onChangeView={setView}
          />
        );
      case 'archive':
        return (
          <ArchiveView 
            stories={stories}
            onRead={handleOpenReader}
            onBack={() => setView('library')}
          />
        );
      case 'reader':
        return (
          <ReaderView activeStoryId={activeStoryId} onBack={() => setView('library')} />
        );
      case 'news':
        return (
          <NewsView 
            news={news}
            onBack={() => setView('library')}
            currentUser={currentUser}
            onSave={handleSaveNews}
            onDelete={handleDeleteNews}
          />
        );
      case 'world':
        return (
          <WorldView 
            cities={cities}
            onBack={() => setView('library')}
            currentUser={currentUser}
            onSave={handleSaveCity}
            onDelete={handleDeleteCity}
          />
        );
      case 'dashboard':
        if (!currentUser) return <div className="p-10 text-center text-red-400">Acesso Negado. Faça login.</div>;
        return (
          <DashboardView 
            onCreate={() => handleOpenEditor()} 
            onEdit={handleOpenEditor}
          />
        );
      case 'editor':
        if (!currentUser) return <div className="p-10 text-center text-red-400">Acesso Negado. Faça login.</div>;
        return (
          <EditorView 
            storyId={activeStoryId || undefined} 
            onCancel={() => setView('dashboard')} 
            authorName={currentUser || 'Autor'}
          />
        );
      default:
        return <div>View not found</div>;
    }
  };

  return (
    <div className="min-h-screen bg-dark text-primary font-sans relative overflow-x-hidden">
      
      {/* Toast Notification */}
      <div className={`fixed top-20 right-4 z-[100] transition-all duration-500 transform ${notification ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
        <div className="bg-surface border border-magic/30 shadow-[0_0_15px_rgba(63,222,224,0.2)] text-primary px-6 py-4 rounded-lg flex items-center gap-3 backdrop-blur-md">
          <CheckCircle className="w-5 h-5 text-magic" />
          <span className="font-medium">{notification}</span>
        </div>
      </div>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-surface border border-primary/20 p-8 rounded-xl w-full max-w-md shadow-[0_0_30px_rgba(63,222,224,0.1)] relative animate-fade-in">
            <button 
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 text-primary/50 hover:text-magic"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="text-center mb-6">
              <User className="w-12 h-12 text-magic mx-auto mb-4" />
              <h2 className="text-2xl font-serif font-bold text-primary">Acesso à Guilda</h2>
              <p className="text-primary/60 text-sm mt-2">Insira seu email registrado para acessar as ferramentas de escrita.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <input 
                  type="email" 
                  required
                  placeholder="seu@email.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full bg-dark border border-primary/20 rounded-lg px-4 py-3 text-primary focus:ring-2 focus:ring-magic focus:border-transparent outline-none transition-all"
                />
              </div>
              
              {loginError && (
                <div className="text-red-400 text-sm text-center bg-red-900/20 p-2 rounded border border-red-900/50">
                  {loginError}
                </div>
              )}

              <Button type="submit" className="w-full justify-center" icon={<LogIn className="w-4 h-4" />}>
                Entrar
              </Button>
            </form>
            
        
          </div>
        </div>
      )}

      {/* Navigation - Always visible and fixed at the top */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-dark/90 backdrop-blur-md border-b border-primary/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div 
              className="flex items-center cursor-pointer group" 
              onClick={() => setView('library')}
            >
              <BookOpen className="h-6 w-6 text-primary group-hover:text-magic transition-colors mr-2" />
              <span className="text-xl font-serif font-bold text-primary group-hover:text-magic transition-colors tracking-tight">Crônicas de Atlas</span>
            </div>
            
            {/* Public-facing navigation buttons */}
            <div className="hidden md:flex items-center gap-2">
              <button 
                onClick={() => setView('library')}
                className={`text-sm font-medium px-3 py-2 rounded-md transition-colors ${['library', 'reader', 'archive'].includes(view) ? 'text-magic bg-white/5' : 'text-primary/70 hover:text-magic'}`}
              >
                Histórias
              </button>
              <button 
                onClick={() => setView('news')}
                className={`text-sm font-medium px-3 py-2 rounded-md transition-colors ${view === 'news' ? 'text-magic bg-white/5' : 'text-primary/70 hover:text-magic'}`}
              >
                Notícias
              </button>
              <button 
                onClick={() => setView('world')}
                className={`text-sm font-medium px-3 py-2 rounded-md transition-colors ${view === 'world' ? 'text-magic bg-white/5' : 'text-primary/70 hover:text-magic'}`}
              >
                Cidades
              </button>
              <button 
                onClick={handleNavigateToOrganizations}
                className="text-sm font-medium px-3 py-2 rounded-md transition-colors text-primary/70 hover:text-magic"
              >
                Organizações
              </button>
              <button 
                className="text-sm font-medium px-3 py-2 rounded-md transition-colors text-primary/70 opacity-50 cursor-not-allowed"
              >
                Discord
              </button>
            </div>

            {/* Auth-related buttons */}
            <div className="flex items-center gap-4">
              {currentUser ? (
                <>
                  <button 
                    onClick={() => setView('dashboard')}
                    className={`flex items-center text-sm font-medium px-3 py-2 rounded-md transition-colors ${view === 'dashboard' || view === 'editor' ? 'text-magic bg-white/5' : 'text-primary/70 hover:text-magic'}`}
                  >
                    <LayoutDashboard className="w-4 h-4 mr-1" />
                    Work
                  </button>
                  <div className="h-4 w-px bg-primary/20 mx-1"></div>
                  <div className="text-xs text-primary/40 mr-2 hidden md:block">{currentUser}</div>
                  <button 
                    onClick={handleLogout}
                    className="text-xs text-red-400 hover:text-red-300 flex items-center px-2 py-1 hover:bg-red-900/10 rounded"
                  >
                    <LogOut className="w-3 h-3 mr-1" /> Sair
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => setShowLoginModal(true)}
                  className="flex items-center text-primary/60 hover:text-magic transition-colors px-3 py-2 rounded-md hover:bg-white/5"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  <span className="text-sm">Login</span>
                </button>
              )}
            </div>
          </div>
      </nav>

      <main className="pt-16">
        {renderView()}
      </main>
    </div>
  );
}
