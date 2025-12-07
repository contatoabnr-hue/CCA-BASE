import React, { useEffect, useRef, useState } from 'react';
import { Story } from '../types';
import { FadeImage } from '../components/FadeImage';
import { ArrowLeft } from 'lucide-react';
import { db } from '../firebase-config';
import { doc, getDoc } from 'firebase/firestore';

interface ReaderViewProps {
  activeStoryId: string | null;
  onBack: () => void;
}

export const ReaderView: React.FC<ReaderViewProps> = ({ activeStoryId, onBack }) => {
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scrollY, setScrollY] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activeStoryId) {
      setError("Nenhuma história selecionada.");
      setLoading(false);
      return;
    }

    const fetchStory = async () => {
      setLoading(true);
      setError(null);
      try {
        const docRef = doc(db, 'Leitura', activeStoryId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setStory({ id: docSnap.id, ...docSnap.data() as Omit<Story, 'id'> });
        } else {
          setError("História não encontrada.");
        }
      } catch (err) {
        console.error("Error fetching story:", err);
        setError("Falha ao carregar a história. Tente novamente mais tarde.");
      } finally {
        setLoading(false);
      }
    };

    fetchStory();
  }, [activeStoryId]);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark text-primary">
        <p className="text-xl font-serif">Carregando história...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark text-red-400">
        <p className="text-xl font-serif">{error}</p>
        <button onClick={onBack} className="ml-4 px-4 py-2 bg-magic/20 text-magic rounded hover:bg-magic/30 transition-colors">Voltar</button>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark text-primary">
        <p className="text-xl font-serif">Selecione uma história para ler.</p>
        <button onClick={onBack} className="ml-4 px-4 py-2 bg-magic/20 text-magic rounded hover:bg-magic/30 transition-colors">Voltar</button>
      </div>
    );
  }
  
  // Title collapsing logic
  const titleOpacity = Math.max(0, 1 - scrollY / 400);
  const titleScale = Math.max(0.8, 1 - scrollY / 1000);
  const headerHeight = Math.max(100, 600 - scrollY * 0.8); 

  // Theme classes
  const themeClasses = {
    light: "bg-white text-stone-900",
    dark: "bg-dark text-primary", // Matches the site palette
    sepia: "bg-[#f4ecd8] text-[#5b4636]"
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 ${themeClasses[story.settings.theme]}`}>
      
      {/* Floating Back Button */}
      <button 
        onClick={onBack}
        className="fixed top-20 left-4 z-50 p-3 rounded-full bg-surface/80 shadow-lg hover:text-magic hover:border-magic border border-primary/10 transition-all text-primary backdrop-blur-sm"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      {/* Parallax Header */}
      {story.settings.parallaxHeader && (
        <div 
          className="relative w-full overflow-hidden"
          style={{ height: `${headerHeight}px` }}
        >
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ 
              backgroundImage: `url(${story.coverImage})`,
              backgroundAttachment: 'fixed', // Basic parallax
              transform: `translateY(${scrollY * 0.3}px)` // Enhanced manual parallax
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-dark/50 via-dark/30 to-dark/90" />
          
          <div className="absolute inset-0 flex items-center justify-center px-4 text-center">
            <div 
              style={{ 
                opacity: titleOpacity, 
                transform: `scale(${titleScale}) translateY(${scrollY * 0.5}px)` 
              }}
              className="max-w-4xl"
            >
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-black text-primary drop-shadow-2xl mb-4 leading-tight">
                {story.title}
              </h1>
              <p className="text-xl md:text-2xl text-primary/90 font-light font-sans drop-shadow-lg">
                {story.summary}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Standard Header if Parallax Disabled */}
      {!story.settings.parallaxHeader && (
        <div className="max-w-3xl mx-auto pt-24 pb-12 px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-6 text-primary">{story.title}</h1>
          <p className="text-lg opacity-75 italic text-primary/80">{story.summary}</p>
        </div>
      )}

      {/* Content */}
      <div 
        ref={contentRef}
        className="relative max-w-3xl mx-auto px-6 pb-32"
        style={{ marginTop: story.settings.parallaxHeader ? '-60px' : '0' }}
      >
        <div className={`p-8 md:p-12 rounded-t-xl shadow-2xl ${themeClasses[story.settings.theme]} border-t border-primary/5`}>
          
          <div className="flex justify-center mb-8 text-sm opacity-50 uppercase tracking-widest font-medium">
            <span>Por {story.author}</span>
            <span className="mx-2">•</span>
            <span>{new Date(story.createdAt).toLocaleDateString()}</span>
          </div>

          <div className="space-y-8">
            {story.blocks.map(block => (
              <div key={block.id} className="transition-all">
                {block.type === 'text' && (
                  <div 
                    className="prose prose-lg max-w-none font-serif leading-relaxed prose-invert"
                    style={{ 
                      fontSize: block.styles?.fontSize,
                      fontStyle: block.styles?.fontStyle,
                      fontWeight: block.styles?.fontWeight,
                      textAlign: block.styles?.textAlign,
                      color: 'inherit' // Force inherit for theme color
                    }}
                    dangerouslySetInnerHTML={{ __html: block.content }}
                  />
                )}
                {block.type === 'image' && (
                  <FadeImage 
                    src={block.content} 
                    enableEffect={story.settings.fadeImagesOnScroll}
                    className="my-8"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="mt-20 pt-10 border-t border-current opacity-30 flex justify-center">
            <span className="text-2xl font-serif">❦</span>
          </div>
        </div>
      </div>
    </div>
  );
};