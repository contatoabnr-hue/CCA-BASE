import create from 'zustand';
import { collection, onSnapshot, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase-config';
import { Story } from '../types';
import { useUIStore } from './uiStore';

interface StoryState {
  stories: Story[];
  activeStoryId: string | null;
  activeStory: Story | null;
  loadingStory: boolean;
  error: string | null;
  initStoryListener: () => () => void; // Returns the unsubscribe function
  setActiveStoryId: (id: string | null) => void;
  fetchStoryById: (id: string) => Promise<void>;
  saveStory: (story: Story) => Promise<void>;
  deleteStory: (id: string) => Promise<void>;
}

export const useStoryStore = create<StoryState>((set, get) => ({
  stories: [],
  activeStoryId: null,
  activeStory: null,
  loadingStory: false,
  error: null,

  initStoryListener: () => {
    const unsubscribe = onSnapshot(collection(db, 'Leitura'), (snapshot) => {
      const fetchedStories: Story[] = [];
      snapshot.forEach((doc) => {
        fetchedStories.push({ id: doc.id, ...doc.data() as Omit<Story, 'id'> });
      });
      set({ stories: fetchedStories });
    });
    return unsubscribe;
  },

  setActiveStoryId: (id) => {
    set({ activeStoryId: id, activeStory: null }); // Reset story when ID changes
    if (id) {
      get().fetchStoryById(id);
    }
  },

  fetchStoryById: async (id) => {
    set({ loadingStory: true, error: null });
    try {
      const docRef = doc(db, 'Leitura', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        set({ activeStory: { id: docSnap.id, ...docSnap.data() as Omit<Story, 'id'> }});
      } else {
        console.warn(`Story with id ${id} not found.`);
        set({ activeStory: null, error: "História não encontrada." });
      }
    } catch (error) {
      console.error("Error fetching single story:", error);
      set({ activeStory: null, error: "Falha ao carregar a história." });
    } finally {
      set({ loadingStory: false });
    }
  },

  saveStory: async (story) => {
    const showToast = useUIStore.getState().showToast;
    try {
      await setDoc(doc(db, 'Leitura', story.id), story);
      showToast("História salva com sucesso!");
    } catch (err) {
      console.error("Error saving story:", err);
      showToast("Erro ao salvar a história.");
      throw err; // Re-throw to be caught in the component if needed
    }
  },

  deleteStory: async (id: string) => {
    if (window.confirm("Tem certeza que deseja apagar esta história? Esta ação é irreversível.")) {
      const showToast = useUIStore.getState().showToast;
      try {
        await deleteDoc(doc(db, 'Leitura', id));
        showToast("História apagada.");
      } catch (err) {
        console.error("Error deleting story:", err);
        showToast("Erro ao apagar a história.");
      }
    }
  },
}));
