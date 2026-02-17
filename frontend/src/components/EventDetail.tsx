import { useState, useEffect } from 'react';
import { QrCode, Users, CheckCircle, XCircle, Plus, Trash2, Link as LinkIcon, Edit, Archive, List, Coffee } from 'lucide-react';
import { events as eventsApi, registrations as registrationsApi, categories as categoriesApi, programSlots as programSlotsApi, attendance as attendanceApi } from '../lib/api';
import type { Database } from '../lib/database.types';
import { formatDate, formatDateLong, formatTimeRange, generateQRCodeUrl } from '../lib/utils';
import { TimeRangePicker } from './TimeRangePicker';
import { useNavigate } from '../App';
import { AlertModal, ConfirmModal } from './Modal';

type Event = Database['public']['Tables']['events']['Row'];
type Registration = Database['public']['Tables']['registrations']['Row'];
type ProgramSlot = Database['public']['Tables']['program_slots']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];

interface RegistrationWithAttendance extends Registration {
  has_attended: boolean;
}

interface EventDetailProps {
  eventId: number;
}

export function EventDetail({ eventId }: EventDetailProps) {
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [registrations, setRegistrations] = useState<RegistrationWithAttendance[]>([]);
  const [programSlots, setProgramSlots] = useState<ProgramSlot[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrType, setQrType] = useState<'registration' | 'attendance'>('registration');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleteError, setDeleteError] = useState('');

  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newCompany, setNewCompany] = useState('');

  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editEventDate, setEditEventDate] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [editCategoryId, setEditCategoryId] = useState<number | null>(null);
  const [showProgram, setShowProgram] = useState(false);
  const [showRegistrationPreview, setShowRegistrationPreview] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{ isOpen: boolean; title: string; message: string; type: 'success' | 'error' | 'info' }>({ isOpen: false, title: '', message: '', type: 'info' });
  const [confirmCancelRegistration, setConfirmCancelRegistration] = useState<{ isOpen: boolean; regId: number }>({ isOpen: false, regId: -1 });
  const [confirmCloseEvent, setConfirmCloseEvent] = useState(false);

  function formatTime(time: string) {
    return time.substring(0, 5);
  }

  function calculateDuration(start: string, end: string) {
    const startMinutes = parseInt(start.split(':')[0]) * 60 + parseInt(start.split(':')[1]);
    const endMinutes = parseInt(end.split(':')[0]) * 60 + parseInt(end.split(':')[1]);
    const diff = endMinutes - startMinutes;
    return `${diff} minutes`;
  }

  useEffect(() => {
    loadEventData();
    loadCategories();
  }, [eventId]);

  async function loadCategories() {
    try {
      const data = await categoriesApi.getAll();
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }

  async function loadEventData() {
    setLoading(true);

    try {
      const eventData = await eventsApi.getById(eventId);
      if (!eventData) {
        console.error('Event not found');
        navigate('');
        return;
      }

      setEvent(eventData);

      const regsData = await registrationsApi.getByEvent(eventId);
      const regsWithAttendance = regsData.map(reg => ({
        ...reg,
        has_attended: reg.has_attended || false
      }));

      setRegistrations(regsWithAttendance);

      const slotsData = await programSlotsApi.getByEvent(eventId);
      setProgramSlots(slotsData || []);
    } catch (error) {
      console.error('Error loading event data:', error);
      navigate('');
    }

    setLoading(false);
  }

  async function toggleEventStatus() {
    if (!event) return;

    try {
      const updatedEvent = await eventsApi.toggleStatus(event.id);
      setEvent(updatedEvent);
    } catch (error) {
      console.error('Error updating event:', error);
    }
  }

  function cancelRegistration(regId: number) {
    setConfirmCancelRegistration({ isOpen: true, regId });
  }

  async function confirmCancelRegistrationAction() {
    try {
      await registrationsApi.cancel(confirmCancelRegistration.regId);
      setConfirmCancelRegistration({ isOpen: false, regId: -1 });
      loadEventData();
    } catch (error) {
      console.error('Error cancelling registration:', error);
      setAlertConfig({ isOpen: true, title: 'Erreur', message: 'Erreur lors de l\'annulation de l\'inscription', type: 'error' });
    }
  }

  async function toggleAttendance(regId: number, currentlyAttended: boolean) {
    try {
      if (currentlyAttended) {
        await attendanceApi.delete(regId);
      } else {
        await attendanceApi.create({ registration_id: regId });
      }
      loadEventData();
    } catch (error) {
      console.error('Error toggling attendance:', error);
    }
  }

  async function addManualRegistration() {
    if (!event || !newFirstName || !newLastName || !newEmail) return;

    try {
      await registrationsApi.create({
        event_id: event.id,
        first_name: newFirstName,
        last_name: newLastName,
        email: newEmail,
        company: newCompany
      });

      setNewFirstName('');
      setNewLastName('');
      setNewEmail('');
      setNewCompany('');
      setShowAddModal(false);
      loadEventData();
    } catch (error) {
      console.error('Error adding registration:', error);
      setAlertConfig({ isOpen: true, title: 'Erreur', message: 'Erreur lors de l\'ajout du participant', type: 'error' });
    }
  }

  function copyRegistrationLink() {
    if (!event) return;
    const link = `${window.location.origin}${window.location.pathname}#register/${event.registration_code}`;
    navigator.clipboard.writeText(link);
    setAlertConfig({ isOpen: true, title: 'Lien copié', message: 'Le lien d\'inscription a été copié dans le presse-papiers', type: 'success' });
  }

  function copyAttendanceLink() {
    if (!event) return;
    const link = `${window.location.origin}${window.location.pathname}#attendance/${event.attendance_code}`;
    navigator.clipboard.writeText(link);
    setAlertConfig({ isOpen: true, title: 'Lien copié', message: 'Le lien de présence a été copié dans le presse-papiers', type: 'success' });
  }

  function openEditModal() {
    if (!event) return;
    setEditTitle(event.title);
    setEditDescription(event.description || '');
    setEditLocation(event.location || '');
    const date = new Date(event.event_date);
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    setEditEventDate(localDate.toISOString().slice(0, 10));
    setEditStartTime(event.start_time || '');
    setEditEndTime(event.end_time || '');
    setEditCategoryId(event.category_id || null);
    setShowEditModal(true);
  }

  async function saveEventChanges() {
    if (!event || !editTitle || !editEventDate) return;

    try {
      await eventsApi.update(event.id, {
        title: editTitle,
        description: editDescription,
        location: editLocation,
        event_date: new Date(editEventDate).toISOString(),
        start_time: editStartTime || null,
        end_time: editEndTime || null,
        category_id: editCategoryId || null
      });

      setShowEditModal(false);
      loadEventData();
    } catch (error) {
      console.error('Error updating event:', error);
      setAlertConfig({ isOpen: true, title: 'Erreur', message: 'Erreur lors de la modification de l\'événement', type: 'error' });
    }
  }

  function closeEvent() {
    setConfirmCloseEvent(true);
  }

  async function confirmCloseEventAction() {
    if (!event) return;
    setConfirmCloseEvent(false);
    try {
      const updatedEvent = await eventsApi.close(event.id);
      setEvent(updatedEvent);
    } catch (error) {
      console.error('Error closing event:', error);
      setAlertConfig({ isOpen: true, title: 'Erreur', message: 'Erreur lors de la clôture de l\'événement', type: 'error' });
    }
  }

  async function reopenEvent() {
    if (!event) return;

    try {
      const updatedEvent = await eventsApi.update(event.id, { is_closed: false });
      setEvent(updatedEvent);
    } catch (error) {
      console.error('Error reopening event:', error);
      setAlertConfig({ isOpen: true, title: 'Erreur', message: 'Erreur lors de la réouverture de l\'événement', type: 'error' });
    }
  }

  async function deleteEvent() {
    if (!event || deleteConfirmation !== 'SUPPRIMER') return;

    setDeleteError('');

    try {
      await eventsApi.delete(event.id);
      navigate('');
    } catch (error: any) {
      console.error('Error deleting event:', error);
      setDeleteError(`Erreur: ${error.message || 'Impossible de supprimer l\'événement'}`);
    }
  }

  function openDeleteModal() {
    setDeleteConfirmation('');
    setDeleteError('');
    setShowDeleteModal(true);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!event) return null;

  const activeRegistrations = registrations.filter(r => !r.cancelled);
  const attendanceCount = activeRegistrations.filter(r => r.has_attended).length;
  const registrationUrl = `${window.location.origin}${window.location.pathname}#register/${event.registration_code}`;

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-slate-900">{event.title}</h1>
                {event.is_closed && (
                  <span className="px-4 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-slate-400 to-slate-500 text-white">
                    Clôturé
                  </span>
                )}
              </div>
              <p className="text-lg text-slate-600">{event.description}</p>
              <div className="flex flex-wrap gap-6 mt-4 text-base text-slate-700 font-medium">
                <span className="flex items-center gap-2">
                  <span className="text-2xl">📅</span>
                  <span className="capitalize">{formatDateLong(event.event_date)}</span>
                </span>
                {(event.start_time || event.end_time) && (
                  <span className="flex items-center gap-2">
                    <span className="text-2xl">🕐</span>
                    <span>{formatTimeRange(event.start_time, event.end_time)}</span>
                  </span>
                )}
                {event.location && (
                  <span className="flex items-center gap-2">
                    <span className="text-2xl">📍</span>
                    <span>{event.location}</span>
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={openEditModal}
                className="group relative p-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700 hover:scale-110 transition-all shadow-md hover:shadow-lg"
                title="Modifier l'événement"
              >
                <Edit size={20} />
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  Modifier
                </span>
              </button>

              <div className="h-10 w-px bg-slate-300"></div>

              <button
                onClick={toggleEventStatus}
                className={`group relative p-3 rounded-xl font-semibold transition-all shadow-md hover:scale-110 ${
                  event.is_active
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700'
                    : 'bg-gradient-to-r from-slate-200 to-slate-300 text-slate-700 hover:from-slate-300 hover:to-slate-400'
                }`}
                title={event.is_active ? 'Actif' : 'Inactif'}
              >
                <CheckCircle size={20} />
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  {event.is_active ? 'Actif' : 'Inactif'}
                </span>
              </button>
              {event.is_closed ? (
                <button
                  onClick={reopenEvent}
                  className="group relative p-3 rounded-xl font-semibold bg-gradient-to-r from-emerald-600 to-emerald-700 text-white hover:from-emerald-700 hover:to-emerald-800 hover:scale-110 transition-all shadow-md hover:shadow-lg"
                  title="Réouvrir"
                >
                  <Archive size={20} />
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    Réouvrir
                  </span>
                </button>
              ) : (
                <button
                  onClick={closeEvent}
                  className="group relative p-3 rounded-xl font-semibold bg-gradient-to-r from-orange-600 to-red-600 text-white hover:from-orange-700 hover:to-red-700 hover:scale-110 transition-all shadow-md hover:shadow-lg"
                  title="Clôturer"
                >
                  <Archive size={20} />
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    Clôturer
                  </span>
                </button>
              )}
              {!event.is_active && (
                <button
                  onClick={openDeleteModal}
                  className="group relative p-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 hover:scale-110 transition-all shadow-md hover:shadow-lg"
                  title="Supprimer l'événement"
                >
                  <Trash2 size={20} />
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    Supprimer
                  </span>
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mb-6">
            <div className="group relative flex-1 min-w-[160px] bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-blue-100 mb-1">
                    <Users size={18} className="animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider">Inscrits</span>
                  </div>
                  <p className="text-3xl font-black text-white">{activeRegistrations.length}</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <Users size={24} className="text-white" />
                </div>
              </div>
            </div>

            <div className="group relative flex-1 min-w-[160px] bg-gradient-to-br from-emerald-500 to-emerald-600 p-4 rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-emerald-100 mb-1">
                    <CheckCircle size={18} className="animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider">Présents</span>
                  </div>
                  <p className="text-3xl font-black text-white">{attendanceCount}</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <CheckCircle size={24} className="text-white" />
                </div>
              </div>
            </div>

            <div className="group relative flex-1 min-w-[160px] bg-gradient-to-br from-orange-500 to-orange-600 p-4 rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-orange-100 mb-1">
                    <XCircle size={18} className="animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider">Absents</span>
                  </div>
                  <p className="text-3xl font-black text-white">
                    {activeRegistrations.length - attendanceCount}
                  </p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <XCircle size={24} className="text-white" />
                </div>
              </div>
            </div>
          </div>

          {event.is_active && (
            <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
              <button
                onClick={copyRegistrationLink}
                className="group relative p-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 hover:scale-110 transition-all shadow-md hover:shadow-lg"
                title="Lien inscription"
              >
                <LinkIcon size={20} />
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  Lien inscription
                </span>
              </button>
              <button
                onClick={() => { setQrType('registration'); setShowQRModal(true); }}
                className="group relative p-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 hover:scale-110 transition-all shadow-md hover:shadow-lg"
                title="QR Inscription"
              >
                <QrCode size={20} />
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  QR Inscription
                </span>
              </button>
              <button
                onClick={copyAttendanceLink}
                className="group relative p-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl hover:from-emerald-700 hover:to-emerald-800 hover:scale-110 transition-all shadow-md hover:shadow-lg"
                title="Lien présence"
              >
                <LinkIcon size={20} />
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  Lien présence
                </span>
              </button>
              <button
                onClick={() => { setQrType('attendance'); setShowQRModal(true); }}
                className="group relative p-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl hover:from-emerald-700 hover:to-emerald-800 hover:scale-110 transition-all shadow-md hover:shadow-lg"
                title="QR Présence"
              >
                <QrCode size={20} />
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  QR Présence
                </span>
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="group relative p-3 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-xl hover:from-orange-700 hover:to-orange-800 hover:scale-110 transition-all shadow-md hover:shadow-lg"
                title="Ajouter participant"
              >
                <Plus size={20} />
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  Ajouter participant
                </span>
              </button>
            </div>
          )}

          {programSlots.length > 0 ? (
            <div className="mb-6 bg-gradient-to-br from-violet-50 via-blue-50 to-cyan-50 p-6 rounded-2xl border-2 border-violet-200 shadow-md">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                    <List size={20} className="text-white" />
                  </div>
                  <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-blue-600">
                    Programme
                  </h3>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => navigate(`program/${event.id}`)}
                    className="px-4 py-2 bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-xl hover:from-violet-700 hover:to-blue-700 transition-all font-semibold text-sm shadow-md hover:shadow-lg flex items-center gap-2"
                  >
                    <Edit size={16} />
                    Modifier
                  </button>
                  <label className="flex items-center gap-2 cursor-pointer bg-white/70 backdrop-blur-sm px-4 py-2 rounded-xl border-2 border-violet-300 hover:bg-white/90 transition-all shadow-sm">
                    <input
                      type="checkbox"
                      checked={showProgram}
                      onChange={(e) => setShowProgram(e.target.checked)}
                      className="w-5 h-5 text-violet-600 border-violet-300 rounded focus:ring-violet-500"
                    />
                    <span className="text-sm font-bold text-violet-700">Afficher</span>
                  </label>
                </div>
              </div>
              {showProgram && (
                <div className="space-y-6">
                  {programSlots.map((slot) => (
                    <div
                      key={slot.id}
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
          ) : (
            <div className="mb-6 bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-2xl border-2 border-slate-200 shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-slate-400 to-slate-500 rounded-xl flex items-center justify-center shadow-lg">
                    <List size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Programme</h3>
                    <p className="text-sm text-slate-600">Aucun programme défini pour cet événement</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`program/${event.id}`)}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all font-semibold text-sm shadow-md hover:shadow-lg flex items-center gap-2"
                >
                  <Plus size={16} />
                  Créer le programme
                </button>
              </div>
            </div>
          )}

          <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-700">Aperçu de la page d'inscription</h3>
              <label className="flex items-center gap-2 cursor-pointer bg-white px-4 py-2 rounded-xl border-2 border-slate-300 hover:bg-slate-50 transition-all shadow-sm">
                <input
                  type="checkbox"
                  checked={showRegistrationPreview}
                  onChange={(e) => setShowRegistrationPreview(e.target.checked)}
                  className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-bold text-slate-700">Afficher</span>
              </label>
            </div>
            {showRegistrationPreview && (
            <div className="bg-white rounded-xl shadow-md overflow-hidden border border-slate-200">
              <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6 text-white">
                <h2 className="text-2xl font-bold mb-2">{event.title}</h2>
                {event.description && (
                  <p className="text-blue-50 mb-3 text-sm">{event.description}</p>
                )}
                <div className="flex flex-wrap gap-4 text-sm text-blue-50">
                  <span className="flex items-center gap-2">
                    <span>📅</span>
                    <span className="capitalize">{formatDateLong(event.event_date)}</span>
                  </span>
                  {(event.start_time || event.end_time) && (
                    <span className="flex items-center gap-2">
                      <span>🕐</span>
                      <span>{formatTimeRange(event.start_time, event.end_time)}</span>
                    </span>
                  )}
                  {event.location && (
                    <span className="flex items-center gap-2">
                      <span>📍</span>
                      <span>{event.location}</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Prénom *
                    </label>
                    <div className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-slate-50">
                      <span className="text-slate-400 text-sm">Prénom du participant</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Nom *
                    </label>
                    <div className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-slate-50">
                      <span className="text-slate-400 text-sm">Nom du participant</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Email *
                  </label>
                  <div className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-slate-50">
                    <span className="text-slate-400 text-sm">email@example.com</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Entreprise
                  </label>
                  <div className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-slate-50">
                    <span className="text-slate-400 text-sm">Nom de l'entreprise</span>
                  </div>
                </div>

                <div className="pt-2">
                  <div className={`w-full text-white py-4 rounded-xl text-center font-semibold ${
                    event.is_active
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 cursor-pointer hover:from-blue-700 hover:to-cyan-700'
                      : 'bg-gradient-to-r from-slate-300 to-slate-400 cursor-not-allowed opacity-60'
                  }`}>
                    S'inscrire
                  </div>
                </div>
              </div>
            </div>
            )}
            {!event.is_active && (
              <p className="text-sm text-slate-600 mt-4 text-center">
                Les inscriptions sont actuellement fermées. Activez l'événement pour permettre aux participants de s'inscrire.
              </p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Participants</h2>

          {activeRegistrations.length === 0 ? (
            <p className="text-center text-slate-600 py-12 text-lg">Aucune inscription pour le moment</p>
          ) : (
            <div className="overflow-hidden">
              <table className="w-full table-fixed">
                <thead>
                  <tr className="border-b-2 border-slate-200">
                    <th className="text-left py-3 px-2 font-bold text-slate-700 text-sm w-[22%]">Nom</th>
                    <th className="text-left py-3 px-2 font-bold text-slate-700 text-sm w-[26%]">Email</th>
                    <th className="text-left py-3 px-2 font-bold text-slate-700 text-sm w-[18%]">Entreprise</th>
                    <th className="text-left py-3 px-2 font-bold text-slate-700 text-sm w-[14%]">Date</th>
                    <th className="text-center py-3 px-2 font-bold text-slate-700 text-sm w-[10%]">Présence</th>
                    <th className="text-center py-3 px-2 font-bold text-slate-700 text-sm w-[10%]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activeRegistrations.map((reg) => (
                    <tr key={reg.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-2 px-2 font-medium text-slate-900 text-sm truncate">
                        {reg.first_name.toUpperCase()} {reg.last_name.toUpperCase()}
                      </td>
                      <td className="py-2 px-2 text-slate-600 text-sm truncate">{reg.email}</td>
                      <td className="py-2 px-2 text-slate-600 text-sm truncate">{reg.company || '-'}</td>
                      <td className="py-2 px-2 text-slate-600 text-xs">
                        {formatDate(reg.registered_at)}
                      </td>
                      <td className="py-2 px-2 text-center">
                        <button
                          onClick={() => toggleAttendance(reg.id, reg.has_attended)}
                          className={`group relative mx-auto flex items-center justify-center p-1.5 rounded-lg transition-all ${
                            reg.has_attended
                              ? 'text-emerald-600 hover:bg-emerald-50 hover:scale-110'
                              : 'text-slate-400 hover:bg-slate-100 hover:scale-110'
                          }`}
                          title={reg.has_attended ? 'Marquer absent' : 'Marquer présent'}
                        >
                          {reg.has_attended ? (
                            <CheckCircle size={18} />
                          ) : (
                            <XCircle size={18} />
                          )}
                          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                            {reg.has_attended ? 'Marquer absent' : 'Marquer présent'}
                          </span>
                        </button>
                      </td>
                      <td className="py-2 px-2 text-center">
                        <button
                          onClick={() => cancelRegistration(reg.id)}
                          className="group relative mx-auto flex items-center justify-center text-red-600 hover:text-red-800 hover:bg-red-50 hover:scale-110 p-1.5 rounded-lg transition-all"
                          title="Annuler l'inscription"
                        >
                          <Trash2 size={16} />
                          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                            Annuler inscription
                          </span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showQRModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-bold text-slate-900 mb-6">
              {qrType === 'registration' ? 'QR Code Inscription' : 'QR Code Présence'}
            </h3>
            <div className="flex flex-col items-center">
              <div className="bg-white p-4 rounded-xl border-2 border-slate-200 mb-6">
                <img
                  src={generateQRCodeUrl(
                    qrType === 'registration'
                      ? registrationUrl
                      : `${window.location.origin}${window.location.pathname}#attendance/${event.attendance_code}`
                  )}
                  alt="QR Code"
                  className="w-64 h-64"
                />
              </div>
              <p className="text-sm text-slate-600 text-center mb-6">
                {qrType === 'registration'
                  ? 'Scannez ce QR code pour accéder au formulaire d\'inscription'
                  : 'Scannez ce QR code le jour de l\'événement pour marquer votre présence'}
              </p>
              <button
                onClick={() => setShowQRModal(false)}
                className="bg-gradient-to-r from-slate-700 to-slate-800 text-white px-8 py-3 rounded-xl hover:from-slate-800 hover:to-slate-900 transition-all font-semibold shadow-md hover:shadow-lg"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-bold text-slate-900 mb-6">Ajouter un participant</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Prénom *"
                value={newFirstName}
                onChange={(e) => setNewFirstName(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <input
                type="text"
                placeholder="Nom *"
                value={newLastName}
                onChange={(e) => setNewLastName(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <input
                type="email"
                placeholder="Email *"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <input
                type="text"
                placeholder="Entreprise"
                value={newCompany}
                onChange={(e) => setNewCompany(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-3 border-2 border-slate-300 rounded-xl hover:bg-slate-50 transition-all font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={addManualRegistration}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-semibold shadow-md hover:shadow-lg"
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
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-slate-900 mb-6">Modifier l'événement</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Titre de l'événement *
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Description
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
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
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Catégorie
                </label>
                <select
                  value={editCategoryId ?? ''}
                  onChange={(e) => setEditCategoryId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                >
                  <option value="">Sans catégorie</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Date de l'événement *
                </label>
                <input
                  type="date"
                  value={editEventDate}
                  onChange={(e) => setEditEventDate(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              <TimeRangePicker
                startTime={editStartTime}
                endTime={editEndTime}
                onStartTimeChange={setEditStartTime}
                onEndTimeChange={setEditEndTime}
              />

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-3 border-2 border-slate-300 rounded-xl hover:bg-slate-50 transition-all font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={saveEventChanges}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all font-semibold shadow-md hover:shadow-lg"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-bold text-red-600 mb-4">Supprimer l'événement</h3>
            <p className="text-slate-700 mb-6">
              Cette action est irréversible. Tous les participants et les données associées seront supprimés.
            </p>
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6">
              <p className="text-sm font-semibold text-red-900 mb-3">
                Pour confirmer, veuillez taper le mot <span className="font-bold">SUPPRIMER</span> ci-dessous :
              </p>
              <input
                type="text"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                className="w-full px-4 py-3 border-2 border-red-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all font-semibold"
                placeholder="SUPPRIMER"
              />
            </div>
            {deleteError && (
              <div className="bg-red-100 border-2 border-red-400 rounded-xl p-4 mb-4">
                <p className="text-sm text-red-800 font-medium">{deleteError}</p>
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-3 border-2 border-slate-300 rounded-xl hover:bg-slate-50 transition-all font-medium"
              >
                Annuler
              </button>
              <button
                onClick={deleteEvent}
                disabled={deleteConfirmation !== 'SUPPRIMER'}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all font-semibold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Supprimer définitivement
              </button>
            </div>
          </div>
        </div>
      )}

      <AlertModal
        isOpen={alertConfig.isOpen}
        onClose={() => setAlertConfig({ ...alertConfig, isOpen: false })}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
      />

      <ConfirmModal
        isOpen={confirmCancelRegistration.isOpen}
        onClose={() => setConfirmCancelRegistration({ isOpen: false, regId: -1 })}
        onConfirm={confirmCancelRegistrationAction}
        title="Annuler l'inscription"
        message="Voulez-vous vraiment annuler cette inscription ?"
        confirmText="Annuler l'inscription"
        variant="danger"
      />

      <ConfirmModal
        isOpen={confirmCloseEvent}
        onClose={() => setConfirmCloseEvent(false)}
        onConfirm={confirmCloseEventAction}
        title="Clôturer l'événement"
        message="Voulez-vous vraiment clôturer cet événement ? Il ne sera plus visible dans la liste principale."
        confirmText="Clôturer"
        variant="warning"
      />
    </div>
  );
}
