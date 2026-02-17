import { useState, useEffect } from 'react';
import { BarChart3, Users, TrendingUp, Calendar, UserCheck, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { getEventStatistics, getParticipantStatistics, getParticipantDetails } from '../lib/statistics';
import type { EventStats, ParticipantStats, ParticipantDetail } from '../lib/statistics';
import { ParticipantDetailModal } from './ParticipantDetailModal';

type SortField = 'name' | 'email' | 'registrations' | 'attendances' | 'rate';
type SortDirection = 'asc' | 'desc';

export function Leaderboard() {
  const [eventStats, setEventStats] = useState<EventStats | null>(null);
  const [participantStats, setParticipantStats] = useState<ParticipantStats[]>([]);
  const [sortedStats, setSortedStats] = useState<ParticipantStats[]>([]);
  const [sortField, setSortField] = useState<SortField>('registrations');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedParticipant, setSelectedParticipant] = useState<ParticipantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    loadStatistics();
  }, []);

  useEffect(() => {
    sortParticipants();
  }, [participantStats, sortField, sortDirection]);

  async function loadStatistics() {
    setLoading(true);
    const [events, participants] = await Promise.all([
      getEventStatistics(),
      getParticipantStatistics(),
    ]);
    setEventStats(events);
    setParticipantStats(participants);
    setLoading(false);
  }

  function sortParticipants() {
    const sorted = [...participantStats].sort((a, b) => {
      let compareValue = 0;

      switch (sortField) {
        case 'name':
          compareValue = `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
          break;
        case 'email':
          compareValue = a.email.localeCompare(b.email);
          break;
        case 'registrations':
          compareValue = a.totalRegistrations - b.totalRegistrations;
          break;
        case 'attendances':
          compareValue = a.totalAttendances - b.totalAttendances;
          break;
        case 'rate':
          compareValue = a.attendanceRate - b.attendanceRate;
          break;
      }

      return sortDirection === 'asc' ? compareValue : -compareValue;
    });

    setSortedStats(sorted);
  }

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  }

  async function handleParticipantClick(email: string) {
    setLoadingDetail(true);
    const details = await getParticipantDetails(email);
    if (details) {
      setSelectedParticipant(details);
    }
    setLoadingDetail(false);
  }

  function getSortIcon(field: SortField) {
    if (sortField !== field) {
      return <ArrowUpDown size={16} className="text-slate-400" />;
    }
    return sortDirection === 'asc'
      ? <ArrowUp size={16} className="text-blue-600" />
      : <ArrowDown size={16} className="text-blue-600" />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Statistiques</h1>
          <p className="text-lg text-slate-600">Vue d'ensemble des événements et participants</p>
        </div>

        {eventStats && (
          <>
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="text-blue-600" size={24} />
                <h2 className="text-2xl font-bold text-slate-900">Statistiques des événements</h2>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 mb-4">
                <div className="flex items-center gap-4 mb-4">
                  <BarChart3 className="text-blue-600" size={28} />
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Total d'événements</h3>
                    <p className="text-3xl font-bold text-blue-600">{eventStats.totalEvents}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="text-green-600" size={24} />
                    <h3 className="text-lg font-bold text-slate-900">Inscrits par événement</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Maximum</span>
                      <span className="text-2xl font-bold text-green-600">{eventStats.registrations.max}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Minimum</span>
                      <span className="text-2xl font-bold text-slate-700">{eventStats.registrations.min}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Moyenne</span>
                      <span className="text-2xl font-bold text-blue-600">{eventStats.registrations.average}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <UserCheck className="text-orange-600" size={24} />
                    <h3 className="text-lg font-bold text-slate-900">Présents par événement</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Maximum</span>
                      <span className="text-2xl font-bold text-green-600">{eventStats.attendance.max}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Minimum</span>
                      <span className="text-2xl font-bold text-slate-700">{eventStats.attendance.min}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Moyenne</span>
                      <span className="text-2xl font-bold text-blue-600">{eventStats.attendance.average}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="text-green-600" size={24} />
                <h2 className="text-2xl font-bold text-slate-900">Statistiques des participants</h2>
              </div>

              {participantStats.length === 0 ? (
                <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                  <Users size={48} className="mx-auto text-slate-300 mb-4" />
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">Aucun participant</h3>
                  <p className="text-slate-600">Les statistiques apparaîtront après les premières inscriptions</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-100 border-b border-slate-200">
                        <tr>
                          <th
                            className="px-6 py-4 text-left text-sm font-bold text-slate-700 cursor-pointer hover:bg-slate-200 transition-colors select-none"
                            onClick={() => handleSort('name')}
                          >
                            <div className="flex items-center gap-2">
                              <span>Participant</span>
                              {getSortIcon('name')}
                            </div>
                          </th>
                          <th
                            className="px-6 py-4 text-left text-sm font-bold text-slate-700 cursor-pointer hover:bg-slate-200 transition-colors select-none"
                            onClick={() => handleSort('email')}
                          >
                            <div className="flex items-center gap-2">
                              <span>Email</span>
                              {getSortIcon('email')}
                            </div>
                          </th>
                          <th
                            className="px-6 py-4 text-center text-sm font-bold text-slate-700 cursor-pointer hover:bg-slate-200 transition-colors select-none"
                            onClick={() => handleSort('registrations')}
                          >
                            <div className="flex items-center justify-center gap-2">
                              <span>Inscriptions</span>
                              {getSortIcon('registrations')}
                            </div>
                          </th>
                          <th
                            className="px-6 py-4 text-center text-sm font-bold text-slate-700 cursor-pointer hover:bg-slate-200 transition-colors select-none"
                            onClick={() => handleSort('attendances')}
                          >
                            <div className="flex items-center justify-center gap-2">
                              <span>Présences</span>
                              {getSortIcon('attendances')}
                            </div>
                          </th>
                          <th
                            className="px-6 py-4 text-center text-sm font-bold text-slate-700 cursor-pointer hover:bg-slate-200 transition-colors select-none"
                            onClick={() => handleSort('rate')}
                          >
                            <div className="flex items-center justify-center gap-2">
                              <span>Taux de présence</span>
                              {getSortIcon('rate')}
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {sortedStats.map((participant, index) => (
                          <tr
                            key={participant.email}
                            className={`${
                              index % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                            } hover:bg-blue-50 cursor-pointer transition-colors`}
                            onClick={() => handleParticipantClick(participant.email)}
                          >
                            <td className="px-6 py-4">
                              <div className="font-semibold text-slate-900">
                                {participant.firstName.toUpperCase()} {participant.lastName.toUpperCase()}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-slate-600 text-sm">
                              {participant.email}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm">
                                {participant.totalRegistrations}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-green-100 text-green-700 font-semibold text-sm">
                                {participant.totalAttendances}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <div className="w-24 bg-slate-200 rounded-full h-2">
                                  <div
                                    className={`h-full rounded-full ${
                                      participant.attendanceRate >= 80
                                        ? 'bg-green-500'
                                        : participant.attendanceRate >= 50
                                        ? 'bg-orange-500'
                                        : 'bg-red-500'
                                    }`}
                                    style={{ width: `${participant.attendanceRate}%` }}
                                  />
                                </div>
                                <span className="font-bold text-slate-900 text-sm min-w-[3rem] text-right">
                                  {participant.attendanceRate}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {selectedParticipant && (
        <ParticipantDetailModal
          participant={selectedParticipant}
          onClose={() => setSelectedParticipant(null)}
        />
      )}

      {loadingDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      )}
    </div>
  );
}
