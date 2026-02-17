import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { categories as categoriesApi } from '../lib/api';
import type { Database } from '../lib/database.types';

type Category = Database['public']['Tables']['categories']['Row'];

const COLORS = [
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#8B5CF6',
  '#EC4899',
  '#EF4444',
  '#06B6D4',
  '#84CC16',
  '#F97316',
  '#6366F1'
];

export function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(COLORS[0]);

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    setLoading(true);
    try {
      const data = await categoriesApi.getAll();
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  }

  async function addCategory() {
    if (!newName.trim()) return;

    try {
      await categoriesApi.create({
        name: newName.trim(),
        color: newColor
      });

      setNewName('');
      setNewColor(COLORS[0]);
      setShowAddModal(false);
      loadCategories();
    } catch (error) {
      console.error('Error adding category:', error);
      alert('Erreur lors de l\'ajout de la catégorie');
    }
  }

  async function updateCategory() {
    if (!editingCategory || !newName.trim()) return;

    try {
      await categoriesApi.update(editingCategory.id, {
        name: newName.trim(),
        color: newColor
      });

      setNewName('');
      setNewColor(COLORS[0]);
      setEditingCategory(null);
      setShowEditModal(false);
      loadCategories();
    } catch (error) {
      console.error('Error updating category:', error);
      alert('Erreur lors de la modification de la catégorie');
    }
  }

  function confirmDeleteCategory(category: Category) {
    setCategoryToDelete(category);
    setShowDeleteModal(true);
  }

  async function deleteCategory() {
    if (!categoryToDelete) return;

    try {
      await categoriesApi.delete(categoryToDelete.id);
      setShowDeleteModal(false);
      setCategoryToDelete(null);
      loadCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Erreur lors de la suppression de la catégorie');
    }
  }

  function openEditModal(category: Category) {
    setEditingCategory(category);
    setNewName(category.name);
    setNewColor(category.color);
    setShowEditModal(true);
  }

  function openAddModal() {
    setNewName('');
    setNewColor(COLORS[0]);
    setShowAddModal(true);
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Catégories</h1>
          <p className="text-lg text-slate-600">Organisez vos événements par catégories</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <button
            onClick={openAddModal}
            className="w-full mb-6 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all shadow-md hover:shadow-lg font-semibold"
          >
            <Plus size={20} />
            Nouvelle Catégorie
          </button>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : categories.length === 0 ? (
            <p className="text-center text-slate-600 py-12">Aucune catégorie pour le moment</p>
          ) : (
            <div className="space-y-3">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="font-medium text-slate-900">{category.name}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(category)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Modifier"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => confirmDeleteCategory(category)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-bold text-slate-900 mb-6">Nouvelle Catégorie</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Nom de la catégorie *
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Ex: Conférence"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Couleur
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewColor(color)}
                      className={`w-12 h-12 rounded-xl transition-all ${
                        newColor === color ? 'ring-4 ring-slate-400 scale-110' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-3 border-2 border-slate-300 rounded-xl hover:bg-slate-50 transition-all font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={addCategory}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all font-semibold shadow-md hover:shadow-lg"
                >
                  Ajouter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-bold text-slate-900 mb-6">Modifier la Catégorie</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Nom de la catégorie *
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Couleur
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewColor(color)}
                      className={`w-12 h-12 rounded-xl transition-all ${
                        newColor === color ? 'ring-4 ring-slate-400 scale-110' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-3 border-2 border-slate-300 rounded-xl hover:bg-slate-50 transition-all font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={updateCategory}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all font-semibold shadow-md hover:shadow-lg"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && categoryToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="text-red-600" size={24} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">Supprimer la catégorie</h3>
            </div>

            <div className="mb-6">
              <p className="text-slate-600 mb-4">
                Voulez-vous vraiment supprimer la catégorie <strong className="text-slate-900">"{categoryToDelete.name}"</strong> ?
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm text-amber-800">
                  ⚠️ Les événements associés à cette catégorie ne seront pas supprimés.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setCategoryToDelete(null);
                }}
                className="flex-1 px-4 py-3 border-2 border-slate-300 rounded-xl hover:bg-slate-50 transition-all font-medium"
              >
                Annuler
              </button>
              <button
                onClick={deleteCategory}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all font-semibold shadow-md hover:shadow-lg"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
