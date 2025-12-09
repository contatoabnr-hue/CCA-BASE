import React, { useState, useRef } from 'react';
import { City } from '../types';
import { Button } from '../components/Button';
import { ArrowLeft, Plus, X, MapPin, Upload, Save, Trash2, Globe, Edit3 } from 'lucide-react';
import { DEFAULT_COVER } from '../constants';

// Import stores
import { useContentStore } from '../stores/contentStore';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';

export const WorldView: React.FC = () => {
  // Get state and actions from stores
  const { cities, saveCity, deleteCity } = useContentStore();
  const currentUser = useAuthStore(state => state.currentUser);
  const setView = useUIStore(state => state.setView);
  
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingCityId, setEditingCityId] = useState<string | null>(null);
  
  // Editor State
  const [editName, setEditName] = useState('');
  const [editImage, setEditImage] = useState(DEFAULT_COVER);
  const [editDesc, setEditDesc] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreateNew = () => {
    setEditingCityId(null);
    setEditName('');
    setEditImage(DEFAULT_COVER);
    setEditDesc('Descreva a história, geografia e cultura desta cidade...');
    setIsEditorOpen(true);
  };

  const handleEdit = (city: City) => {
    setEditingCityId(city.id);
    setEditName(city.name);
    setEditImage(city.image);
    setEditDesc(city.description);
    setIsEditorOpen(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!editName.trim()) return alert("O nome da cidade é obrigatório.");
    
    const newCity: City = {
      id: editingCityId || Date.now().toString(),
      name: editName,
      image: editImage,
      description: editDesc
    };
    
    await saveCity(newCity);
    setIsEditorOpen(false);
    
    // If we were viewing the detailed modal for this city, update the selection instantly
    if (selectedCity && selectedCity.id === newCity.id) {
        setSelectedCity(newCity);
    }
  };

  const handleDelete = (id: string) => {
    deleteCity(id);
    setSelectedCity(null);
  };

  return (
    <div className="min-h-screen bg-dark text-primary font-sans p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-12 pb-6 border-b border-primary/10">
          <button 
            onClick={() => setView('library')}
            className="flex items-center text-primary/60 hover:text-magic transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar
          </button>
          <div className="text-center">
             <h1 className="text-3xl font-serif font-bold flex items-center justify-center gap-3">
               <Globe className="w-6 h-6 text-magic" /> Atlas do Mundo
             </h1>
             <p className="text-xs text-primary/40 mt-1 uppercase tracking-widest">Catálogo de Locais Conhecidos</p>
          </div>
          <div className="w-20 flex justify-end">
            {currentUser && (
              <Button onClick={handleCreateNew} size="sm" icon={<Plus className="w-4 h-4"/>}>
                Add
              </Button>
            )}
          </div>
        </div>

        {/* Cities Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
           {cities.map(city => (
              <div 
                 key={city.id}
                 onClick={() => setSelectedCity(city)}
                 className="group relative h-96 rounded-xl overflow-hidden cursor-pointer shadow-2xl border border-primary/20 hover:border-magic transition-all duration-500 hover:shadow-[0_0_25px_rgba(63,222,224,0.2)]"
              >
                 <img 
                    src={city.image} 
                    alt={city.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 group-hover:brightness-110"
                    onError={(e) => e.currentTarget.src = DEFAULT_COVER}
                 />
                 <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-90 group-hover:opacity-60 transition-opacity" />
                 
                 {/* Admin Quick Edit on Banner */}
                 {currentUser && (
                   <button 
                     onClick={(e) => { e.stopPropagation(); handleEdit(city); }}
                     className="absolute top-3 right-3 p-2 rounded-full bg-black/50 backdrop-blur border border-primary/30 text-primary/70 hover:text-magic hover:border-magic opacity-0 group-hover:opacity-100 transition-opacity z-30"
                     title="Editar Banner"
                   >
                     <Edit3 className="w-4 h-4" />
                   </button>
                 )}

                 <div className="absolute bottom-0 left-0 right-0 p-6 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                    <div className="w-8 h-1 bg-magic mb-3 w-0 group-hover:w-12 transition-all duration-500"></div>
                    <h3 className="text-2xl font-serif font-bold text-primary drop-shadow-md">{city.name}</h3>
                    <p className="text-xs text-primary/60 mt-1 uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity delay-100 flex items-center gap-1">
                       <MapPin className="w-3 h-3"/> Clique para explorar
                    </p>
                 </div>
              </div>
           ))}
        </div>

        {cities.length === 0 && (
           <div className="text-center py-20 text-primary/40 italic border border-dashed border-primary/10 rounded-xl">
              Nenhuma cidade catalogada ainda.
           </div>
        )}

      </div>

      {/* Detail Modal (The Overlay Window) */}
      {selectedCity && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
           {/* Modal Container */}
           <div className="bg-surface border border-primary/20 w-full max-w-6xl h-[80vh] rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col md:flex-row relative">
              
              <button 
                 onClick={() => setSelectedCity(null)}
                 className="absolute top-4 right-4 z-50 bg-black/50 p-2 rounded-full text-white/70 hover:text-white hover:bg-red-500/50 transition-all backdrop-blur"
              >
                 <X className="w-6 h-6" />
              </button>

              {/* Left Side: Content */}
              <div className="w-full md:w-5/12 h-full flex flex-col bg-surface relative z-10 border-r border-primary/10">
                 <div className="p-8 md:p-12 overflow-y-auto custom-scrollbar flex-1">
                    <div className="mb-2 text-magic uppercase tracking-widest text-xs font-bold flex items-center gap-2">
                       <MapPin className="w-4 h-4" /> Localização Confirmada
                    </div>
                    <h2 className="text-4xl md:text-5xl font-serif font-black text-primary mb-8 leading-tight">
                       {selectedCity.name}
                    </h2>
                    <div className="w-24 h-1 bg-gradient-to-r from-magic to-transparent mb-8"></div>
                    
                    <div className="prose prose-invert prose-lg text-primary/80 font-serif leading-relaxed whitespace-pre-wrap">
                       {selectedCity.description}
                    </div>
                 </div>
                 
                 {currentUser && (
                    <div className="p-4 border-t border-primary/10 bg-black/20 flex justify-between gap-4">
                       <div className="text-xs text-primary/30 uppercase pt-2 hidden md:block">Acesso Admin</div>
                       <div className="flex gap-2 w-full md:w-auto justify-end">
                            <button 
                                onClick={() => handleEdit(selectedCity)}
                                className="text-primary hover:text-magic text-sm flex items-center gap-2 hover:bg-white/5 px-3 py-1 rounded transition-colors border border-primary/20"
                            >
                                <Edit3 className="w-4 h-4" /> Editar
                            </button>
                            <button 
                                onClick={() => handleDelete(selectedCity.id)}
                                className="text-red-400 hover:text-red-300 text-sm flex items-center gap-2 hover:bg-red-900/10 px-3 py-1 rounded transition-colors border border-red-900/30"
                            >
                                <Trash2 className="w-4 h-4" /> Apagar
                            </button>
                       </div>
                    </div>
                 )}
              </div>

              {/* Right Side: Image */}
              <div className="w-full md:w-7/12 h-full bg-black relative group">
                 <img 
                    src={selectedCity.image} 
                    alt={selectedCity.name} 
                    className="w-full h-full object-cover opacity-90"
                    onError={(e) => e.currentTarget.src = DEFAULT_COVER}
                 />
                 <div className="absolute inset-0 bg-gradient-to-r from-surface via-transparent to-transparent" />
                 
                 {/* Optional: big edit button on the image itself */}
                 {currentUser && (
                    <button 
                         onClick={() => handleEdit(selectedCity)}
                         className="absolute bottom-4 right-4 bg-black/50 backdrop-blur text-primary px-4 py-2 rounded-full border border-primary/20 hover:border-magic hover:text-magic opacity-0 group-hover:opacity-100 transition-all"
                    >
                        Trocar Imagem
                    </button>
                 )}
              </div>
           </div>
        </div>
      )}

      {/* Editor Modal */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in">
           <div className="bg-surface border border-primary/20 w-full max-w-lg rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="px-6 py-4 border-b border-primary/10 flex justify-between items-center bg-black/20">
                 <h3 className="text-lg font-serif font-bold text-primary">{editingCityId ? 'Editar Cidade' : 'Catalogar Cidade'}</h3>
                 <button onClick={() => setIsEditorOpen(false)} className="text-primary/40 hover:text-red-400">
                    <X className="w-5 h-5" />
                 </button>
              </div>
              
              <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar">
                 <div>
                    <label className="block text-xs font-bold text-primary/50 uppercase mb-2">Nome da Cidade</label>
                    <input 
                       type="text" 
                       value={editName}
                       onChange={(e) => setEditName(e.target.value)}
                       className="w-full bg-dark border border-primary/20 rounded-lg px-4 py-2 text-primary focus:ring-magic focus:border-magic outline-none"
                    />
                 </div>

                 <div>
                    <label className="block text-xs font-bold text-primary/50 uppercase mb-2">Imagem Ilustrativa</label>
                    <div 
                       className="relative w-full h-40 rounded-lg border border-dashed border-primary/20 overflow-hidden group cursor-pointer"
                       onClick={() => fileInputRef.current?.click()}
                    >
                       <img src={editImage} className="w-full h-full object-cover opacity-50" />
                       <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition-colors">
                          <span className="flex items-center gap-2 text-sm text-primary/80 font-medium">
                             <Upload className="w-4 h-4" /> Escolher Imagem
                          </span>
                       </div>
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                 </div>

                 <div>
                    <label className="block text-xs font-bold text-primary/50 uppercase mb-2">Descrição Completa</label>
                    <textarea 
                       value={editDesc}
                       onChange={(e) => setEditDesc(e.target.value)}
                       className="w-full bg-dark border border-primary/20 rounded-lg p-3 text-primary/80 font-serif h-40 outline-none resize-none focus:ring-magic focus:border-magic"
                    />
                 </div>
              </div>

              <div className="p-4 border-t border-primary/10 flex justify-end gap-3 bg-black/20">
                 <Button variant="ghost" onClick={() => setIsEditorOpen(false)}>Cancelar</Button>
                 <Button onClick={handleSave} icon={<Save className="w-4 h-4"/>}>Salvar</Button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};
