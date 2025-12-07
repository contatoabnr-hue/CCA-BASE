
export interface StoryBlock {
  id: string;
  type: 'text' | 'image';
  content: string; // HTML for text, Base64/URL for image
  styles?: {
    fontSize?: string;
    fontStyle?: string;
    fontWeight?: string;
    textAlign?: 'left' | 'center' | 'right' | 'justify';
  };
}

export interface Story {
  id: string;
  title: string;
  summary: string;
  coverImage: string;
  author: string;
  createdAt: number;
  blocks: StoryBlock[];
  settings: {
    parallaxHeader: boolean;
    fadeImagesOnScroll: boolean;
    theme: 'light' | 'dark' | 'sepia';
  };
  isPublished: boolean;
}

export interface NewsPost {
  id: string;
  title: string;
  bannerImage: string;
  content: string; // HTML content
  date: number;
  author: string;
}

export interface City {
  id: string;
  name: string;
  description: string;
  image: string;
}

export type ViewMode = 'library' | 'reader' | 'editor' | 'dashboard' | 'archive' | 'news' | 'world';
