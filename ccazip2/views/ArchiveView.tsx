
import React, { useState } from 'react';
import { ArrowLeft, Search } from 'lucide-react';
import { DEFAULT_COVER } from '../constants';
import { useStoryStore } from '../stores/storyStore';
import { useUIStore } from '../stores/uiStore';

interface ArchiveViewProps {
  onRead: (id: string) => void;
}

export const ArchiveView: React.FC<ArchiveViewProps> = ({ onRead }) => {
  const stories = useStoryStore(state => state.stories);
  const setView = useUIStore(state => state.setView);

  const [searchQuery, setSearchQuery] = useState('');
  const sortedStories = [...stories].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const filteredStories = sortedStories.filter(story =>
    story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    story.summary.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-dark text-primary font-sans p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-12 pb-6 border-b border-primary/10 gap-4">
          <button 
            onClick={() => setView('library')}
            className="flex items-center text-primary/60 hover:text-magic transition-colors self-start"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar
          </button>
          <h1 className="text-3xl font-serif font-bold text-center order-first md:order-none">Todas as Histórias</h1>
          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder="Buscar histórias..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface border border-primary/10 rounded-full py-2 pl-10 pr-4 text-primary placeholder-primary/40 focus:outline-none focus:ring-1 focus:ring-magic"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/40" />
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {filteredStories.map(story => (
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

        {filteredStories.length === 0 && (
            <div className="text-center py-20 text-primary/40">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-50"/>
                <p>Nenhuma história encontrada no arquivo.</p>
            </div>
        )}
      </div>
    </div>
  );
};
