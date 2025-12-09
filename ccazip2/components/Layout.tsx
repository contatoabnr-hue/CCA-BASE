import React, { useEffect } from 'react';
import { BookOpen, LayoutDashboard, LogOut, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuthStore();
  const { notification } = useUIStore();

  const handleNavigateToOrganizations = () => {
    navigate('/library');
    setTimeout(() => {
      document.getElementById('organizations-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };
  
  // This useEffect is for scrolling to top on navigation.
  // It's placed here to ensure it runs when children (routes) change.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [navigate]);

  if (!currentUser) {
    // This should ideally not be reached if routes are properly protected,
    // but acts as a fallback. The parent App.tsx should handle redirection.
    return null; 
  }

  return (
    <div className="min-h-screen bg-dark text-primary font-sans relative overflow-x-hidden">
      
      {/* Toast Notification */}
      <div className={`fixed top-20 right-4 z-[100] transition-all duration-500 transform ${notification ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
        <div className="bg-surface border border-magic/30 shadow-[0_0_15px_rgba(63,222,224,0.2)] text-primary px-6 py-4 rounded-lg flex items-center gap-3 backdrop-blur-md">
          <CheckCircle className="w-5 h-5 text-magic" />
          <span className="font-medium">{notification}</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-dark/90 backdrop-blur-md border-b border-primary/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div 
              className="flex items-center cursor-pointer group" 
              onClick={() => navigate('/library')}
            >
              <BookOpen className="h-6 w-6 text-primary group-hover:text-magic transition-colors mr-2" />
              <span className="text-xl font-serif font-bold text-primary group-hover:text-magic transition-colors tracking-tight">Crônicas de Atlas</span>
            </div>
            
            <div className="hidden md:flex items-center gap-2">
              <button 
                onClick={() => navigate('/library')}
                className={`text-sm font-medium px-3 py-2 rounded-md transition-colors ${window.location.pathname.includes('/library') || window.location.pathname.includes('/story') || window.location.pathname.includes('/archive') ? 'text-magic bg-white/5' : 'text-primary/70 hover:text-magic'}`}
              >
                Histórias
              </button>
              <button 
                onClick={() => navigate('/news')}
                className={`text-sm font-medium px-3 py-2 rounded-md transition-colors ${window.location.pathname === '/news' ? 'text-magic bg-white/5' : 'text-primary/70 hover:text-magic'}`}
              >
                Notícias
              </button>
              <button 
                onClick={() => navigate('/world')}
                className={`text-sm font-medium px-3 py-2 rounded-md transition-colors ${window.location.pathname === '/world' ? 'text-magic bg-white/5' : 'text-primary/70 hover:text-magic'}`}
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

            <div className="flex items-center gap-4">
              {currentUser ? (
                <>
                  <button 
                    onClick={() => navigate('/dashboard')}
                    className={`flex items-center text-sm font-medium px-3 py-2 rounded-md transition-colors ${window.location.pathname === '/dashboard' || window.location.pathname.includes('/editor') ? 'text-magic bg-white/5' : 'text-primary/70 hover:text-magic'}`}
                  >
                    <LayoutDashboard className="w-4 h-4 mr-1" />
                    Work
                  </button>
                  <div className="h-4 w-px bg-primary/20 mx-1"></div>
                  <div className="text-xs text-primary/40 mr-2 hidden md:block">{currentUser.email}</div>
                  <button 
                    onClick={logout}
                    className="text-xs text-red-400 hover:text-red-300 flex items-center px-2 py-1 hover:bg-900/10 rounded"
                  >
                    <LogOut className="w-3 h-3 mr-1" /> Sair
                  </button>
                </>
              ) : (
                <></>
              )}
            </div>
          </div>
      </nav>

      <main className="pt-16">
        {children}
      </main>
    </div>
  );
};