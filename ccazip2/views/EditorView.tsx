import React, { useState, useRef, useEffect } from 'react';
import { Story, StoryBlock } from '../types';
import { Button } from '../components/Button';
import { generateStoryIdeas, enhanceText } from '../services/geminiService';
import { 
  Save, ArrowLeft, Image as ImageIcon, Type, 
  Settings, Sparkles, AlignLeft, AlignCenter, 
  AlignRight, AlignJustify, Trash2, Upload, X, Loader2
} from 'lucide-react';
import { DEFAULT_COVER } from '../constants';
import { db, storage } from '../firebase-config';
import { doc, collection } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Import stores
import { useStoryStore } from '../stores/storyStore';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';

const DEFAULT_STORY_TEMPLATE: Omit<Story, 'id' | 'author' | 'createdAt'> = {
  title: '',
  summary: '',
  coverImage: DEFAULT_COVER,
  blocks: [],
  isPublished: false,
  settings: {
    parallaxHeader: true,
    fadeImagesOnScroll: true,
    theme: 'dark'
  }
};

export const EditorView: React.FC = () => {
  // Store state and actions
  const { 
    activeStoryId, 
    activeStory: storeActiveStory, 
    loadingStory, 
    error: storeError,
    saveStory
  } = useStoryStore();
  const currentUser = useAuthStore(state => state.currentUser);
  const { showToast, setView } = useUIStore();
  
  // Local component state for the form
  const [story, setStory] = useState<Story | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);

  const coverInputRef = useRef<HTMLInputElement>(null);
  const blockImageInputRef = useRef<HTMLInputElement>(null);

  // Effect to load story into local state from the store or create a new one
  useEffect(() => {
    if (activeStoryId) {
      // Editing mode: wait for the store to load the story
      if (storeActiveStory) {
        setStory(storeActiveStory);
      }
    } else {
      // Creating mode: initialize a new story locally
      setStory({
        ...DEFAULT_STORY_TEMPLATE,
        id: Date.now().toString(), // Temporary ID
        author: currentUser?.email || 'Autor Desconhecido',
        createdAt: Date.now(),
      });
    }
  }, [activeStoryId, storeActiveStory, currentUser]);


  const handleSaveStory = async () => {
    if (!story) return;

    setIsSaving(true);
    let storyToSave = { ...story };

    // If it's a new story, ensure it has a proper Firestore ID before saving
    if (!activeStoryId) {
      const newDocRef = doc(collection(db, "Leitura"));
      storyToSave = { ...storyToSave, id: newDocRef.id };
      // Update local state immediately with the new ID for consistency
      setStory(storyToSave);
    }
    
    try {
      await saveStory(storyToSave);
      setView('dashboard'); // Navigate back after successful save
    } catch (err) {
      // Error is already handled and toasted by the store
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setView('dashboard');
  };

  if (loadingStory && activeStoryId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark text-primary">
        <p className="text-xl font-serif">Carregando editor...</p>
      </div>
    );
  }

  if (storeError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark text-red-400">
        <p className="text-xl font-serif">{storeError}</p>
        <Button onClick={handleCancel} className="ml-4">Voltar</Button>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark text-primary">
        <p className="text-xl font-serif">Inicializando...</p>
      </div>
    );
  }

  // --- Block Management ---
  const addTextBlock = () => {
    const newBlock: StoryBlock = {
      id: Date.now().toString(),
      type: 'text',
      content: '<p>Comece a escrever aqui...</p>',
      styles: { textAlign: 'left', fontSize: '1.125rem' }
    };
    setStory(prev => prev ? ({ ...prev, blocks: [...prev.blocks, newBlock] }) : null);
    setActiveBlockId(newBlock.id);
  };

  const addImageBlock = (url: string) => {
    const newBlock: StoryBlock = {
      id: Date.now().toString(),
      type: 'image',
      content: url
    };
    setStory(prev => prev ? ({ ...prev, blocks: [...prev.blocks, newBlock] }) : null);
  };

  const updateBlock = (id: string, updates: Partial<StoryBlock>) => {
    setStory(prev => prev ? ({
      ...prev,
      blocks: prev.blocks.map(b => b.id === id ? { ...b, ...updates } : b)
    }) : null);
  };

  const deleteBlock = (id: string) => {
    setStory(prev => prev ? ({
      ...prev,
      blocks: prev.blocks.filter(b => b.id !== id)
    }) : null);
  };

  const moveBlock = (index: number, direction: -1 | 1) => {
    if (!story || (index === 0 && direction === -1) || (index === story.blocks.length - 1 && direction === 1)) return;
    const newBlocks = [...story.blocks];
    const temp = newBlocks[index];
    newBlocks[index] = newBlocks[index + direction];
    newBlocks[index + direction] = temp;
    setStory(prev => ({ ...prev, blocks: newBlocks }));
  };

  // --- Image Handling ---
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'cover' | 'block') => {
    const file = e.target.files?.[0];
    if (!file || !story) return;

    // Use a consistent ID for uploads, generate one for new stories on the fly if needed
    const storyIdForUpload = activeStoryId || story.id;

    setIsUploading(true);
    showToast("Enviando imagem...");

    const storageRef = ref(storage, `stories/${storyIdForUpload}/${Date.now()}-${file.name}`);

    try {
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      if (target === 'cover') {
        setStory(prev => prev ? ({ ...prev, coverImage: downloadURL }) : null);
      } else {
        addImageBlock(downloadURL);
      }
      showToast("Imagem enviada com sucesso!");
    } catch (error) {
      console.error("Image upload failed:", error);
      showToast("Falha no upload da imagem.");
    } finally {
      setIsUploading(false);
    }
  };

  const triggerCoverUpload = () => coverInputRef.current?.click();
  const triggerBlockImageUpload = () => blockImageInputRef.current?.click();

  const removeCover = () => {
    setStory(prev => prev ? ({ ...prev, coverImage: DEFAULT_COVER }) : null);
  };

  // --- AI Features ---
  const handleAiIdeas = async () => {
    if (!story.title && !story.summary) {
      alert("Por favor, preencha pelo menos um título provisório ou resumo para a IA ter contexto.");
      return;
    }
    setLoadingAI(true);
    const result = await generateStoryIdeas(story.title || story.summary);
    alert(`Ideias da IA:\n\n${result}`);
    setLoadingAI(false);
  };

  const handleAiEnhanceBlock = async (block: StoryBlock) => {
    if (block.type !== 'text') return;
    setLoadingAI(true);
    const cleanText = block.content.replace(/<[^>]*>/g, ''); 
    const improved = await enhanceText(cleanText);
    updateBlock(block.id, { content: `<p>${improved}</p>` });
    setLoadingAI(false);
  };

  const hasCustomCover = story.coverImage && story.coverImage !== DEFAULT_COVER;

  return (
    <div className="min-h-screen flex flex-col bg-dark text-primary">
      
      {/* Top Bar */}
      <div className="bg-surface border-b border-primary/10 px-6 py-4 flex items-center justify-between sticky top-0 lg:top-16 z-40 shadow-md">
        <div className="flex items-center gap-4">
          <button onClick={handleCancel} className="text-primary/60 hover:text-magic transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <input 
            type="text" 
            value={story.title}
            onChange={e => setStory({ ...story, title: e.target.value })}
            placeholder="Título da História"
            className="text-xl font-bold font-serif bg-transparent border-none focus:ring-0 placeholder-primary/30 text-primary w-48 md:w-96 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 mr-4 border-r border-primary/10 pr-4">
            <span className="text-xs text-primary/50 font-medium uppercase">Status:</span>
            <select 
              value={story.isPublished ? 'pub' : 'draft'} 
              onChange={(e) => setStory({ ...story, isPublished: e.target.value === 'pub' })}
              className="text-sm bg-surface border border-primary/20 text-primary rounded-md focus:ring-magic focus:border-magic outline-none px-2 py-1"
            >
              <option value="draft" className="bg-surface text-primary">Rascunho</option>
              <option value="pub" className="bg-surface text-primary">Publicado</option>
            </select>
          </div>
          <Button variant="secondary" onClick={handleAiIdeas} disabled={loadingAI} icon={<Sparkles className="w-4 h-4 text-purple-400"/>}>
            {loadingAI ? '...' : 'IA'}
          </Button>
          <Button onClick={handleSaveStory} icon={<Save className="w-4 h-4"/>} disabled={isSaving || isUploading}>
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        
        {/* Sidebar */}
        <div className="w-80 bg-surface border-r border-primary/10 overflow-y-auto p-6 hidden lg:block scrollbar-thin scrollbar-thumb-primary/20">
          <h3 className="font-bold text-primary mb-4 flex items-center">
            <Settings className="w-4 h-4 mr-2 text-magic" /> Configurações
          </h3>
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-primary/50 uppercase mb-2">Resumo</label>
              <textarea 
                className="w-full rounded-md bg-dark border border-primary/20 text-primary text-sm focus:ring-magic focus:border-magic placeholder-primary/20 p-3 outline-none"
                rows={3}
                value={story.summary}
                onChange={e => setStory({ ...story, summary: e.target.value })}
                placeholder="Uma breve descrição..."
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-primary/50 uppercase mb-2">URL da Capa (Opcional)</label>
              <input 
                type="text"
                placeholder="Cole a URL ou faça upload"
                value={hasCustomCover ? story.coverImage : ''}
                onChange={(e) => setStory({ ...story, coverImage: e.target.value })}
                className="w-full rounded-md bg-dark border border-primary/20 text-primary text-xs p-2 focus:ring-magic focus:border-magic placeholder-primary/20 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-primary/50 uppercase mb-2">Efeitos Visuais</label>
              <div className="space-y-3">
                <label className="flex items-center cursor-pointer select-none">
                  <input type="checkbox" checked={story.settings.parallaxHeader} onChange={e => setStory({ ...story, settings: { ...story.settings, parallaxHeader: e.target.checked } })} className="appearance-none w-4 h-4 rounded bg-dark border border-primary/20 checked:bg-magic checked:border-magic focus:ring-magic relative cursor-pointer" />
                  <span className="ml-2 text-sm text-primary/80">Parallax no Cabeçalho</span>
                </label>
                <label className="flex items-center cursor-pointer select-none">
                  <input type="checkbox" checked={story.settings.fadeImagesOnScroll} onChange={e => setStory({ ...story, settings: { ...story.settings, fadeImagesOnScroll: e.target.checked } })} className="appearance-none w-4 h-4 rounded bg-dark border border-primary/20 checked:bg-magic checked:border-magic focus:ring-magic relative cursor-pointer" />
                  <span className="ml-2 text-sm text-primary/80">Imagens "Fade-in"</span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-primary/50 uppercase mb-2">Tema de Leitura</label>
              <div className="flex gap-2">
                {['light', 'dark', 'sepia'].map((t) => (
                  <button key={t} onClick={() => setStory({ ...story, settings: { ...story.settings, theme: t as any } })} className={`w-8 h-8 rounded-full border-2 transition-all ${story.settings.theme === t ? 'border-magic scale-110' : 'border-transparent'} ${t === 'light' ? 'bg-white' : t === 'dark' ? 'bg-stone-900' : 'bg-[#f4ecd8]'}`} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Editor Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-10 bg-dark">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="mb-8">
              <label className="block text-xs font-bold text-primary/40 uppercase mb-3 tracking-widest">Capa de Exibição (Banner)</label>
              {isUploading && hasCustomCover ? (
                <div className="w-full h-64 md:h-80 rounded-xl bg-surface flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-magic animate-spin"/>
                  <span className="ml-4 text-primary/60">Enviando imagem...</span>
                </div>
              ) : hasCustomCover ? (
                <div className="relative group w-full h-64 md:h-80 rounded-xl overflow-hidden shadow-lg border border-primary/20">
                  <img src={story.coverImage} alt="Capa" className="w-full h-full object-cover" onError={(e) => e.currentTarget.src = DEFAULT_COVER} />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                    <Button onClick={triggerCoverUpload} variant="secondary" icon={<Upload className="w-4 h-4"/>} disabled={isUploading}>Trocar Imagem</Button>
                    <button onClick={removeCover} className="text-red-400 hover:text-red-300 text-sm flex items-center hover:underline"><Trash2 className="w-4 h-4 mr-1" /> Remover</button>
                  </div>
                </div>
              ) : (
                <div onClick={triggerCoverUpload} className="w-full h-48 border-2 border-dashed border-primary/20 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-magic hover:bg-surface transition-all group">
                  {isUploading ? (
                    <>
                      <Loader2 className="w-8 h-8 text-magic animate-spin"/>
                      <span className="mt-4 text-primary/60">Enviando...</span>
                    </>
                  ) : (
                    <>
                      <div className="bg-primary/5 p-4 rounded-full group-hover:bg-magic/20 transition-colors mb-3">
                        <ImageIcon className="w-8 h-8 text-primary/40 group-hover:text-magic" />
                      </div>
                      <span className="text-primary/60 font-medium group-hover:text-primary">Adicionar Capa de Exibição</span>
                      <span className="text-xs text-primary/40 mt-1">Esta imagem aparecerá nos banners e no topo da leitura.</span>
                    </>
                  )}
                </div>
              )}
              <input type="file" ref={coverInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'cover')} disabled={isUploading} />
            </div>

            <input type="text" value={story.title} onChange={e => setStory({ ...story, title: e.target.value })} placeholder="Título da História" className="w-full bg-transparent text-4xl md:text-5xl font-serif font-bold text-primary placeholder-primary/20 outline-none border-none p-0 focus:ring-0" />
            <textarea className="w-full bg-transparent text-lg text-primary/60 italic placeholder-primary/20 outline-none border-none p-0 resize-none focus:ring-0" rows={2} value={story.summary} onChange={e => setStory({ ...story, summary: e.target.value })} placeholder="Escreva um breve resumo ou subtítulo aqui..." />
            <div className="h-px w-full bg-primary/10 my-6"></div>

            {story.blocks.map((block, index) => (
              <div key={block.id} className={`group relative border rounded-lg p-4 transition-all duration-200 ${activeBlockId === block.id ? 'border-magic bg-surface shadow-[0_0_10px_rgba(63,222,224,0.1)]' : 'border-transparent hover:border-primary/10 hover:bg-surface/50'}`} onClick={() => setActiveBlockId(block.id)}>
                <div className={`absolute -right-12 top-0 flex flex-col gap-1 opacity-0 ${activeBlockId === block.id ? 'opacity-100' : 'group-hover:opacity-50'} transition-opacity`}>
                  <button onClick={() => moveBlock(index, -1)} className="p-1.5 bg-surface border border-primary/10 rounded shadow hover:border-magic text-primary hover:text-magic"><ArrowLeft className="w-3 h-3 rotate-90" /></button>
                  <button onClick={() => moveBlock(index, 1)} className="p-1.5 bg-surface border border-primary/10 rounded shadow hover:border-magic text-primary hover:text-magic"><ArrowLeft className="w-3 h-3 -rotate-90" /></button>
                  <button onClick={() => deleteBlock(block.id)} className="p-1.5 bg-surface border border-primary/10 rounded shadow hover:border-red-500 text-red-400"><Trash2 className="w-3 h-3" /></button>
                </div>
                {block.type === 'text' ? (
                  <div>
                    {activeBlockId === block.id && (
                      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-primary/10">
                        <div className="flex border border-primary/10 rounded bg-dark p-1">
                          <button onClick={() => updateBlock(block.id, { styles: {...block.styles, textAlign: 'left'}})} className="p-1 hover:bg-white/10 rounded text-primary"><AlignLeft className="w-3 h-3" /></button>
                          <button onClick={() => updateBlock(block.id, { styles: {...block.styles, textAlign: 'center'}})} className="p-1 hover:bg-white/10 rounded text-primary"><AlignCenter className="w-3 h-3" /></button>
                          <button onClick={() => updateBlock(block.id, { styles: {...block.styles, textAlign: 'right'}})} className="p-1 hover:bg-white/10 rounded text-primary"><AlignRight className="w-3 h-3" /></button>
                          <button onClick={() => updateBlock(block.id, { styles: {...block.styles, textAlign: 'justify'}})} className="p-1 hover:bg-white/10 rounded text-primary"><AlignJustify className="w-3 h-3" /></button>
                        </div>
                        <div className="h-4 w-px bg-primary/10 mx-1"></div>
                        <select className="text-xs bg-dark border-primary/20 text-primary rounded py-1 outline-none" value={block.styles?.fontWeight || 'normal'} onChange={(e) => updateBlock(block.id, { styles: {...block.styles, fontWeight: e.target.value}})}>
                          <option value="normal" className="bg-dark">Normal</option>
                          <option value="bold" className="bg-dark">Negrito</option>
                          <option value="300" className="bg-dark">Leve</option>
                        </select>
                        <div className="flex-1"></div>
                        <button onClick={(e) => { e.stopPropagation(); handleAiEnhanceBlock(block); }} className="text-xs text-purple-400 flex items-center hover:bg-purple-900/20 px-2 py-1 rounded border border-transparent hover:border-purple-500/50"><Sparkles className="w-3 h-3 mr-1" /> Melhorar IA</button>
                      </div>
                    )}
                    <textarea className="w-full resize-y bg-transparent border-none focus:ring-0 p-0 font-serif text-lg leading-relaxed text-primary/90 placeholder-primary/20 outline-none" rows={Math.max(2, block.content.replace(/<[^>]*>/g, '').length / 60)} value={block.content.replace(/<[^>]*>/g, '')} onChange={(e) => updateBlock(block.id, { content: `<p>${e.target.value}</p>` })} style={{ textAlign: block.styles?.textAlign, fontWeight: block.styles?.fontWeight, fontSize: block.styles?.fontSize }} placeholder="Escreva seu parágrafo..." />
                  </div>
                ) : (
                  <div className="text-center">
                    <img src={block.content} alt="Block" className="max-h-96 mx-auto rounded shadow-sm" onError={(e) => e.currentTarget.src = DEFAULT_COVER}/>
                    <p className="text-xs text-primary/40 mt-2 italic">Esta imagem terá efeito fade-in se ativado.</p>
                  </div>
                )}
              </div>
            ))}
            <div className="flex justify-center gap-4 py-8 border-t border-primary/10 border-dashed mt-8">
              <button onClick={addTextBlock} className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface border border-primary/20 shadow-sm hover:border-magic hover:text-magic text-primary/80 transition-all"><Type className="w-4 h-4" /> Adicionar Texto</button>
              <button onClick={triggerBlockImageUpload} disabled={isUploading} className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface border border-primary/20 shadow-sm hover:border-magic hover:text-magic text-primary/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin"/> : <ImageIcon className="w-4 h-4" />}
                {isUploading ? 'Enviando...' : 'Adicionar Imagem'}
              </button>
              <input type="file" ref={blockImageInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'block')} disabled={isUploading} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
