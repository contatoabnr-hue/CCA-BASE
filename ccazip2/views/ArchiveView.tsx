
import React, { useEffect, useState } from 'react';
import { Story } from '../types';
import { ArrowLeft, Search } from 'lucide-react';
import { DEFAULT_COVER } from '../constants';
import { db } from '../firebase-config';
import { collection, onSnapshot, query, orderBy, where } from 'firebase/firestore';

interface ArchiveViewProps {
  onRead: (id: string) => void;
  onBack: () => void;
}

export const ArchiveView: React.FC<ArchiveViewProps> = ({ onRead, onBack }) => {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, 'Leitura'),
      where('isPublished', '==', true), // Only show published stories
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedStories: Story[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as Omit<Story, 'id'>
      }));
      setStories(fetchedStories);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching stories for archive:", err);
      setError("Falha ao carregar as histórias. Tente novamente mais tarde.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark text-primary">
        <p className="text-xl font-serif">Carregando histórias...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark text-red-400">
        <p className="text-xl font-serif">{error}</p>
      </div>
    );
  }
  
  // Sorted by newest first is already handled by the query orderBy
  const sortedStories = stories;

  return (
    <div className="min-h-screen bg-dark text-primary font-sans p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-12 pb-6 border-b border-primary/10">
          <button 
            onClick={onBack}
            className="flex items-center text-primary/60 hover:text-magic transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar
          </button>
          <h1 className="text-3xl font-serif font-bold text-center">Todas as Histórias</h1>
          <div className="w-20"></div> {/* Spacer for centering */}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {sortedStories.map(story => (
            <div 
              key={story.id} 
              onClick={() => onRead(story.id)}
              className="group bg-surface rounded-xl overflow-hidden shadow-lg hover:shadow-[0_0_15px_rgba(63,222,224,0.15)] transition-all duration-300 border border-primary/10 hover:border-magic cursor-pointer flex flex-col h-full"
            >
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={story.coverImage || DEFAULT_COVER} 
                  alt={story.title} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-80 group-hover:opacity-100"
                  onError={(e) => e.currentTarget.src = DEFAULT_COVER}
                />
                <div className="absolute inset-0 bg-dark/20 group-hover:bg-transparent transition-colors" />
              </div>
              <div className="p-5 flex flex-col flex-grow">
                <h4 className="text-lg font-serif font-bold text-primary mb-2 group-hover:text-magic transition-colors line-clamp-2">
                  {story.title}
                </h4>
                <p className="text-primary/60 text-sm mb-4 line-clamp-3 flex-grow">
                  {story.summary}
                </p>
                <div className="pt-4 border-t border-primary/5 flex justify-between items-center text-xs text-primary/40">
                   <span>{new Date(story.createdAt).toLocaleDateString('pt-BR')}</span>
                   <span>{story.author}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {sortedStories.length === 0 && (
            <div className="text-center py-20 text-primary/40">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-50"/>
                <p>Nenhuma história encontrada no arquivo.</p>
            </div>
        )}
      </div>
    </div>
  );
};
