interface TimeRangePickerProps {
  startTime: string;
  endTime: string;
  onStartTimeChange: (time: string) => void;
  onEndTimeChange: (time: string) => void;
}

export function TimeRangePicker({ startTime, endTime, onStartTimeChange, onEndTimeChange }: TimeRangePickerProps) {
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = ['00', '15', '30', '45'];

  const parseTime = (time: string) => {
    if (!time) return { hour: '', minute: '' };
    const [hour, minute] = time.split(':');
    return { hour, minute: minute || '00' };
  };

  const formatTime = (hour: string, minute: string) => {
    if (!hour) return '';
    return `${hour}:${minute || '00'}`;
  };

  const startParsed = parseTime(startTime);
  const endParsed = parseTime(endTime);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-2">
          Heure de début
        </label>
        <div className="flex gap-2">
          <select
            value={startParsed.hour}
            onChange={(e) => onStartTimeChange(formatTime(e.target.value, startParsed.minute))}
            className="flex-1 px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="">--</option>
            {hours.map((h) => (
              <option key={h} value={h}>{h}h</option>
            ))}
          </select>
          <select
            value={startParsed.minute}
            onChange={(e) => onStartTimeChange(formatTime(startParsed.hour, e.target.value))}
            className="flex-1 px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            disabled={!startParsed.hour}
          >
            {minutes.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-bold text-slate-700 mb-2">
          Heure de fin
        </label>
        <div className="flex gap-2">
          <select
            value={endParsed.hour}
            onChange={(e) => onEndTimeChange(formatTime(e.target.value, endParsed.minute))}
            className="flex-1 px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="">--</option>
            {hours.map((h) => (
              <option key={h} value={h}>{h}h</option>
            ))}
          </select>
          <select
            value={endParsed.minute}
            onChange={(e) => onEndTimeChange(formatTime(endParsed.hour, e.target.value))}
            className="flex-1 px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            disabled={!endParsed.hour}
          >
            {minutes.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
