import React, { useState, useRef } from 'react';
import { NewsPost } from '../types';
import { Button } from '../components/Button';
import { ArrowLeft, Plus, X, Upload, Save, Trash2, Calendar, User as UserIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { DEFAULT_COVER } from '../constants';

// Import stores
import { useContentStore } from '../stores/contentStore';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';

export const NewsView: React.FC = () => {
  // Get state and actions from stores
  const { news, saveNews, deleteNews } = useContentStore();
  const currentUser = useAuthStore(state => state.currentUser);
  const setView = useUIStore(state => state.setView);

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [expandedNewsId, setExpandedNewsId] = useState<string | null>(null);
  
  // Editor State
  const [editTitle, setEditTitle] = useState('');
  const [editBanner, setEditBanner] = useState(DEFAULT_COVER);
  const [editContent, setEditContent] = useState('<p>Escreva os detalhes do evento aqui...</p>');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreateNew = () => {
    setEditTitle('');
    setEditBanner(DEFAULT_COVER);
    setEditContent('<p>Escreva os detalhes do evento aqui...</p>');
    setIsEditorOpen(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditBanner(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!editTitle.trim()) return alert("O título é obrigatório.");
    
    const newPost: NewsPost = {
      id: Date.now().toString(),
      title: editTitle,
      bannerImage: editBanner,
      content: editContent,
      date: Date.now(),
      author: currentUser?.email || 'Admin'
    };
    
    await saveNews(newPost);
    setIsEditorOpen(false);
  };

  const toggleExpand = (id: string) => {
    setExpandedNewsId(prev => prev === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-dark text-primary font-sans p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-primary/10">
          <button 
            onClick={() => setView('library')}
            className="flex items-center text-primary/60 hover:text-magic transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar
          </button>
          <h1 className="text-3xl font-serif font-bold text-center">Notícias & Eventos</h1>
          <div className="w-20 flex justify-end">
            {currentUser && (
              <Button onClick={handleCreateNew} size="sm" icon={<Plus className="w-4 h-4"/>}>
                Novo
              </Button>
            )}
          </div>
        </div>

        {/* News Feed */}
        <div className="space-y-6">
          {news.length === 0 && (
             <div className="text-center py-20 text-primary/40 italic">
               Nenhum evento registrado no momento.
             </div>
          )}

          {news.map(item => (
            <div 
              key={item.id} 
              className="bg-surface border border-primary/20 rounded-lg overflow-hidden group hover:border-magic transition-all duration-300 shadow-lg"
            >
              {/* Horizontal Banner Card */}
              <div 
                className="relative w-full h-32 md:h-40 cursor-pointer overflow-hidden"
                onClick={() => toggleExpand(item.id)}
              >
                <img 
                  src={item.bannerImage} 
                  alt={item.title} 
                  className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-500 transform group-hover:scale-105"
                  onError={(e) => e.currentTarget.src = DEFAULT_COVER}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent flex flex-col justify-center px-6 md:px-10">
                   <div className="flex items-center gap-2 text-xs text-magic mb-1 uppercase tracking-widest font-bold">
                      <Calendar className="w-3 h-3" />
                      {new Date(item.date).toLocaleDateString()}
                   </div>
                   <h2 className="text-xl md:text-3xl font-serif font-bold text-primary text-shadow-lg drop-shadow-md">
                      {item.title}
                   </h2>
                   <div className="absolute right-6 top-1/2 -translate-y-1/2 text-primary/40 group-hover:text-magic transition-colors">
                      {expandedNewsId === item.id ? <ChevronUp className="w-6 h-6"/> : <ChevronDown className="w-6 h-6"/>}
                   </div>
                </div>
              </div>

              {/* Expanded Content */}
              <div className={`transition-all duration-500 ease-in-out overflow-hidden ${expandedNewsId === item.id ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                 <div className="p-6 md:p-8 bg-dark/50 border-t border-primary/10">
                    <div 
                       className="prose prose-invert prose-lg max-w-none text-primary/80 font-serif leading-relaxed"
                       dangerouslySetInnerHTML={{ __html: item.content }}
                    />
                    
                    <div className="mt-6 pt-4 border-t border-primary/10 flex justify-between items-center text-sm text-primary/40">
                       <span className="flex items-center gap-2"><UserIcon className="w-4 h-4"/> Publicado por {item.author}</span>
                       
                       {currentUser && (
                         <button 
                            onClick={() => deleteNews(item.id)}
                            className="text-red-400 hover:text-red-300 flex items-center gap-1 px-3 py-1 hover:bg-red-900/20 rounded"
                         >
                            <Trash2 className="w-4 h-4" /> Remover
                         </button>
                       )}
                    </div>
                 </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Editor Modal */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in">
           <div className="bg-surface border border-primary/20 w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="px-6 py-4 border-b border-primary/10 flex justify-between items-center bg-black/20">
                 <h3 className="text-lg font-serif font-bold text-primary">Novo Evento</h3>
                 <button onClick={() => setIsEditorOpen(false)} className="text-primary/40 hover:text-red-400">
                    <X className="w-5 h-5" />
                 </button>
              </div>
              
              <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
                 {/* Title */}
                 <div>
                    <label className="block text-xs font-bold text-primary/50 uppercase mb-2">Título do Evento</label>
                    <input 
                       type="text" 
                       value={editTitle}
                       onChange={(e) => setEditTitle(e.target.value)}
                       className="w-full bg-dark border border-primary/20 rounded-lg px-4 py-3 text-lg font-bold text-primary focus:ring-magic focus:border-magic outline-none"
                       placeholder="Ex: O Grande Torneio"
                    />
                 </div>

                 {/* Banner */}
                 <div>
                    <label className="block text-xs font-bold text-primary/50 uppercase mb-2">Banner Horizontal</label>
                    <div 
                       className="relative w-full h-32 rounded-lg border border-dashed border-primary/20 overflow-hidden group cursor-pointer"
                       onClick={() => fileInputRef.current?.click()}
                    >
                       <img src={editBanner} className="w-full h-full object-cover opacity-50" />
                       <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition-colors">
                          <span className="flex items-center gap-2 text-sm text-primary/80 font-medium">
                             <Upload className="w-4 h-4" /> Alterar Banner
                          </span>
                       </div>
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                 </div>

                 {/* Text Content (Simplified Rich Editor) */}
                 <div>
                    <label className="block text-xs font-bold text-primary/50 uppercase mb-2">Descrição Detalhada (HTML/Texto)</label>
                    <div className="bg-dark border border-primary/20 rounded-lg p-2">
                       {/* Basic Toolbar Mockup */}
                       <div className="flex gap-2 mb-2 border-b border-primary/10 pb-2 px-1">
                          <span className="text-xs text-primary/30">Ferramenta de texto</span>
                       </div>
                       <textarea 
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full bg-transparent border-none text-primary/80 font-serif min-h-[200px] outline-none p-2 resize-y"
                          placeholder="<p>Escreva aqui...</p>"
                       />
                       <p className="text-[10px] text-primary/30 mt-1 px-2">* Suporta tags HTML básicas para formatação</p>
                    </div>
                 </div>
              </div>

              <div className="p-4 border-t border-primary/10 flex justify-end gap-3 bg-black/20">
                 <Button variant="ghost" onClick={() => setIsEditorOpen(false)}>Cancelar</Button>
                 <Button onClick={handleSave} icon={<Save className="w-4 h-4"/>}>Publicar Evento</Button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};
