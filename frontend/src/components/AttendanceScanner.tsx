import { useState, useEffect } from 'react';
import { CheckCircle, Search, ArrowLeft, X } from 'lucide-react';
import { events as eventsApi, registrations as registrationsApi, attendance as attendanceApi, gamification as gamificationApi } from '../lib/api';
import type { Database } from '../lib/database.types';
import { formatDate } from '../lib/utils';

type Event = Database['public']['Tables']['events']['Row'];
type Registration = Database['public']['Tables']['registrations']['Row'];

interface RegistrationWithAttendance extends Registration {
  has_attended: boolean;
}

interface AttendanceScannerProps {
  attendanceCode: string;
}

type ConfirmationStep = 'search' | 'select' | 'confirm';

export function AttendanceScanner({ attendanceCode }: AttendanceScannerProps) {
  const [event, setEvent] = useState<Event | null>(null);
  const [registrations, setRegistrations] = useState<RegistrationWithAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [confirmationStep, setConfirmationStep] = useState<ConfirmationStep>('search');
  const [filteredRegistrations, setFilteredRegistrations] = useState<RegistrationWithAttendance[]>([]);
  const [selectedRegistration, setSelectedRegistration] = useState<RegistrationWithAttendance | null>(null);

  useEffect(() => {
    loadEvent();
  }, [attendanceCode]);

  useEffect(() => {
    if (searchTerm && confirmationStep === 'select') {
      const filtered = registrations.filter(reg =>
        reg.last_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredRegistrations(filtered);
    } else {
      setFilteredRegistrations([]);
    }
  }, [searchTerm, registrations, confirmationStep]);

  async function loadEvent() {
    setLoading(true);

    try {
      const eventData = await eventsApi.getByAttendanceCode(attendanceCode);
      setEvent(eventData);
      await loadRegistrations(eventData.id);
    } catch (error) {
      console.error('Error loading event:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadRegistrations(eventId: number) {
    try {
      const regsData = await registrationsApi.getByEvent(eventId);
      const activeRegs = (regsData || []).filter(reg => !reg.cancelled);

      const regsWithAttendance = await Promise.all(
        activeRegs.map(async (reg: any) => {
          const attendanceData = await attendanceApi.getByRegistration(reg.id);
          return {
            ...reg,
            has_attended: !!attendanceData
          };
        })
      );

      // Sort by last name
      regsWithAttendance.sort((a, b) => a.last_name.localeCompare(b.last_name));

      setRegistrations(regsWithAttendance);
      setFilteredRegistrations(regsWithAttendance);
    } catch (error) {
      console.error('Error loading registrations:', error);
    }
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    setConfirmationStep('select');
  }

  function handleSelectRegistration(reg: RegistrationWithAttendance) {
    if (reg.has_attended) {
      setMessage({ type: 'error', text: 'Cette personne est déjà enregistrée comme présente' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }
    setSelectedRegistration(reg);
    setConfirmationStep('confirm');
  }

  function handleCancelConfirmation() {
    setSelectedRegistration(null);
    setConfirmationStep('search');
    setSearchTerm('');
    setFilteredRegistrations([]);
  }

  function handleBackToSelect() {
    setSelectedRegistration(null);
    setConfirmationStep('select');
  }

  async function confirmAttendance() {
    if (!selectedRegistration) return;

    try {
      // Check if already attended
      const existingAttendance = await attendanceApi.getByRegistration(selectedRegistration.id);

      if (existingAttendance) {
        setMessage({ type: 'error', text: 'Cette personne est déjà enregistrée comme présente' });
        setTimeout(() => setMessage(null), 3000);
        handleCancelConfirmation();
        return;
      }

      // Create attendance record
      await attendanceApi.create({ registration_id: selectedRegistration.id });

      // Get or create participant and award points
      try {
        const participant = await gamificationApi.getParticipant(selectedRegistration.email);
        if (participant) {
          await gamificationApi.awardAttendance(participant.id, selectedRegistration.id);
        }
      } catch (error) {
        console.error('Error awarding gamification points:', error);
        // Continue even if gamification fails
      }

      setMessage({ type: 'success', text: 'Présence enregistrée avec succès !' });
      setTimeout(() => setMessage(null), 5000);

      if (event) {
        await loadRegistrations(event.id);
      }

      handleCancelConfirmation();
    } catch (error) {
      console.error('Error marking attendance:', error);
      setMessage({ type: 'error', text: 'Erreur lors de l\'enregistrement' });
      setTimeout(() => setMessage(null), 3000);
      handleCancelConfirmation();
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Événement introuvable</h2>
          <p className="text-slate-600">Ce lien de présence n'est pas valide.</p>
        </div>
      </div>
    );
  }

  const presentCount = registrations.filter(r => r.has_attended).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-slate-100 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 -m-8 mb-6 p-8 rounded-t-2xl text-white">
            <h1 className="text-3xl font-bold mb-2">{event.title}</h1>
            <p className="text-emerald-50 mb-4">Suivi de présence</p>
            <div className="flex flex-wrap gap-4 text-sm text-emerald-50">
              <span>📅 {formatDate(event.event_date)}</span>
              {event.location && <span>📍 {event.location}</span>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-xl border border-blue-200">
              <p className="text-sm text-blue-700 font-semibold mb-1">Inscrits</p>
              <p className="text-4xl font-bold text-blue-900">{registrations.length}</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-5 rounded-xl border border-emerald-200">
              <p className="text-sm text-emerald-700 font-semibold mb-1">Présents</p>
              <p className="text-4xl font-bold text-emerald-900">{presentCount}</p>
            </div>
          </div>

          {message && (
            <div className={`p-4 rounded-xl mb-6 font-medium ${
              message.type === 'success'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}>
              {message.text}
            </div>
          )}

          {confirmationStep === 'search' && (
            <form onSubmit={handleSearchSubmit}>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Rechercher par nom de famille
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Entrez votre nom de famille"
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-8 py-3 rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all font-semibold shadow-md hover:shadow-lg"
                >
                  Rechercher
                </button>
              </div>
            </form>
          )}

          {confirmationStep === 'select' && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <button
                  onClick={handleCancelConfirmation}
                  className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-semibold"
                >
                  <ArrowLeft size={20} />
                  Retour
                </button>
                <h2 className="text-xl font-bold text-slate-900">
                  Résultats pour "{searchTerm}"
                </h2>
              </div>

              {filteredRegistrations.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-lg text-slate-600 mb-4">Aucun participant trouvé avec ce nom</p>
                  <button
                    onClick={handleCancelConfirmation}
                    className="text-emerald-600 hover:text-emerald-700 font-semibold"
                  >
                    Essayer une autre recherche
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-slate-600 mb-4">
                    {filteredRegistrations.length} participant{filteredRegistrations.length > 1 ? 's' : ''} trouvé{filteredRegistrations.length > 1 ? 's' : ''}. Cliquez sur votre nom :
                  </p>
                  {filteredRegistrations.map((reg) => (
                    <button
                      key={reg.id}
                      onClick={() => handleSelectRegistration(reg)}
                      disabled={reg.has_attended}
                      className={`w-full text-left p-5 rounded-xl border-2 transition-all ${
                        reg.has_attended
                          ? 'bg-slate-50 border-slate-200 cursor-not-allowed opacity-60'
                          : 'bg-white border-slate-200 hover:border-emerald-300 hover:shadow-md cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-bold text-slate-900 text-lg">
                            {reg.first_name.toUpperCase()} {reg.last_name.toUpperCase()}
                          </p>
                          {reg.company && (
                            <p className="text-sm text-slate-600 mt-1">{reg.company}</p>
                          )}
                          <p className="text-sm text-slate-500 mt-1">{reg.email}</p>
                        </div>
                        {reg.has_attended && (
                          <div className="flex items-center gap-2 text-emerald-600 font-semibold">
                            <CheckCircle size={24} />
                            <span>Déjà présent</span>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {confirmationStep === 'confirm' && selectedRegistration && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900">Confirmation de présence</h2>
                <button
                  onClick={handleCancelConfirmation}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-xl p-8 mb-6">
                <p className="text-sm text-emerald-700 font-semibold mb-4">
                  Êtes-vous cette personne ?
                </p>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-slate-900">
                    {selectedRegistration.first_name.toUpperCase()} {selectedRegistration.last_name.toUpperCase()}
                  </p>
                  {selectedRegistration.company && (
                    <p className="text-lg text-slate-700">
                      {selectedRegistration.company}
                    </p>
                  )}
                  <p className="text-slate-600">
                    {selectedRegistration.email}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleBackToSelect}
                  className="flex-1 px-6 py-4 bg-white border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-semibold"
                >
                  Non, ce n'est pas moi
                </button>
                <button
                  onClick={confirmAttendance}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all font-semibold shadow-lg hover:shadow-xl"
                >
                  Oui, confirmer ma présence
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
