import { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { events as eventsApi, categories as categoriesApi, customFields as customFieldsApi } from '../lib/api';
import type { Database } from '../lib/database.types';
import { TimeRangePicker } from './TimeRangePicker';
import { useNavigate } from '../App';

type CustomField = Database['public']['Tables']['custom_fields']['Insert'];
type Category = Database['public']['Tables']['categories']['Row'];

export function CreateEvent() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [programHtml, setProgramHtml] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customFields, setCustomFields] = useState<Omit<CustomField, 'event_id'>[]>([]);
  const [loading, setLoading] = useState(false);

  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState<'text' | 'email' | 'number' | 'select' | 'textarea'>('text');
  const [newFieldRequired, setNewFieldRequired] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    try {
      const data = await categoriesApi.getAll();
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }

  function addCustomField() {
    if (!newFieldName.trim()) return;

    setCustomFields([
      ...customFields,
      {
        field_name: newFieldName,
        field_type: newFieldType,
        is_required: newFieldRequired,
        display_order: customFields.length,
        field_options: []
      }
    ]);

    setNewFieldName('');
    setNewFieldType('text');
    setNewFieldRequired(false);
  }

  function removeCustomField(index: number) {
    setCustomFields(customFields.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !eventDate) return;

    setLoading(true);

    try {
      const event = await eventsApi.create({
        title,
        description,
        location,
        event_date: new Date(eventDate).toISOString(),
        category_id: categoryId || null
      });

      if (customFields.length > 0 && event) {
        await Promise.all(
          customFields.map((field, index) =>
            customFieldsApi.create({
              ...field,
              event_id: event.id,
              display_order: index
            })
          )
        );
      }

      navigate(`event/${event.id}`);
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Erreur lors de la création de l\'événement');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Créer un Événement</h1>
          <p className="text-lg text-slate-600">Remplissez les informations de votre nouvel événement</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Titre de l'événement *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Lieu
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Date de l'événement *
              </label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>

            <TimeRangePicker
              startTime={startTime}
              endTime={endTime}
              onStartTimeChange={setStartTime}
              onEndTimeChange={setEndTime}
            />

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Programme de l'événement
              </label>
              <div className="space-y-2">
                <textarea
                  value={programHtml}
                  onChange={(e) => setProgramHtml(e.target.value)}
                  rows={8}
                  placeholder="Utilisez du HTML pour formater le programme&#10;Exemple:&#10;<h3>Agenda</h3>&#10;<ul>&#10;  <li><strong>9h00 - 9h30</strong> : Accueil</li>&#10;  <li><strong>9h30 - 11h00</strong> : Conférence</li>&#10;</ul>"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono text-sm max-h-48 overflow-y-auto resize-none"
                />
                {programHtml && (
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-4 rounded-xl border-2 border-slate-200 max-h-48 overflow-y-auto">
                    <p className="text-xs font-bold text-slate-600 mb-2">APERÇU:</p>
                    <div
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: programHtml }}
                    />
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Catégorie
              </label>
              <select
                value={categoryId ?? ''}
                onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="">Aucune catégorie</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="border-t-2 border-slate-200 pt-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Champs personnalisés</h2>
              <p className="text-sm text-slate-600 mb-6">
                Les champs par défaut (nom, prénom, email, entreprise) sont déjà inclus.
              </p>

              {customFields.length > 0 && (
                <div className="space-y-2 mb-6">
                  {customFields.map((field, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-gradient-to-r from-slate-50 to-slate-100 p-4 rounded-xl border border-slate-200"
                    >
                      <div>
                        <span className="font-semibold text-slate-900">{field.field_name}</span>
                        <span className="text-slate-600 text-sm ml-2">({field.field_type})</span>
                        {field.is_required && (
                          <span className="text-red-600 text-sm ml-2 font-bold">*</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeCustomField(index)}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-lg transition-all"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="bg-gradient-to-br from-slate-50 to-blue-50 p-6 rounded-xl border-2 border-slate-200 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    value={newFieldName}
                    onChange={(e) => setNewFieldName(e.target.value)}
                    placeholder="Nom du champ"
                    className="px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  <select
                    value={newFieldType}
                    onChange={(e) => setNewFieldType(e.target.value as any)}
                    className="px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value="text">Texte</option>
                    <option value="email">Email</option>
                    <option value="number">Nombre</option>
                    <option value="textarea">Texte long</option>
                  </select>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newFieldRequired}
                      onChange={(e) => setNewFieldRequired(e.target.checked)}
                      className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-slate-700">Champ obligatoire</span>
                  </label>
                  <button
                    type="button"
                    onClick={addCustomField}
                    className="ml-auto flex items-center gap-2 bg-gradient-to-r from-slate-700 to-slate-800 text-white px-6 py-3 rounded-xl hover:from-slate-800 hover:to-slate-900 transition-all shadow-md hover:shadow-lg font-medium"
                  >
                    <Plus size={18} />
                    Ajouter
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-6">
              <button
                type="button"
                onClick={() => navigate('')}
                className="flex-1 px-6 py-4 border-2 border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 transition-all font-semibold"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all shadow-md hover:shadow-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Création...' : 'Créer l\'événement'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
