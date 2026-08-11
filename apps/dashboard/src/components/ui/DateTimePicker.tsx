import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatTimestamp, getTimezoneMode, datetimeStringToTimestamp } from '../../utils/date';

interface DateTimePickerProps {
  value: string; // ISO string format: YYYY-MM-DDTHH:mm:ss
  onChange: (val: string) => void;
  className?: string;
}

export const DateTimePicker: React.FC<DateTimePickerProps> = ({
  value,
  onChange,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isUtc = getTimezoneMode() === 'UTC';

  // Helper to parse value date based on active timezone mode
  const getParsedDate = (valStr: string) => {
    if (!valStr) return new Date();
    if (isUtc) {
      return new Date(valStr.endsWith('Z') ? valStr : `${valStr}Z`);
    }
    const parts = valStr.split('T');
    if (parts.length === 2) {
      const [y, m, d] = parts[0].split('-').map(Number);
      const [hh, mm, ss] = parts[1].split(':').map(Number);
      return new Date(y, m - 1, d, hh || 0, mm || 0, ss || 0);
    }
    return new Date(valStr);
  };

  const parsedDate = getParsedDate(value);

  const getYear = (d: Date) => (isUtc ? d.getUTCFullYear() : d.getFullYear());
  const getMonth = (d: Date) => (isUtc ? d.getUTCMonth() : d.getMonth());
  const getDateNum = (d: Date) => (isUtc ? d.getUTCDate() : d.getDate());
  const getHours = (d: Date) => (isUtc ? d.getUTCHours() : d.getHours());
  const getMinutes = (d: Date) => (isUtc ? d.getUTCMinutes() : d.getMinutes());
  const getSeconds = (d: Date) => (isUtc ? d.getUTCSeconds() : d.getSeconds());

  const [viewYear, setViewYear] = useState(getYear(parsedDate));
  const [viewMonth, setViewMonth] = useState(getMonth(parsedDate));
  const [selectedDate, setSelectedDate] = useState({
    year: getYear(parsedDate),
    month: getMonth(parsedDate),
    day: getDateNum(parsedDate),
  });

  const [selectedHours, setSelectedHours] = useState(String(getHours(parsedDate)).padStart(2, '0'));
  const [selectedMinutes, setSelectedMinutes] = useState(String(getMinutes(parsedDate)).padStart(2, '0'));
  const [selectedSeconds, setSelectedSeconds] = useState(String(getSeconds(parsedDate)).padStart(2, '0'));

  useEffect(() => {
    if (!value) return;
    const d = getParsedDate(value);
    setViewYear(getYear(d));
    setViewMonth(getMonth(d));
    setSelectedDate({
      year: getYear(d),
      month: getMonth(d),
      day: getDateNum(d),
    });
    setSelectedHours(String(getHours(d)).padStart(2, '0'));
    setSelectedMinutes(String(getMinutes(d)).padStart(2, '0'));
    setSelectedSeconds(String(getSeconds(d)).padStart(2, '0'));
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const emitChange = (y: number, m: number, d: number, hh: string, mm: string, ss: string) => {
    const monthStr = String(m + 1).padStart(2, '0');
    const dayStr = String(d).padStart(2, '0');
    const isoString = `${y}-${monthStr}-${dayStr}T${hh}:${mm}:${ss}`;
    onChange(isoString);
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const newSel = { year: viewYear, month: viewMonth, day };
    setSelectedDate(newSel);
    emitChange(viewYear, viewMonth, day, selectedHours, selectedMinutes, selectedSeconds);
  };

  const handleTimeChange = (hh: string, mm: string, ss: string) => {
    setSelectedHours(hh);
    setSelectedMinutes(mm);
    setSelectedSeconds(ss);
    emitChange(selectedDate.year, selectedDate.month, selectedDate.day, hh, mm, ss);
  };

  // Calendar matrix calculation
  const firstDayOfWeek = isUtc
    ? new Date(Date.UTC(viewYear, viewMonth, 1)).getUTCDay()
    : new Date(viewYear, viewMonth, 1).getDay();

  const daysInMonth = isUtc
    ? new Date(Date.UTC(viewYear, viewMonth + 1, 0)).getUTCDate()
    : new Date(viewYear, viewMonth + 1, 0).getDate();

  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const currentDtString = `${selectedDate.year}-${String(selectedDate.month + 1).padStart(2, '0')}-${String(selectedDate.day).padStart(2, '0')}T${selectedHours}:${selectedMinutes}:${selectedSeconds}`;
  const currentTimestamp = datetimeStringToTimestamp(currentDtString);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Input Display Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2.5 bg-color-bg-card border border-theme-border rounded-xl text-color-text-main text-xs font-mono flex items-center justify-between hover:border-primary-red/50 transition cursor-pointer"
      >
        <div className="flex items-center space-x-2 truncate">
          <CalendarIcon className="w-4 h-4 text-primary-red shrink-0" />
          <span className="truncate">{formatTimestamp(currentTimestamp)}</span>
        </div>
        <Clock className="w-3.5 h-3.5 text-color-text-muted shrink-0 ml-2" />
      </button>

      {/* Custom Picker Dropdown Panel */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-72 bg-color-bg-sidebar border border-theme-border rounded-2xl p-4 shadow-2xl z-50 animate-in fade-in zoom-in duration-150 space-y-4">
          {/* Month & Year Navigation */}
          <div className="flex items-center justify-between border-b border-theme-border pb-3">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded-lg hover:bg-color-bg-card text-color-text-muted hover:text-color-text-main transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-xs font-bold font-mono text-color-text-main">
              {monthNames[viewMonth]} {viewYear}
            </div>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded-lg hover:bg-color-bg-card text-color-text-muted hover:text-color-text-main transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="space-y-1">
            <div className="grid grid-cols-7 text-center text-[10px] font-semibold text-color-text-muted">
              {weekDays.map((d) => (
                <div key={d} className="py-1">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1 text-xs font-mono">
              {/* Empty padding slots before 1st day */}
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}

              {/* Month Days */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const isSelected =
                  selectedDate.year === viewYear &&
                  selectedDate.month === viewMonth &&
                  selectedDate.day === dayNum;

                return (
                  <button
                    key={dayNum}
                    type="button"
                    onClick={() => handleSelectDay(dayNum)}
                    className={`h-7 w-full rounded-lg flex items-center justify-center transition cursor-pointer text-xs ${
                      isSelected
                        ? 'bg-primary-red text-white font-bold'
                        : 'hover:bg-color-bg-card text-color-text-main'
                    }`}
                  >
                    {dayNum}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Picker Inputs (HH : MM : SS) */}
          <div className="pt-3 border-t border-theme-border flex items-center justify-between">
            <div className="flex items-center space-x-1 text-xs text-color-text-muted font-medium">
              <Clock className="w-3.5 h-3.5 text-primary-red" />
              <span>Time ({isUtc ? 'UTC' : 'Local'})</span>
            </div>

            <div className="flex items-center space-x-1 font-mono text-xs">
              <input
                type="number"
                min="0"
                max="23"
                value={selectedHours}
                onChange={(e) => {
                  const val = String(Math.max(0, Math.min(23, Number(e.target.value)))).padStart(2, '0');
                  handleTimeChange(val, selectedMinutes, selectedSeconds);
                }}
                className="w-9 py-1 text-center bg-color-bg-card border border-theme-border rounded-lg text-color-text-main focus:outline-none focus:border-primary-red"
              />
              <span className="text-color-text-muted">:</span>
              <input
                type="number"
                min="0"
                max="59"
                value={selectedMinutes}
                onChange={(e) => {
                  const val = String(Math.max(0, Math.min(59, Number(e.target.value)))).padStart(2, '0');
                  handleTimeChange(selectedHours, val, selectedSeconds);
                }}
                className="w-9 py-1 text-center bg-color-bg-card border border-theme-border rounded-lg text-color-text-main focus:outline-none focus:border-primary-red"
              />
              <span className="text-color-text-muted">:</span>
              <input
                type="number"
                min="0"
                max="59"
                value={selectedSeconds}
                onChange={(e) => {
                  const val = String(Math.max(0, Math.min(59, Number(e.target.value)))).padStart(2, '0');
                  handleTimeChange(selectedHours, selectedMinutes, val);
                }}
                className="w-9 py-1 text-center bg-color-bg-card border border-theme-border rounded-lg text-color-text-main focus:outline-none focus:border-primary-red"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
