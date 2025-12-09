import create from 'zustand';
import { collection, onSnapshot, setDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase-config';
import { NewsPost, City } from '../types';
import { useUIStore } from './uiStore';

interface ContentState {
  news: NewsPost[];
  cities: City[];
  initContentListeners: () => () => void; // Returns a function that unsubscribes from both
  saveNews: (post: NewsPost) => Promise<void>;
  deleteNews: (id: string) => Promise<void>;
  saveCity: (city: City) => Promise<void>;
  deleteCity: (id: string) => Promise<void>;
}

export const useContentStore = create<ContentState>((set) => ({
  news: [],
  cities: [],

  initContentListeners: () => {
    const unsubscribeNews = onSnapshot(collection(db, 'Noticias'), (snapshot) => {
      const newsData: NewsPost[] = [];
      snapshot.forEach((doc) => {
        newsData.push({ id: doc.id, ...doc.data() as Omit<NewsPost, 'id'> });
      });
      set({ news: newsData });
    });

    const unsubscribeCities = onSnapshot(collection(db, 'Cidades'), (snapshot) => {
      const citiesData: City[] = [];
      snapshot.forEach((doc) => {
        citiesData.push({ id: doc.id, ...doc.data() as Omit<City, 'id'> });
      });
      set({ cities: citiesData });
    });

    return () => {
      unsubscribeNews();
      unsubscribeCities();
    };
  },

  saveNews: async (post) => {
    const showToast = useUIStore.getState().showToast;
    try {
      await setDoc(doc(db, 'Noticias', post.id), post);
      showToast("Notícia publicada!");
    } catch (err) {
      console.error("Error saving news:", err);
      showToast("Erro ao publicar notícia!");
    }
  },

  deleteNews: async (id) => {
    if (window.confirm("Excluir esta notícia?")) {
      const showToast = useUIStore.getState().showToast;
      try {
        await deleteDoc(doc(db, 'Noticias', id));
        showToast("Notícia removida!");
      } catch (err) {
        console.error("Error deleting news:", err);
        showToast("Erro ao remover notícia!");
      }
    }
  },

  saveCity: async (city) => {
    const showToast = useUIStore.getState().showToast;
    try {
      await setDoc(doc(db, 'Cidades', city.id), city);
      showToast("Cidade atualizada no catálogo!");
    } catch (err) {
      console.error("Error saving city:", err);
      showToast("Erro ao atualizar cidade!");
    }
  },

  deleteCity: async (id) => {
    if (window.confirm("Remover esta cidade do catálogo?")) {
      const showToast = useUIStore.getState().showToast;
      try {
        await deleteDoc(doc(db, 'Cidades', id));
        showToast("Cidade removida do catálogo!");
      } catch (err)
      {
        console.error("Error deleting city:", err);
        showToast("Erro ao remover cidade!");
      }
    }
  },
}));
