import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { IVisualLayer } from './types';
import { v4 as uuidv4 } from 'uuid';

interface LayerState {
  layers: IVisualLayer[];
  addLayer: (layer: Omit<IVisualLayer, 'id'>) => string;
  removeLayer: (id: string) => void;
  updateLayer: (id: string, updates: Partial<IVisualLayer>) => void;
  reorderLayers: (dragIndex: number, hoverIndex: number) => void;
}

/**
 * Layer Manager Store
 * Single Source of Truth for the visual composition stack.
 */
export const useLayerManager = create<LayerState>()(
  subscribeWithSelector((set) => ({
    layers: [],

    addLayer: (layer) => {
      const id = uuidv4();
      set((state) => ({
        layers: [...state.layers, { ...layer, id }],
      }));
      return id;
    },

    removeLayer: (id) =>
      set((state) => ({
        layers: state.layers.filter((l) => l.id !== id),
      })),

    updateLayer: (id, updates) =>
      set((state) => ({
        layers: state.layers.map((l) => (l.id === id ? { ...l, ...updates } : l)),
      })),

    reorderLayers: (dragIndex, hoverIndex) =>
      set((state) => {
        const newLayers = [...state.layers];
        const [removed] = newLayers.splice(dragIndex, 1);
        newLayers.splice(hoverIndex, 0, removed);
        return { layers: newLayers };
      }),
  }))
);
