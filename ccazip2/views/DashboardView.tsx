import React from 'react';
import { Button } from '../components/Button';
import { Plus, Edit3, Trash2 } from 'lucide-react';
import { useStoryStore } from '../stores/storyStore';

interface DashboardViewProps {
  onCreate: () => void;
  onEdit: (id: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onCreate, onEdit }) => {
  const { stories, deleteStory } = useStoryStore();

  // The store handles loading and error states globally, so this view can be simpler.
  // We sort stories here for presentation purposes.
  const sortedStories = [...stories].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-serif font-bold text-primary">Área de Trabalho</h1>
          <p className="text-primary/60">Gerencie suas narrativas e rascunhos.</p>
        </div>
        <Button onClick={onCreate} icon={<Plus className="w-4 h-4"/>}>
          Nova História
        </Button>
      </div>

      <div className="bg-surface rounded-xl shadow-sm border border-primary/10 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 border-b border-primary/10 text-primary/60 text-sm uppercase tracking-wider">
              <th className="p-4 font-medium">Título</th>
              <th className="p-4 font-medium">Data</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-primary/5">
            {sortedStories.map(story => (
              <tr key={story.id} className="hover:bg-white/5 transition-colors group">
                <td className="p-4">
                  <div className="font-bold text-primary group-hover:text-magic transition-colors">{story.title}</div>
                  <div className="text-sm text-primary/50 truncate max-w-xs">{story.summary}</div>
                </td>
                <td className="p-4 text-primary/60 text-sm">
                  {new Date(story.createdAt).toLocaleDateString()}
                </td>
                <td className="p-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                    story.isPublished 
                      ? 'bg-green-900/20 text-green-400 border-green-900/50' 
                      : 'bg-amber-900/20 text-amber-400 border-amber-900/50'
                  }`}>
                    {story.isPublished ? 'Publicado' : 'Rascunho'}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => onEdit(story.id)}
                      className="p-2 hover:bg-primary/10 text-primary/80 hover:text-magic rounded-md transition-colors"
                      title="Editar"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => deleteStory(story.id)}
                      className="p-2 hover:bg-red-900/20 text-red-400 rounded-md transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {stories.length === 0 && (
              <tr>
                <td colSpan={4} className="p-10 text-center text-primary/40 italic">
                  Nenhuma história encontrada. Comece a escrever!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};