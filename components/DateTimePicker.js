import { useState } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { format, addDays } from 'date-fns';

export default function DateTimePicker({ selectedDates, onDatesChange }) {
  const [showCalendar, setShowCalendar] = useState(false);

  const handleModeChange = (isHourly) => {
    onDatesChange({
      ...selectedDates,
      isHourly,
      endDate: isHourly ? selectedDates.startDate : addDays(selectedDates.startDate, 1)
    });
  };

  const handleDateChange = (field, value) => {
    onDatesChange({
      ...selectedDates,
      [field]: value
    });
  };

  const quickOptions = [
    { label: '2 hours', hours: 2 },
    { label: '4 hours', hours: 4 },
    { label: '1 day', days: 1 },
    { label: '2 days', days: 2 }
  ];

  return (
    <div className="space-y-3">
      {/* Mode Toggle */}
      <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
        <button
          onClick={() => handleModeChange(true)}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            selectedDates.isHourly
              ? 'bg-white dark:bg-gray-600 text-green-600 dark:text-green-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          <Clock size={14} className="inline mr-1" />
          Hourly
        </button>
        <button
          onClick={() => handleModeChange(false)}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            !selectedDates.isHourly
              ? 'bg-white dark:bg-gray-600 text-green-600 dark:text-green-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          <Calendar size={14} className="inline mr-1" />
          Daily
        </button>
      </div>

      {selectedDates.isHourly ? (
        /* Hourly Mode */
        <div className="space-y-2">
          <input
            type="date"
            value={format(selectedDates.startDate, 'yyyy-MM-dd')}
            onChange={(e) => handleDateChange('startDate', new Date(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="time"
              value={selectedDates.startTime}
              onChange={(e) => handleDateChange('startTime', e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
            <input
              type="time"
              value={selectedDates.endTime}
              onChange={(e) => handleDateChange('endTime', e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>
      ) : (
        /* Daily Mode */
        <div className="grid grid-cols-2 gap-2">
          <input
            type="date"
            value={format(selectedDates.startDate, 'yyyy-MM-dd')}
            onChange={(e) => handleDateChange('startDate', new Date(e.target.value))}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
          <input
            type="date"
            value={format(selectedDates.endDate, 'yyyy-MM-dd')}
            onChange={(e) => handleDateChange('endDate', new Date(e.target.value))}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>
      )}

      {/* Quick Options */}
      <div className="flex flex-wrap gap-1">
        {quickOptions.map((option, index) => (
          <button
            key={index}
            onClick={() => {
              if (option.hours) {
                handleModeChange(true);
                const start = selectedDates.startTime.split(':');
                const endHour = (parseInt(start[0]) + option.hours) % 24;
                handleDateChange('endTime', `${endHour.toString().padStart(2, '0')}:${start[1]}`);
              } else {
                handleModeChange(false);
                handleDateChange('endDate', addDays(selectedDates.startDate, option.days));
              }
            }}
            className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
