import { useState, useEffect } from 'react';
import { CheckCircle, Calendar, MapPin, Coffee, List, ChevronDown, ChevronUp } from 'lucide-react';
import { events as eventsApi, customFields as customFieldsApi, programSlots as programSlotsApi, registrations as registrationsApi, registrationData as registrationDataApi } from '../lib/api';
import type { Database } from '../lib/database.types';
import { formatDateLong, formatTimeRange } from '../lib/utils';
import { AlertModal } from './Modal';

type Event = Database['public']['Tables']['events']['Row'];
type CustomField = Database['public']['Tables']['custom_fields']['Row'];
type ProgramSlot = Database['public']['Tables']['program_slots']['Row'];

interface RegisterFormProps {
  registrationCode: string;
}

export function RegisterForm({ registrationCode }: RegisterFormProps) {
  const [event, setEvent] = useState<Event | null>(null);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [programSlots, setProgramSlots] = useState<ProgramSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showProgram, setShowProgram] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [customFieldValues, setCustomFieldValues] = useState<Record<number, string>>({});
  const [alertConfig, setAlertConfig] = useState<{ isOpen: boolean; title: string; message: string; type: 'success' | 'error' | 'info' }>({ isOpen: false, title: '', message: '', type: 'info' });

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
    loadEvent();
  }, [registrationCode]);

  async function loadEvent() {
    setLoading(true);

    try {
      const eventData = await eventsApi.getByRegistrationCode(registrationCode);
      setEvent(eventData);

      const fieldsData = await customFieldsApi.getByEvent(eventData.id);
      setCustomFields(fieldsData || []);

      const slotsData = await programSlotsApi.getByEvent(eventData.id);
      setProgramSlots(slotsData || []);
    } catch (error) {
      console.error('Error loading event:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleCustomFieldChange(fieldId: number, value: string) {
    setCustomFieldValues({
      ...customFieldValues,
      [fieldId]: value
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!event) return;

    for (const field of customFields) {
      if (field.is_required && !customFieldValues[field.id]?.trim()) {
        setAlertConfig({ isOpen: true, title: 'Champ obligatoire', message: `Le champ "${field.field_name}" est obligatoire`, type: 'error' });
        return;
      }
    }

    setSubmitting(true);

    try {
      const registration = await registrationsApi.create({
        event_id: event.id,
        first_name: firstName,
        last_name: lastName,
        email,
        company
      });

      if (customFields.length > 0 && registration) {
        const dataToInsert = customFields.map(field => ({
          custom_field_id: field.id,
          value: customFieldValues[field.id] || ''
        }));

        await registrationDataApi.batchCreate(registration.id, dataToInsert);
      }

      setSuccess(true);
    } catch (error) {
      console.error('Error submitting registration:', error);
      setAlertConfig({ isOpen: true, title: 'Erreur', message: 'Erreur lors de l\'inscription. Veuillez réessayer.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Événement introuvable</h2>
          <p className="text-slate-600">Ce lien d'inscription n'est pas valide.</p>
        </div>
      </div>
    );
  }

  if (!event.is_active) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Inscriptions fermées</h2>
          <p className="text-slate-600">Les inscriptions pour cet événement sont actuellement fermées.</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-10 max-w-lg w-full">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full mb-6">
              <CheckCircle size={48} className="text-white" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Inscription confirmée !</h2>
            <p className="text-lg text-slate-700 mb-2">
              Merci <span className="font-semibold">{firstName.toUpperCase()} {lastName.toUpperCase()}</span>
            </p>
            <p className="text-slate-600 mb-6">
              Votre inscription à l'événement "<span className="font-semibold">{event.title}</span>" a été enregistrée avec succès.
            </p>

            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
              <p className="text-sm text-slate-600 mb-3">
                Un email de confirmation a été envoyé à
              </p>
              <p className="font-semibold text-blue-900 text-lg">{email}</p>
            </div>

            <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-6 space-y-3">
              <div className="flex items-center gap-3 text-slate-700">
                <Calendar size={20} className="text-blue-600" />
                <span className="text-sm font-medium capitalize">{formatDateLong(event.event_date)}</span>
              </div>
              {(event.start_time || event.end_time) && (
                <div className="flex items-center gap-3 text-slate-700">
                  <span className="text-blue-600">🕐</span>
                  <span className="text-sm font-medium">{formatTimeRange(event.start_time, event.end_time)}</span>
                </div>
              )}
              {event.location && (
                <div className="flex items-center gap-3 text-slate-700">
                  <MapPin size={20} className="text-blue-600" />
                  <span className="text-sm font-medium">{event.location}</span>
                </div>
              )}
            </div>

            <p className="text-sm text-slate-500 mt-6">
              Nous avons hâte de vous voir à l'événement !
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-slate-100 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-8 text-white">
            <h1 className="text-3xl font-bold mb-2">{event.title}</h1>
            {event.description && (
              <p className="text-blue-50 mb-4">{event.description}</p>
            )}
            <div className="flex flex-wrap gap-4 text-sm text-blue-50 font-medium">
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

          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Prénom *
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Nom *
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Entreprise
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {customFields.map((field) => (
              <div key={field.id}>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  {field.field_name} {field.is_required && '*'}
                </label>
                {field.field_type === 'textarea' ? (
                  <textarea
                    value={customFieldValues[field.id] || ''}
                    onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required={field.is_required}
                  />
                ) : (
                  <input
                    type={field.field_type}
                    value={customFieldValues[field.id] || ''}
                    onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required={field.is_required}
                  />
                )}
              </div>
            ))}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-4 rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all font-semibold text-lg shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Inscription en cours...' : 'S\'inscrire'}
            </button>
          </form>

          {programSlots.length > 0 && (
            <div className="border-t-2 border-slate-200">
              <button
                type="button"
                onClick={() => setShowProgram(!showProgram)}
                className="w-full flex items-center justify-between p-6 hover:bg-slate-50 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                    <List size={20} className="text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-blue-600">
                    Programme de l'événement
                  </h3>
                </div>
                <div className="text-violet-600">
                  {showProgram ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                </div>
              </button>

              {showProgram && (
                <div className="bg-gradient-to-br from-slate-50 to-blue-50 p-8 border-t border-slate-200">
                  <div className="space-y-4">
                    {programSlots.map((slot) => (
                      <div
                        key={slot.id}
                        className={`flex transition-all hover:transform hover:-translate-y-1 ${
                          slot.is_break
                            ? 'bg-amber-50 p-4 rounded-xl border-l-4 border-amber-500'
                            : 'bg-white p-4 rounded-xl shadow-lg border-l-4 border-blue-500'
                        }`}
                      >
                        <div className="min-w-[90px] pr-4 border-r-2 border-slate-200">
                          <div className={`text-lg font-bold ${slot.is_break ? 'text-amber-600' : 'text-blue-600'}`}>
                            {formatTime(slot.start_time)}
                          </div>
                          <div className={`text-lg font-bold ${slot.is_break ? 'text-amber-600' : 'text-blue-600'}`}>
                            {formatTime(slot.end_time)}
                          </div>
                        </div>
                        <div className="flex-1 pl-4">
                          <h4 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
                            {slot.is_break && <Coffee size={18} className="text-amber-600" />}
                            {slot.title}
                          </h4>
                          {slot.description && (
                            <p className="text-slate-600 text-sm leading-relaxed mb-2">
                              {slot.description}
                            </p>
                          )}
                          {slot.objective && (
                            <div className="text-xs text-green-800 bg-green-50 border-l-4 border-green-500 rounded-r-lg px-3 py-2 mb-2">
                              <p className="font-semibold flex items-center gap-1 mb-1">
                                <span>🎯</span>
                                <span>Objectif :</span>
                              </p>
                              <p className="leading-relaxed">{slot.objective}</p>
                            </div>
                          )}
                          {slot.speaker && (
                            <p className="text-purple-600 italic font-medium text-xs">
                              Intervenant : {slot.speaker}
                            </p>
                          )}
                          <span className={`inline-block mt-2 px-2 py-1 rounded-full text-xs font-semibold text-white ${
                            slot.is_break ? 'bg-amber-500' : 'bg-blue-600'
                          }`}>
                            {calculateDuration(slot.start_time, slot.end_time)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <AlertModal
        isOpen={alertConfig.isOpen}
        onClose={() => setAlertConfig({ ...alertConfig, isOpen: false })}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
      />
    </div>
  );
}
