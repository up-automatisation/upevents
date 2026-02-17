import { useState, useEffect } from 'react';
import { Plus, Trash2, Clock, User, Coffee, Save, AlertCircle, Edit, X, Calendar, MapPin, CheckCircle, Filter, Tag } from 'lucide-react';
import { events as eventsApi, categories as categoriesApi, programSlots as programSlotsApi } from '../lib/api';
import type { Database } from '../lib/database.types';
import { ConfirmModal, AlertModal } from './Modal';

type Event = Database['public']['Tables']['events']['Row'];
type ProgramSlot = Database['public']['Tables']['program_slots']['Row'];
type LocalSlot = Omit<ProgramSlot, 'id' | 'created_at'> & { id?: number };
type Category = Database['public']['Tables']['categories']['Row'];

interface EventWithCategory extends Event {
  category?: Category | null;
}

interface ProgramBuilderProps {
  preselectedEventId?: number;
}

export function ProgramBuilder({ preselectedEventId }: ProgramBuilderProps) {
  const [events, setEvents] = useState<EventWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [slots, setSlots] = useState<LocalSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<(string | number)[]>([]);

  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [speaker, setSpeaker] = useState('');
  const [objective, setObjective] = useState('');
  const [isBreak, setIsBreak] = useState(false);

  const [alertConfig, setAlertConfig] = useState<{ isOpen: boolean; title: string; message: string; type: 'success' | 'error' | 'info' }>({ isOpen: false, title: '', message: '', type: 'info' });
  const [confirmDeleteSlot, setConfirmDeleteSlot] = useState<{ isOpen: boolean; index: number }>({ isOpen: false, index: -1 });
  const [confirmSaveProgram, setConfirmSaveProgram] = useState(false);

  useEffect(() => {
    loadEvents();
    loadCategories();
  }, []);

  useEffect(() => {
    if (preselectedEventId && events.length > 0) {
      setSelectedEventId(preselectedEventId);
    }
  }, [preselectedEventId, events]);

  useEffect(() => {
    if (selectedEventId) {
      loadSlots();
    } else {
      setSlots([]);
      setHasChanges(false);
    }
    setEditingIndex(null);
    setTitle('');
    setDescription('');
    setSpeaker('');
    setObjective('');
    setIsBreak(false);
  }, [selectedEventId]);

  async function loadCategories() {
    try {
      const data = await categoriesApi.getAll();
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }

  async function loadEvents() {
    try {
      const eventsData = await eventsApi.getAll(true);
      if (!eventsData) return;

      setEvents(eventsData);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  }

  function toggleStatus(status: string) {
    setSelectedStatuses(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  }

  function toggleCategory(categoryId: string | number) {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(c => c !== categoryId)
        : [...prev, categoryId]
    );
  }

  function clearFilters() {
    setSelectedStatuses([]);
    setSelectedCategories([]);
  }

  async function loadSlots() {
    setLoading(true);
    try {
      const data = await programSlotsApi.getByEvent(selectedEventId!);
      if (data) {
        setSlots(data);
        setHasChanges(false);
      }
    } catch (error) {
      console.error('Error loading slots:', error);
    }
    setLoading(false);
  }

  function addSlot() {
    if (!selectedEventId || !title || !startTime || !endTime) {
      setAlertConfig({ isOpen: true, title: 'Champs manquants', message: 'Veuillez remplir tous les champs obligatoires', type: 'error' });
      return;
    }

    if (editingIndex !== null) {
      const updatedSlots = [...slots];
      updatedSlots[editingIndex] = {
        ...updatedSlots[editingIndex],
        start_time: startTime,
        end_time: endTime,
        title,
        description,
        speaker,
        objective,
        is_break: isBreak,
      };
      setSlots(updatedSlots);
      setEditingIndex(null);
    } else {
      const newSlot: LocalSlot = {
        event_id: selectedEventId,
        start_time: startTime,
        end_time: endTime,
        title,
        description,
        speaker,
        objective,
        is_break: isBreak,
        order_index: slots.length,
      };
      setSlots([...slots, newSlot]);
    }

    setHasChanges(true);
    clearForm();
  }

  function editSlot(index: number) {
    const slot = slots[index];
    setStartTime(slot.start_time);
    setEndTime(slot.end_time);
    setTitle(slot.title);
    setDescription(slot.description || '');
    setSpeaker(slot.speaker || '');
    setObjective(slot.objective || '');
    setIsBreak(slot.is_break);
    setEditingIndex(index);
  }

  function cancelEdit() {
    setEditingIndex(null);
    clearForm();
  }

  function clearForm() {
    setTitle('');
    setDescription('');
    setSpeaker('');
    setObjective('');
    setIsBreak(false);
  }

  function deleteSlot(index: number) {
    setConfirmDeleteSlot({ isOpen: true, index });
  }

  function confirmDeleteSlotAction() {
    const index = confirmDeleteSlot.index;
    const newSlots = slots.filter((_, i) => i !== index);
    const reorderedSlots = newSlots.map((slot, i) => ({
      ...slot,
      order_index: i,
    }));

    setSlots(reorderedSlots);
    setHasChanges(true);
    setConfirmDeleteSlot({ isOpen: false, index: -1 });
  }

  async function saveProgram() {
    if (!selectedEventId || slots.length === 0) {
      setAlertConfig({ isOpen: true, title: 'Aucun créneau', message: 'Ajoutez au moins un créneau avant de valider', type: 'error' });
      return;
    }

    setConfirmSaveProgram(true);
  }

  async function confirmSaveProgramAction() {
    if (!selectedEventId) return;
    
    setSaving(true);
    setConfirmSaveProgram(false);

    try {
      const slotsToSave = slots.map(({ id: _id, ...slot }) => slot);
      await programSlotsApi.batchUpdate(selectedEventId, slotsToSave);

      setAlertConfig({ isOpen: true, title: 'Succès', message: 'Programme validé avec succès !', type: 'success' });
      setHasChanges(false);
      await loadSlots();
    } catch (error) {
      console.error('Error saving program:', error);
      setAlertConfig({ isOpen: true, title: 'Erreur', message: 'Erreur lors de la validation du programme', type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  function formatTime(time: string) {
    return time.substring(0, 5);
  }

  function calculateDuration(start: string, end: string) {
    const startMinutes = parseInt(start.split(':')[0]) * 60 + parseInt(start.split(':')[1]);
    const endMinutes = parseInt(end.split(':')[0]) * 60 + parseInt(end.split(':')[1]);
    const diff = endMinutes - startMinutes;
    return `${diff} minutes`;
  }

  const filteredEvents = events.filter(event => {
    if (selectedStatuses.length > 0) {
      const matchesStatus = selectedStatuses.some(status => {
        if (status === 'active') return event.is_active && !event.is_closed;
        if (status === 'inactive') return !event.is_active && !event.is_closed;
        if (status === 'closed') return event.is_closed;
        return false;
      });
      if (!matchesStatus) return false;
    }

    if (selectedCategories.length > 0) {
      const hasUncategorized = selectedCategories.includes('uncategorized') && !event.category_id;
      const hasCategory = event.category_id && selectedCategories.includes(event.category_id);
      if (!hasUncategorized && !hasCategory) {
        return false;
      }
    }

    return true;
  });

  const activeFiltersCount = selectedStatuses.length + selectedCategories.length;

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Construction de Programme</h1>
          <p className="text-lg text-slate-600">Créez et organisez le déroulé de votre événement</p>
        </div>

        <div className="flex gap-6">
          <div className="w-72 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-xl p-6 sticky top-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Filter size={20} className="text-slate-700" />
                  <h2 className="text-xl font-bold text-slate-900">Filtres</h2>
                  {activeFiltersCount > 0 && (
                    <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {activeFiltersCount}
                    </span>
                  )}
                </div>
                {activeFiltersCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
                  >
                    Effacer
                  </button>
                )}
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-700 mb-3">Statut</h3>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={selectedStatuses.includes('active')}
                        onChange={() => toggleStatus('active')}
                        className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-2 focus:ring-emerald-500"
                      />
                      <span className="text-sm text-slate-700 group-hover:text-slate-900">Actifs</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={selectedStatuses.includes('inactive')}
                        onChange={() => toggleStatus('inactive')}
                        className="w-4 h-4 rounded border-slate-300 text-slate-600 focus:ring-2 focus:ring-slate-500"
                      />
                      <span className="text-sm text-slate-700 group-hover:text-slate-900">Inactifs</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={selectedStatuses.includes('closed')}
                        onChange={() => toggleStatus('closed')}
                        className="w-4 h-4 rounded border-slate-300 text-orange-600 focus:ring-2 focus:ring-orange-500"
                      />
                      <span className="text-sm text-slate-700 group-hover:text-slate-900">Clôturés</span>
                    </label>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-6">
                  <h3 className="text-sm font-bold text-slate-700 mb-3">Catégories</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes('uncategorized')}
                        onChange={() => toggleCategory('uncategorized')}
                        className="w-4 h-4 rounded border-slate-300 text-slate-600 focus:ring-2 focus:ring-slate-500"
                      />
                      <span className="text-sm text-slate-700 group-hover:text-slate-900">Sans catégorie</span>
                    </label>
                    {categories.map(category => (
                      <label key={category.id} className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(category.id)}
                          onChange={() => toggleCategory(category.id)}
                          className="w-4 h-4 rounded border-slate-300 focus:ring-2"
                          style={{ color: category.color }}
                        />
                        <div className="flex items-center gap-2 flex-1">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="text-sm text-slate-700 group-hover:text-slate-900">
                            {category.name}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Sélectionnez un événement</h2>
              {filteredEvents.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                  <div className="bg-gradient-to-br from-blue-100 to-cyan-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar size={40} className="text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    {events.length === 0 ? 'Aucun événement disponible' : 'Aucun événement trouvé'}
                  </h3>
                  <p className="text-slate-600 mb-6">
                    {events.length === 0
                      ? 'Créez d\'abord un événement pour construire son programme'
                      : 'Aucun événement ne correspond à ce filtre'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredEvents.map((event) => {
                const isSelected = selectedEventId === event.id;
                const eventDate = new Date(event.event_date);

                return (
                  <button
                    key={event.id}
                    onClick={() => setSelectedEventId(event.id)}
                    className={`relative text-left p-5 rounded-xl transition-all duration-200 ${
                      isSelected
                        ? 'bg-blue-50 border-3 border-blue-500 shadow-lg ring-2 ring-blue-400'
                        : 'bg-white border-2 border-slate-200 hover:border-blue-300 hover:shadow-md hover:-translate-y-1'
                    }`}
                  >
                    <div className={`absolute top-0 left-0 w-1.5 h-full rounded-l-xl ${
                      isSelected ? 'bg-blue-600' : 'bg-gradient-to-b from-blue-500 to-cyan-500'
                    }`} />

                    {isSelected && (
                      <div className="absolute -top-2 -right-2 bg-blue-600 text-white rounded-full p-1.5 shadow-lg">
                        <CheckCircle size={20} fill="currentColor" />
                      </div>
                    )}

                    <div className="pl-3">
                      <h3 className={`text-lg font-bold mb-3 pr-6 ${
                        isSelected ? 'text-blue-900' : 'text-slate-900'
                      }`}>
                        {event.title}
                      </h3>

                      <div className="space-y-2">
                        {event.category && (
                          <div className="mb-2">
                            <span
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-white text-xs font-semibold"
                              style={{ backgroundColor: event.category.color }}
                            >
                              <Tag size={12} />
                              {event.category.name}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-sm text-slate-700">
                          <Calendar size={16} className="text-blue-600 flex-shrink-0" />
                          <span className="font-medium">
                            {eventDate.toLocaleDateString('fr-FR', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </span>
                        </div>

                        {event.location && (
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <MapPin size={16} className="text-slate-400 flex-shrink-0" />
                            <span>{event.location}</span>
                          </div>
                        )}

                        <div className="pt-2">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                            event.is_closed
                              ? 'bg-slate-100 text-slate-600'
                              : event.is_active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {event.is_closed ? 'Clôturé' : event.is_active ? 'Actif' : 'Inactif'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
            </div>

            {selectedEventId && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-slate-900">
                    {editingIndex !== null ? 'Modifier le créneau' : 'Ajouter un créneau'}
                  </h2>
                  {editingIndex !== null && (
                    <button
                      onClick={cancelEdit}
                      className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-semibold transition-colors"
                    >
                      <X size={20} />
                      Annuler
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">
                        Heure début *
                      </label>
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">
                        Heure fin *
                      </label>
                      <input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Titre *
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ex: Introduction à l'IA"
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Décrivez le contenu du créneau..."
                      rows={3}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Objectif pédagogique
                    </label>
                    <textarea
                      value={objective}
                      onChange={(e) => setObjective(e.target.value)}
                      placeholder="Ex: Comprendre et mettre en œuvre une stratégie de maintenance prédictive..."
                      rows={2}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Intervenant
                    </label>
                    <input
                      type="text"
                      value={speaker}
                      onChange={(e) => setSpeaker(e.target.value)}
                      placeholder="Ex: Dr. Sophie Martin"
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl">
                    <input
                      type="checkbox"
                      id="isBreak"
                      checked={isBreak}
                      onChange={(e) => setIsBreak(e.target.checked)}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <label htmlFor="isBreak" className="text-sm font-medium text-slate-700 cursor-pointer flex items-center gap-2">
                      <Coffee size={18} />
                      C'est une pause
                    </label>
                  </div>

                  <button
                    onClick={addSlot}
                    className={`w-full flex items-center justify-center gap-2 text-white px-6 py-3 rounded-xl transition-all shadow-md hover:shadow-lg font-semibold ${
                      editingIndex !== null
                        ? 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700'
                        : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700'
                    }`}
                  >
                    {editingIndex !== null ? (
                      <>
                        <Save size={20} />
                        Modifier le créneau
                      </>
                    ) : (
                      <>
                        <Plus size={20} />
                        Ajouter le créneau
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-slate-900">Créneaux ajoutés</h2>
                  {hasChanges && (
                    <span className="flex items-center gap-2 text-sm text-orange-600 font-semibold bg-orange-50 px-3 py-1 rounded-full">
                      <AlertCircle size={16} />
                      Non sauvegardé
                    </span>
                  )}
                </div>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : slots.length === 0 ? (
                  <p className="text-center text-slate-600 py-8">Aucun créneau pour le moment</p>
                ) : (
                  <>
                    <div className="space-y-3 mb-4">
                      {slots.map((slot, index) => (
                        <div
                          key={index}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            editingIndex === index
                              ? 'bg-orange-50 border-orange-300 ring-2 ring-orange-400'
                              : slot.is_break
                              ? 'bg-amber-50 border-amber-200'
                              : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 text-sm font-bold mb-1">
                                <Clock size={16} className={slot.is_break ? 'text-amber-600' : 'text-blue-600'} />
                                <span className={slot.is_break ? 'text-amber-600' : 'text-blue-600'}>
                                  {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                                </span>
                              </div>
                              <h3 className="font-bold text-slate-900 mb-1">{slot.title}</h3>
                              {slot.description && (
                                <p className="text-sm text-slate-600 mb-1">{slot.description}</p>
                              )}
                              {slot.objective && (
                                <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-2 py-1 mb-1 inline-flex items-start gap-1">
                                  <span className="font-semibold">🎯</span>
                                  <span><span className="font-semibold">Objectif :</span> {slot.objective}</span>
                                </p>
                              )}
                              {slot.speaker && (
                                <p className="text-sm text-blue-600 italic flex items-center gap-1">
                                  <User size={14} />
                                  {slot.speaker}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-2 ml-2">
                              <button
                                onClick={() => editSlot(index)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Modifier"
                              >
                                <Edit size={18} />
                              </button>
                              <button
                                onClick={() => deleteSlot(index)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Supprimer"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={saveProgram}
                      disabled={saving || !hasChanges}
                      className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold text-lg transition-all shadow-lg ${
                        saving || !hasChanges
                          ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 hover:shadow-xl'
                      }`}
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Validation en cours...
                        </>
                      ) : (
                        <>
                          <Save size={24} />
                          Valider le programme
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="lg:sticky lg:top-8 h-fit">
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-2xl overflow-hidden">
                <div className="bg-white bg-opacity-10 backdrop-blur-sm text-white p-6 text-center">
                  <h2 className="text-3xl font-bold mb-2">
                    {events.find(e => e.id === selectedEventId)?.title}
                  </h2>
                  <p className="text-lg opacity-95">Aperçu du Programme</p>
                </div>

                <div className="bg-white p-8 max-h-[800px] overflow-y-auto">
                  {slots.length === 0 ? (
                    <p className="text-center text-slate-600 py-12">
                      Ajoutez des créneaux pour voir l'aperçu
                    </p>
                  ) : (
                    <div className="space-y-6">
                      {slots.map((slot, index) => (
                        <div
                          key={index}
                          className={`flex transition-all hover:transform hover:-translate-y-1 ${
                            slot.is_break
                              ? 'bg-amber-50 p-5 rounded-xl border-l-4 border-amber-500'
                              : 'bg-white p-5 rounded-xl shadow-lg border-l-4 border-blue-500'
                          }`}
                        >
                          <div className="min-w-[100px] pr-4 border-r-2 border-slate-200">
                            <div className={`text-xl font-bold ${slot.is_break ? 'text-amber-600' : 'text-blue-600'}`}>
                              {formatTime(slot.start_time)}
                            </div>
                            <div className={`text-xl font-bold ${slot.is_break ? 'text-amber-600' : 'text-blue-600'}`}>
                              {formatTime(slot.end_time)}
                            </div>
                          </div>
                          <div className="flex-1 pl-4">
                            <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                              {slot.is_break && <Coffee size={20} className="text-amber-600" />}
                              {slot.title}
                            </h3>
                            {slot.description && (
                              <p className="text-slate-600 text-sm leading-relaxed mb-2">
                                {slot.description}
                              </p>
                            )}
                            {slot.objective && (
                              <div className="text-sm text-green-800 bg-green-50 border-l-4 border-green-500 rounded-r-lg px-3 py-2 mb-2">
                                <p className="font-semibold flex items-center gap-1 mb-1">
                                  <span>🎯</span>
                                  <span>Objectif :</span>
                                </p>
                                <p className="leading-relaxed">{slot.objective}</p>
                              </div>
                            )}
                            {slot.speaker && (
                              <p className="text-purple-600 italic font-medium text-sm">
                                Intervenant : {slot.speaker}
                              </p>
                            )}
                            <span className={`inline-block mt-3 px-3 py-1 rounded-full text-xs font-semibold text-white ${
                              slot.is_break ? 'bg-amber-500' : 'bg-blue-600'
                            }`}>
                              {calculateDuration(slot.start_time, slot.end_time)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
            )}
          </div>
        </div>
      </div>

      <AlertModal
        isOpen={alertConfig.isOpen}
        onClose={() => setAlertConfig({ ...alertConfig, isOpen: false })}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
      />

      <ConfirmModal
        isOpen={confirmDeleteSlot.isOpen}
        onClose={() => setConfirmDeleteSlot({ isOpen: false, index: -1 })}
        onConfirm={confirmDeleteSlotAction}
        title="Supprimer le créneau"
        message="Voulez-vous vraiment supprimer ce créneau ?"
        confirmText="Supprimer"
        variant="danger"
      />

      <ConfirmModal
        isOpen={confirmSaveProgram}
        onClose={() => setConfirmSaveProgram(false)}
        onConfirm={confirmSaveProgramAction}
        title="Valider le programme"
        message="Voulez-vous valider ce programme ? Cela remplacera le programme existant."
        confirmText="Valider"
        loading={saving}
      />
    </div>
  );
}
