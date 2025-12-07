
import React, { useEffect, useState, useRef } from 'react';
import { Story, ViewMode } from '../types';
import { Button } from '../components/Button';
import { BookOpen, Newspaper, Globe, Users, MessageCircle, PenTool, LogIn, User, Camera, Edit3, ArrowRight, X, Save, Upload, Image as ImageIcon, MapPin } from 'lucide-react';
import { DEFAULT_COVER } from '../constants';
import { db } from '../firebase-config';
import { collection, doc, onSnapshot, setDoc, query, where } from 'firebase/firestore';

interface LibraryViewProps {
  // stories prop is no longer needed as we'll fetch from Firebase
  onRead: (id: string) => void;
  currentUser: string | null;
  onLogin: () => void;
  onEnterDashboard: () => void;
  onViewAll: () => void;
  onChangeView: (view: ViewMode) => void;
}

// Updated Hero Background to match "Fogo & Fortuna" - Fantasy Adventurers Group
const DEFAULT_HERO_BG = "https://media.discordapp.net/attachments/1439393344395415655/1447104539634434108/2151470656.jpg?ex=693668a0&is=69351720&hm=ef4e4eace001bcf0861145c097c37f50a2ab70a0ea384fe0068698c13b8229fb&=&format=webp&width=829&height=552";
const DEFAULT_UNION_SYMBOL = "https://images.unsplash.com/photo-1625586803209-90cb2e933854?q=80&w=200&auto=format&fit=crop";
const DEFAULT_UNION_DESC = "Sob o juramento de tinta e sangue, as cinco grandes ordens se unem nas sombras, preservando os arquivos proibidos e a verdadeira história do mundo.";

// Mock guild data
const DEFAULT_GUILDS = [
  { id: 1, name: 'Guilda dos Magos', image: 'https://images.unsplash.com/photo-1519074069444-1ba4fff66d16?q=80&w=300&auto=format&fit=crop' },
  { id: 2, name: 'Caçadores de Relíquias', image: 'https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?q=80&w=300&auto=format&fit=crop' },
  { id: 3, name: 'Guardiões do Tomo', image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=300&auto=format&fit=crop' },
  { id: 4, name: 'Alquimistas Lunares', image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=300&auto=format&fit=crop' },
  { id: 5, name: 'Bardos Errantes', image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=300&auto=format&fit=crop' },
];

const DEFAULT_GUILD_DESCS: Record<number, string> = {
  1: "Mestres das artes arcanas, manipulando a trama da realidade para proteger os reinos dos perigos extraplanares e estudar os mistérios do éter.",
  2: "Aventureiros destemidos que mergulham nas ruínas do Velho Mundo em busca de artefatos de poder e tecnologias esquecidas.",
  3: "Jurados a proteger a Grande Biblioteca, estes monges guerreiros garantem que o conhecimento proibido jamais caia em mãos erradas.",
  4: "Mestres da transmutação e das poções, buscando a cura para a Praga de Cristal e a fórmula da vida eterna.",
  5: "Espiões, diplomatas e artistas. Eles ouvem tudo, veem tudo e registram a verdadeira história nas entrelinhas de suas canções."
};

export const LibraryView: React.FC<Omit<LibraryViewProps, 'stories'>> = ({ onRead, currentUser, onLogin, onEnterDashboard, onViewAll, onChangeView }) => {
  const [scrollY, setScrollY] = useState(0);
  const [stories, setStories] = useState<Story[]>([]);
  
  // Customizable Images State
  const [heroBg, setHeroBg] = useState(DEFAULT_HERO_BG);
  const [unionSymbol, setUnionSymbol] = useState(DEFAULT_UNION_SYMBOL);
  const [unionDescription, setUnionDescription] = useState(DEFAULT_UNION_DESC);
  const [guildImages, setGuildImages] = useState<Record<number, string>>({});
  const [guildNames, setGuildNames] = useState<Record<number, string>>({});
  const [guildDescriptions, setGuildDescriptions] = useState<Record<number, string>>({});
  
  // --- MODAL STATES ---
  // Guild Detail Modal (Display)
  const [selectedGuildId, setSelectedGuildId] = useState<number | null>(null);

  // Guild Edit Modal State
  const [isGuildModalOpen, setIsGuildModalOpen] = useState(false);
  const [editingGuildId, setEditingGuildId] = useState<number | null>(null);
  const [tempGuildName, setTempGuildName] = useState("");
  const [tempGuildDesc, setTempGuildDesc] = useState("");
  const [tempGuildImage, setTempGuildImage] = useState<string | null>(null);

  // Union Text Edit Modal State
  const [isUnionTextModalOpen, setIsUnionTextModalOpen] = useState(false);
  const [tempUnionDesc, setTempUnionDesc] = useState("");
  
  // Refs for file inputs
  const heroInputRef = useRef<HTMLInputElement>(null);
  const unionInputRef = useRef<HTMLInputElement>(null);
  const guildModalFileInputRef = useRef<HTMLInputElement>(null);
  
  // Sort stories by createdAt ascending
  const sortedStories = [...stories].sort((a, b) => a.createdAt - b.createdAt);
  const latestStory = sortedStories.length > 0 ? sortedStories[sortedStories.length - 1] : null;
  
  // For "Acontecimentos", take everything except the latest, then reverse to show newest first, limit to 4
  const otherStories = sortedStories.length > 1 ? sortedStories.slice(0, sortedStories.length - 1).reverse() : [];
  const previewStories = otherStories.slice(0, 4);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // --- FIREBASE LISTENERS ---

    // 1. Listen for stories from "Leitura" collection
    const storiesUnsubscribe = onSnapshot(
      query(collection(db, "Leitura"), where("isPublished", "==", true)),
      (querySnapshot) => {
        const storiesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Story));
        setStories(storiesData);
      }
    );

    // 2. Listen for page configuration from "pages/library_view_config"
    const configUnsubscribe = onSnapshot(doc(db, "pages", "library_view_config"), (docSnapshot) => {
      if (docSnapshot.exists()) {
        const config = docSnapshot.data();
        if (config.heroBg) setHeroBg(config.heroBg);
        if (config.unionSymbol) setUnionSymbol(config.unionSymbol);
        if (config.unionDescription) setUnionDescription(config.unionDescription);
        if (config.guildImages) setGuildImages(config.guildImages);
        if (config.guildNames) setGuildNames(config.guildNames);
        if (config.guildDescriptions) setGuildDescriptions(config.guildDescriptions);
      } else {
        console.log("No config document found. Using defaults.");
      }
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      storiesUnsubscribe();
      configUnsubscribe();
    };
  }, []);

  const configDocRef = doc(db, "pages", "library_view_config");

  // --- HERO & UNION SYMBOL HANDLERS ---
  const handleHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        setHeroBg(base64); // Optimistic update
        try {
          await setDoc(configDocRef, { heroBg: base64 }, { merge: true });
        } catch (err) {
          console.error("Error saving hero image to Firebase:", err);
          alert("Erro ao salvar a imagem. Tente novamente.");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUnionUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        setUnionSymbol(base64); // Optimistic update
        try {
          await setDoc(configDocRef, { unionSymbol: base64 }, { merge: true });
        } catch (err) {
          console.error("Error saving union symbol to Firebase:", err);
          alert("Erro ao salvar o símbolo. Tente novamente.");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // --- UNION TEXT EDIT HANDLERS ---
  const openUnionTextModal = () => {
    setTempUnionDesc(unionDescription);
    setIsUnionTextModalOpen(true);
  };

  const saveUnionText = async () => {
    setUnionDescription(tempUnionDesc); // Optimistic update
    setIsUnionTextModalOpen(false);
    try {
      await setDoc(configDocRef, { unionDescription: tempUnionDesc }, { merge: true });
    } catch (err) {
      console.error("Error saving union description:", err);
      alert("Erro ao salvar a descrição. Tente novamente.");
    }
  };

  // --- GUILD MODAL HANDLERS ---
  const openEditGuildModal = () => {
    if (selectedGuildId === null) return;
    
    // Close detail modal, open edit modal
    const id = selectedGuildId;
    const name = guildNames[id] || DEFAULT_GUILDS.find(g => g.id === id)?.name || "";
    const image = guildImages[id] || DEFAULT_GUILDS.find(g => g.id === id)?.image || "";
    const desc = guildDescriptions[id] || DEFAULT_GUILD_DESCS[id] || "";

    setEditingGuildId(id);
    setTempGuildName(name);
    setTempGuildImage(image);
    setTempGuildDesc(desc);
    
    setSelectedGuildId(null); 
    setIsGuildModalOpen(true);
  };

  const handleGuildModalFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempGuildImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveGuildChanges = async () => {
    if (editingGuildId !== null) {
      const id = editingGuildId;
      const updatedData: Record<string, any> = {};

      const newNames = { ...guildNames, [id]: tempGuildName };
      if (tempGuildName.trim() !== "") {
        setGuildNames(newNames);
        updatedData.guildNames = newNames;
      }

      const newDescs = { ...guildDescriptions, [id]: tempGuildDesc };
      if (tempGuildDesc.trim() !== "") {
        setGuildDescriptions(newDescs);
        updatedData.guildDescriptions = newDescs;
      }
      
      if (tempGuildImage) {
        const newImages = { ...guildImages, [id]: tempGuildImage };
        setGuildImages(newImages);
        updatedData.guildImages = newImages;
      }

      setIsGuildModalOpen(false);
      setEditingGuildId(null);
      setTempGuildImage(null);

      try {
        if (Object.keys(updatedData).length > 0) {
          await setDoc(configDocRef, updatedData, { merge: true });
        }
        // Re-open detail modal with new data after saving
        setSelectedGuildId(id);
      } catch (error) {
        console.error("Error saving guild changes to Firebase:", error);
        alert("Erro ao salvar as alterações da organização.");
      }
    }
  };

  // Helper to get current guild data
  const getGuildData = (id: number) => {
    const base = DEFAULT_GUILDS.find(g => g.id === id);
    return {
      id,
      name: guildNames[id] || base?.name || "Organização",
      image: guildImages[id] || base?.image || DEFAULT_COVER,
      description: guildDescriptions[id] || DEFAULT_GUILD_DESCS[id] || "Sem descrição disponível."
    };
  };

  const selectedGuildData = selectedGuildId ? getGuildData(selectedGuildId) : null;

  return (
    <div className="min-h-screen bg-dark text-primary font-sans">
      
      {/* HERO SECTION */}
      <div className="relative h-[60vh] md:h-[80vh] overflow-hidden flex items-center justify-center shadow-2xl group/hero">
        <div 
          className="absolute inset-0 bg-cover bg-center pointer-events-none will-change-transform"
          style={{ 
            backgroundImage: `url('${heroBg}')`,
            transform: `translateY(${scrollY * 0.5}px) scale(${1 + scrollY * 0.0005}) translateZ(0)`
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-dark/60 via-dark/20 to-dark" />
        
        {currentUser && (
          <div className="absolute bottom-4 right-4 z-30 opacity-0 group-hover/hero:opacity-100 transition-opacity duration-300">
            <button 
              type="button"
              onClick={() => heroInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-black/50 backdrop-blur-md border border-primary/20 rounded-full text-xs font-medium text-primary/70 hover:text-magic hover:border-magic transition-all shadow-lg"
            >
              <Camera className="w-4 h-4" />
              <span>Editar Capa</span>
            </button>
            <input 
              type="file" 
              ref={heroInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleHeroUpload}
            />
          </div>
        )}

        <div 
          className="relative z-10 text-center px-4 will-change-transform"
          style={{ 
            opacity: Math.max(0, 1 - scrollY / 400),
            transform: `translateY(${scrollY * 0.2}px)`
          }}
        >
          <div className="mb-6 inline-block bg-transparent backdrop-blur-sm">
            <img src="https://cdn.discordapp.com/attachments/1439393344395415655/1447085099345641482/cca-logo3.png?ex=69365685&is=69350505&hm=bd6b924f280f24b301c7af3384b6879a38deb0cb4f88ee1785f663a662ee8d01&" alt="Crônicas de Atlas Logo" className="h-48 w-48 mx-auto" />
          </div>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-black text-primary drop-shadow-2xl mb-2 tracking-tight">
            CRÔNICAS DE ATLAS
          </h1>

        </div>
      </div>



      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-4 py-12 space-y-16 relative z-20">
        
        {/* 1. FEATURED STORY BANNER */}
        <section className="animate-fade-in">
          {latestStory ? (
            <div 
              onClick={() => onRead(latestStory.id)}
              className="group relative w-full h-48 md:h-[250px] rounded-xl overflow-hidden cursor-pointer border border-primary/20 hover:border-magic shadow-xl hover:shadow-[0_0_20px_rgba(63,222,224,0.3)] transform-gpu transition-shadow duration-500"
            >
              <div className="absolute inset-0 overflow-hidden">
                 <img 
                    src={latestStory.coverImage || DEFAULT_COVER}
                    alt="Capa do último lançamento"
                    className="w-full h-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-105"
                    onError={(e) => e.currentTarget.src = DEFAULT_COVER}
                 />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/40 to-transparent" />
              
              <div className="absolute top-4 left-4 md:top-6 md:left-6 pointer-events-none">
                 <span className="bg-magic/20 text-magic border border-magic/50 text-[10px] md:text-xs font-bold px-2 py-0.5 rounded-sm shadow-[0_0_10px_rgba(63,222,224,0.3)] uppercase tracking-wider">
                   Último Lançamento
                 </span>
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 flex flex-col items-center text-center">
                <h2 className="text-2xl md:text-4xl font-serif font-bold text-primary mb-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] group-hover:text-magic transition-colors duration-300">
                  {latestStory.title}
                </h2>
                <p className="text-primary/80 text-sm md:text-base max-w-2xl mx-auto mb-3 line-clamp-1 drop-shadow-md hidden md:block">
                  {latestStory.summary}
                </p>
                <div className="w-12 h-px bg-magic/50 group-hover:w-32 group-hover:bg-magic group-hover:shadow-[0_0_8px_#3FDEE0] transition-all duration-500" />
                <Button 
                  variant="primary" 
                  size="sm"
                  className="mt-4 bg-dark/80 backdrop-blur text-primary border-primary/30 group-hover:border-magic group-hover:text-magic transform-gpu"
                  onClick={(e) => { e.stopPropagation(); onRead(latestStory.id); }}
                >
                  Ler Agora
                </Button>
              </div>
            </div>
          ) : (
            <div className="w-full h-48 md:h-[250px] rounded-xl bg-surface flex items-center justify-center border border-primary/20 border-dashed">
              <p className="text-primary/50">Nenhuma história em destaque. Aguardando dados do Firebase...</p>
            </div>
          )}
        </section>

        {/* 2. ORGANIZATIONS (GUILDS) BANNERS */}
        <section id="organizations-section">
          <div className="flex items-center justify-center mb-6">
             <div className="h-px w-12 bg-primary/20"></div>
             <h3 className="mx-4 text-2xl font-serif text-primary/80 uppercase tracking-widest">ORGANIZAÇÕES</h3>
             <div className="h-px w-12 bg-primary/20"></div>
          </div>

          {/* Union Symbol and Description */}
          <div className="flex flex-col items-center text-center mb-10 px-4 relative z-10">
             <div className="flex items-center gap-6 justify-center mb-4 relative">
               <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-surface border border-primary/20 shadow-[0_0_25px_rgba(63,222,224,0.15)] flex items-center justify-center overflow-hidden relative group/union p-0">
                  <img 
                      src={unionSymbol}
                      alt="Símbolo da União" 
                      className="w-full h-full object-cover opacity-90 group-hover/union:opacity-100 transition-opacity"
                  />
               </div>
               
               {/* Edit Button for Union Symbol */}
               {currentUser && (
                 <button
                    type="button"
                    onClick={() => unionInputRef.current?.click()}
                    className="p-3 rounded-full bg-surface/50 backdrop-blur border border-primary/20 text-primary/60 hover:text-magic hover:border-magic transition-all hover:scale-110 shadow-lg"
                    title="Alterar Símbolo"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
               )}
             </div>
             
             <input 
                type="file" 
                ref={unionInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleUnionUpload}
             />

             <div className="max-w-xl relative group/text flex flex-col items-center">
                <p className="text-sm md:text-base text-primary/60 leading-relaxed font-serif italic whitespace-pre-wrap">
                    {unionDescription}
                </p>
                
                {/* Edit Button for Union Description */}
                {currentUser && (
                  <button 
                    type="button"
                    onClick={openUnionTextModal}
                    className="mt-4 flex items-center gap-2 text-xs font-medium text-primary/50 hover:text-magic transition-colors border border-primary/10 hover:border-magic/50 rounded-full px-4 py-1.5 cursor-pointer bg-surface/50 backdrop-blur-sm hover:bg-surface"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Editar Texto</span>
                  </button>
                )}
             </div>
          </div>
          
          {/* Banners Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-4">
            {DEFAULT_GUILDS.map((guild) => (
              <div 
                key={guild.id}
                onClick={() => setSelectedGuildId(guild.id)}
                className="group relative h-40 md:h-80 rounded-lg overflow-hidden border border-primary/20 hover:border-magic transition-all duration-300 cursor-pointer hover:shadow-[0_0_15px_rgba(63,222,224,0.3)] transform-gpu"
              >
                <img 
                   src={guildImages[guild.id] || guild.image} 
                   alt={guild.name}
                   className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0"
                   onError={(e) => e.currentTarget.src = DEFAULT_COVER}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/90" />
                
                <div className="absolute bottom-0 inset-x-0 pb-4 px-2 text-center z-20">
                   <div className="flex items-center justify-center gap-2">
                     <span className="text-xs md:text-sm text-primary font-serif font-bold tracking-wide group-hover:text-magic transition-colors drop-shadow-lg block">
                        {guildNames[guild.id] || guild.name}
                     </span>
                   </div>
                   <div className="h-0.5 w-0 bg-magic mx-auto mt-2 transition-all duration-300 group-hover:w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. ACONTECIMENTOS */}
        {otherStories.length > 0 && (
          <section className="pt-12 border-t border-primary/10 relative pb-10">
             <h3 className="text-3xl font-serif font-bold text-primary text-center mb-10">Acontecimentos</h3>
            
            {/* Grid max 4 columns */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
              {previewStories.map(story => (
                <div 
                  key={story.id} 
                  onClick={() => onRead(story.id)}
                  className="group bg-surface rounded-lg overflow-hidden shadow-lg hover:shadow-[0_0_15px_rgba(63,222,224,0.15)] transition-all duration-300 border border-primary/10 hover:border-magic cursor-pointer flex flex-col"
                >
                  <div className="relative h-36 overflow-hidden">
                    <img 
                      src={story.coverImage || DEFAULT_COVER} 
                      alt={story.title} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-80 group-hover:opacity-100"
                      onError={(e) => e.currentTarget.src = DEFAULT_COVER}
                    />
                    <div className="absolute inset-0 bg-dark/20 group-hover:bg-transparent transition-colors" />
                  </div>
                  <div className="p-4 flex-grow flex flex-col">
                    <h4 className="text-sm md:text-base font-serif font-bold text-primary mb-2 group-hover:text-magic transition-colors line-clamp-2">
                      {story.title}
                    </h4>
                    <div className="mt-auto flex items-center text-[10px] md:text-xs text-primary/40">
                       <span>{new Date(story.createdAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="relative">
                <div 
                  onClick={onViewAll}
                  className="w-full h-16 flex items-center justify-center bg-gradient-to-r from-transparent via-primary/5 to-transparent hover:via-magic/10 border-y border-primary/5 hover:border-magic/20 cursor-pointer transition-all duration-500 group backdrop-blur-sm"
                >
                    <span className="text-primary/60 font-serif tracking-widest uppercase text-sm group-hover:text-magic transition-colors flex items-center gap-2">
                      Ver Todos os Registros <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                </div>
            </div>

          </section>
        )}
      </div>

      {/* FOOTER */}
      <footer className="bg-black py-12 border-t border-primary/10 mt-20">
         <div className="max-w-7xl mx-auto px-4 text-center">
            <BookOpen className="h-8 w-8 text-primary/40 mx-auto mb-4" />
            <p className="text-primary/30 text-sm">© Crônicas de Atlas 2025. Todos os direitos reservados.</p>
         </div>
      </footer>

      {/* --- MODALS --- */}

      {/* 1. Organization Detail Modal (Overlay) */}
      {selectedGuildData && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
           <div className="bg-surface border border-primary/20 w-full max-w-5xl h-[70vh] rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col md:flex-row relative">
              
              <button 
                 onClick={() => setSelectedGuildId(null)}
                 className="absolute top-4 right-4 z-50 bg-black/50 p-2 rounded-full text-white/70 hover:text-white hover:bg-red-500/50 transition-all backdrop-blur"
              >
                 <X className="w-6 h-6" />
              </button>

              {/* Left Side: Text */}
              <div className="w-full md:w-5/12 h-full flex flex-col bg-surface relative z-10 border-r border-primary/10">
                 <div className="p-8 md:p-12 overflow-y-auto custom-scrollbar flex-1">
                    <div className="mb-2 text-magic uppercase tracking-widest text-xs font-bold flex items-center gap-2">
                       <Users className="w-4 h-4" /> Organização Registrada
                    </div>
                    <h2 className="text-3xl md:text-4xl font-serif font-black text-primary mb-6 leading-tight">
                       {selectedGuildData.name}
                    </h2>
                    <div className="w-16 h-1 bg-gradient-to-r from-magic to-transparent mb-6"></div>
                    
                    <div className="prose prose-invert prose-lg text-primary/80 font-serif leading-relaxed">
                       <p>{selectedGuildData.description}</p>
                    </div>
                 </div>
                 
                 {currentUser && (
                    <div className="p-4 border-t border-primary/10 bg-black/20 flex justify-end">
                       <Button 
                          onClick={openEditGuildModal}
                          icon={<Edit3 className="w-4 h-4"/>}
                          variant="secondary"
                       >
                          Editar Conteúdo
                       </Button>
                    </div>
                 )}
              </div>

              {/* Right Side: Image */}
              <div className="w-full md:w-7/12 h-full bg-black relative">
                 <img 
                    src={selectedGuildData.image} 
                    alt={selectedGuildData.name} 
                    className="w-full h-full object-cover opacity-90"
                    onError={(e) => e.currentTarget.src = DEFAULT_COVER}
                 />
                 <div className="absolute inset-0 bg-gradient-to-r from-surface via-transparent to-transparent" />
              </div>
           </div>
        </div>
      )}

      {/* 2. Union Description Edit Modal */}
      {isUnionTextModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
           <div className="bg-surface border border-primary/20 w-full max-w-lg rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-hidden">
              <div className="px-6 py-4 border-b border-primary/10 flex justify-between items-center">
                 <h3 className="text-lg font-serif font-bold text-primary">Editar Texto da União</h3>
                 <button type="button" onClick={() => setIsUnionTextModalOpen(false)} className="text-primary/40 hover:text-red-400 transition-colors">
                    <X className="w-5 h-5" />
                 </button>
              </div>
              <div className="p-6 space-y-4">
                 <textarea 
                    value={tempUnionDesc}
                    onChange={(e) => setTempUnionDesc(e.target.value)}
                    rows={5}
                    className="w-full bg-dark border border-primary/20 rounded-lg p-4 text-primary/80 focus:ring-magic focus:border-magic outline-none resize-none font-serif"
                    placeholder="Escreva o texto da união aqui..."
                 />
                 <div className="flex justify-end gap-3 pt-2">
                    <Button variant="ghost" onClick={() => setIsUnionTextModalOpen(false)}>Cancelar</Button>
                    <Button onClick={saveUnionText} icon={<Save className="w-4 h-4"/>}>Salvar</Button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* 3. Guild Edit Modal */}
      {isGuildModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
           <div className="bg-surface border border-primary/20 w-full max-w-lg rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-hidden">
              <div className="px-6 py-4 border-b border-primary/10 flex justify-between items-center">
                 <h3 className="text-lg font-serif font-bold text-primary">Editar Organização</h3>
                 <button type="button" onClick={() => setIsGuildModalOpen(false)} className="text-primary/40 hover:text-red-400 transition-colors">
                    <X className="w-5 h-5" />
                 </button>
              </div>
              <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
                 {/* Name Input */}
                 <div>
                    <label className="block text-xs font-bold text-primary/50 uppercase mb-2">Nome da Organização</label>
                    <input 
                       type="text" 
                       value={tempGuildName}
                       onChange={(e) => setTempGuildName(e.target.value)}
                       className="w-full bg-dark border border-primary/20 rounded-lg px-4 py-2 text-primary focus:ring-magic focus:border-magic outline-none"
                    />
                 </div>

                 {/* Description Input */}
                 <div>
                    <label className="block text-xs font-bold text-primary/50 uppercase mb-2">Descrição</label>
                    <textarea 
                       value={tempGuildDesc}
                       onChange={(e) => setTempGuildDesc(e.target.value)}
                       rows={4}
                       className="w-full bg-dark border border-primary/20 rounded-lg p-3 text-primary focus:ring-magic focus:border-magic outline-none font-serif"
                    />
                 </div>

                 {/* Image Preview & Upload */}
                 <div>
                    <label className="block text-xs font-bold text-primary/50 uppercase mb-2">Banner / Imagem</label>
                    <div className="relative h-40 rounded-lg overflow-hidden border border-primary/20 mb-3 group/preview">
                       <img 
                          src={tempGuildImage || DEFAULT_COVER} 
                          alt="Preview" 
                          className="w-full h-full object-cover"
                       />
                       <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover/preview:opacity-100 transition-opacity">
                          <Button size="sm" variant="secondary" onClick={() => guildModalFileInputRef.current?.click()} icon={<ImageIcon className="w-4 h-4"/>}>
                             Trocar Imagem
                          </Button>
                       </div>
                    </div>
                    <input 
                       type="file" 
                       ref={guildModalFileInputRef} 
                       className="hidden" 
                       accept="image/*"
                       onChange={handleGuildModalFileSelect}
                    />
                 </div>

                 {/* Actions */}
                 <div className="flex justify-end gap-3 pt-2 border-t border-primary/10">
                    <Button variant="ghost" onClick={() => setIsGuildModalOpen(false)}>Cancelar</Button>
                    <Button onClick={saveGuildChanges} icon={<Save className="w-4 h-4"/>}>Salvar Alterações</Button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
