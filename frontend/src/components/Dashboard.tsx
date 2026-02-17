import { useState, useEffect } from 'react';
import { Calendar, Users, MapPin, Tag, Filter, List } from 'lucide-react';
import { events as eventsApi, categories as categoriesApi, registrations as registrationsApi, attendance as attendanceApi, programSlots as programSlotsApi } from '../lib/api';
import type { Database } from '../lib/database.types';
import { formatDateMedium } from '../lib/utils';
import { useNavigate } from '../App';

type Event = Database['public']['Tables']['events']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];

interface EventWithStats extends Event {
  registrations_count: number;
  attendance_count: number;
  category_name?: string;
  category_color?: string;
  has_program: boolean;
}

export function Dashboard() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);

  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  useEffect(() => {
    loadEvents();
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

  async function loadEvents() {
    setLoading(true);
    try {
      const eventsData = await eventsApi.getAll(true); // Include closed events

      const eventsWithStats = await Promise.all(
        (eventsData || []).map(async (event: any) => {
          // Get registrations for this event
          const regs = await registrationsApi.getByEvent(event.id);
          const activeRegs = regs.filter((r: any) => !r.cancelled);
          const regCount = activeRegs.length;

          // Get attendances
          let attCount = 0;
          if (activeRegs.length > 0) {
            const attendances = await Promise.all(
              activeRegs.map((r: any) => attendanceApi.getByRegistration(r.id))
            );
            attCount = attendances.filter(a => a !== null).length;
          }

          // Get program slots
          const programSlots = await programSlotsApi.getByEvent(event.id);

          return {
            ...event,
            registrations_count: regCount,
            attendance_count: attCount,
            has_program: programSlots.length > 0
          };
        })
      );

      setEvents(eventsWithStats);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  }

  function toggleStatus(status: string) {
    setSelectedStatuses(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  }

  function toggleCategory(categoryId: string) {
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
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Événements</h1>
          <p className="text-lg text-slate-600">Gérez tous vos événements en un seul endroit</p>
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
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => toggleStatus('active')}
                      className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                        selectedStatuses.includes('active')
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      Actifs
                    </button>
                    <button
                      onClick={() => toggleStatus('inactive')}
                      className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                        selectedStatuses.includes('inactive')
                          ? 'bg-slate-600 text-white shadow-md'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      Inactifs
                    </button>
                    <button
                      onClick={() => toggleStatus('closed')}
                      className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                        selectedStatuses.includes('closed')
                          ? 'bg-orange-600 text-white shadow-md'
                          : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
                      }`}
                    >
                      Clôturés
                    </button>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-6">
                  <h3 className="text-sm font-bold text-slate-700 mb-3">Catégories</h3>
                  <div className="flex flex-wrap gap-2 max-h-80 overflow-y-auto">
                    <button
                      onClick={() => toggleCategory('uncategorized')}
                      className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                        selectedCategories.includes('uncategorized')
                          ? 'bg-slate-600 text-white shadow-md'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      Sans catégorie
                    </button>
                    {categories.map(category => (
                      <button
                        key={category.id}
                        onClick={() => toggleCategory(category.id)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${
                          selectedCategories.includes(category.id)
                            ? 'text-white shadow-md'
                            : 'hover:opacity-90'
                        }`}
                        style={{
                          backgroundColor: selectedCategories.includes(category.id)
                            ? category.color
                            : `${category.color}20`,
                          color: selectedCategories.includes(category.id)
                            ? 'white'
                            : category.color
                        }}
                      >
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        {category.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1">

        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-16 text-center">
            <div className="bg-gradient-to-br from-blue-100 to-cyan-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <Calendar size={48} className="text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">
              {events.length === 0 ? 'Aucun événement' : 'Aucun événement trouvé'}
            </h3>
            <p className="text-lg text-slate-600 mb-8">
              {events.length === 0
                ? 'Commencez par créer votre premier événement'
                : 'Aucun événement ne correspond à ce filtre'}
            </p>
            {events.length === 0 && (
              <button
                onClick={() => navigate('create')}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all shadow-md hover:shadow-lg font-semibold text-lg"
              >
                Créer un événement
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all p-5 cursor-pointer border border-slate-200 hover:border-blue-300"
                onClick={() => navigate(`event/${event.id}`)}
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-bold text-slate-900 line-clamp-1 flex-1 pr-2">{event.title}</h3>
                  <div className="flex gap-2">
                    {event.has_program && (
                      <span className="px-2.5 py-0.5 rounded-lg text-xs font-semibold whitespace-nowrap bg-violet-100 text-violet-700 flex items-center gap-1">
                        <List size={12} />
                        Programme
                      </span>
                    )}
                    <span className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
                      event.is_closed
                        ? 'bg-slate-100 text-slate-600'
                        : event.is_active
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {event.is_closed ? 'Inactif' : event.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                </div>

                <div className="h-5 mb-3">
                  {event.description && (
                    <p className="text-slate-600 text-sm line-clamp-1">{event.description}</p>
                  )}
                </div>

                <div className="h-8 mb-3">
                  {event.category_name && (
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-white text-xs font-semibold"
                      style={{ backgroundColor: event.category_color || '#3B82F6' }}
                    >
                      <Tag size={12} />
                      {event.category_name}
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center gap-1.5 text-sm text-slate-700">
                    <Calendar size={14} className="text-blue-600" />
                    <span className="capitalize">{formatDateMedium(event.event_date)}</span>
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-1.5 text-sm text-slate-700">
                      <MapPin size={14} className="text-blue-600" />
                      <span className="line-clamp-1">{event.location}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <div className="flex-1 bg-blue-50 rounded-lg p-2.5 border border-blue-100">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Users size={14} className="text-blue-600" />
                      <span className="text-xs font-semibold text-blue-700">Inscrits</span>
                    </div>
                    <p className="text-xl font-bold text-blue-900">{event.registrations_count}</p>
                  </div>
                  <div className="flex-1 bg-emerald-50 rounded-lg p-2.5 border border-emerald-100">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-xs font-semibold text-emerald-700">Présents</span>
                    </div>
                    <p className="text-xl font-bold text-emerald-900">{event.attendance_count}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
          </div>
        </div>
      </div>
    </div>
  );
}
