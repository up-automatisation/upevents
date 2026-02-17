import { X, Mail, User, Calendar, CheckCircle, XCircle } from 'lucide-react';
import type { ParticipantDetail } from '../lib/statistics';

interface ParticipantDetailModalProps {
  participant: ParticipantDetail;
  onClose: () => void;
}

export function ParticipantDetailModal({ participant, onClose }: ParticipantDetailModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <User className="text-white" size={28} />
            <div>
              <h2 className="text-2xl font-bold text-white">
                {participant.firstName.toUpperCase()} {participant.lastName.toUpperCase()}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <Mail className="text-blue-200" size={16} />
                <p className="text-blue-100 text-sm">{participant.email}</p>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-blue-800 rounded-lg p-2 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-blue-600">
                {participant.totalRegistrations}
              </div>
              <div className="text-sm text-slate-600 mt-1">Inscriptions</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-green-600">
                {participant.totalAttendances}
              </div>
              <div className="text-sm text-slate-600 mt-1">Présences</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-orange-600">
                {participant.attendanceRate}%
              </div>
              <div className="text-sm text-slate-600 mt-1">Taux de présence</div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Calendar size={20} />
              Historique des événements
            </h3>

            {participant.events.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                Aucun événement trouvé
              </div>
            ) : (
              <div className="space-y-2">
                {participant.events.map((event) => (
                  <div
                    key={event.eventId}
                    className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900 mb-1">
                          {event.eventTitle}
                        </h4>
                        <p className="text-sm text-slate-600">
                          {new Date(event.eventDate).toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {event.attended ? (
                          <div className="flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                            <CheckCircle size={16} />
                            <span>Présent</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-sm font-semibold">
                            <XCircle size={16} />
                            <span>Absent</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-50 px-6 py-4 flex justify-end border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors font-medium"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
