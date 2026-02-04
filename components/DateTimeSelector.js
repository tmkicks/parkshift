import { useState } from 'react';
import { Calendar, Clock, X } from 'lucide-react';
import { format, addDays, startOfDay, endOfDay } from 'date-fns';

export default function DateTimeSelector({ selectedDates, onDatesChange, onClose }) {
  const [bookingType, setBookingType] = useState('hours'); // 'hours' or 'days'

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      slots.push({
        value: `${hour.toString().padStart(2, '0')}:00`,
        label: `${hour.toString().padStart(2, '0')}:00`
      });
      slots.push({
        value: `${hour.toString().padStart(2, '0')}:30`,
        label: `${hour.toString().padStart(2, '0')}:30`
      });
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  const handleDateChange = (field, value) => {
    const updates = { ...selectedDates, [field]: value };
    
    // Auto-adjust end date if start date is after end date
    if (field === 'startDate' && value > selectedDates.endDate) {
      updates.endDate = value;
    }
    
    onDatesChange(updates);
  };

  const handleTimeChange = (field, value) => {
    const updates = { ...selectedDates, [field]: value };
    onDatesChange(updates);
  };

  const handleBookingTypeChange = (type) => {
    setBookingType(type);
    const updates = { ...selectedDates };
    
    if (type === 'days') {
      // Set to full days
      updates.startTime = '00:00';
      updates.endTime = '23:59';
    } else {
      // Set to business hours as default
      updates.startTime = '09:00';
      updates.endTime = '17:00';
    }
    
    onDatesChange(updates);
  };

  const setQuickDuration = (hours) => {
    const now = new Date();
    const roundedStart = new Date(now);
    roundedStart.setMinutes(0, 0, 0); // Round to nearest hour
    
    const end = new Date(roundedStart.getTime() + hours * 60 * 60 * 1000);
    
    onDatesChange({
      startDate: roundedStart,
      endDate: end.getDate() !== roundedStart.getDate() ? end : roundedStart,
      startTime: format(roundedStart, 'HH:mm'),
      endTime: format(end, 'HH:mm')
    });
  };

  const formatDuration = () => {
    const start = new Date(`${selectedDates.startDate.toDateString()} ${selectedDates.startTime}`);
    const end = new Date(`${selectedDates.endDate.toDateString()} ${selectedDates.endTime}`);
    const diffHours = Math.ceil((end - start) / (1000 * 60 * 60));
    
    if (diffHours >= 24) {
      const days = Math.floor(diffHours / 24);
      const remainingHours = diffHours % 24;
      return `${days} day${days !== 1 ? 's' : ''}${remainingHours > 0 ? ` ${remainingHours}h` : ''}`;
    } else {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Select Date & Time</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>
      </div>

      {/* Booking Type Toggle */}
      <div className="flex bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => handleBookingTypeChange('hours')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            bookingType === 'hours'
              ? 'bg-white text-green-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Clock className="w-4 h-4 inline mr-1" />
          Hourly
        </button>
        <button
          onClick={() => handleBookingTypeChange('days')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            bookingType === 'days'
              ? 'bg-white text-green-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Calendar className="w-4 h-4 inline mr-1" />
          Daily
        </button>
      </div>

      {/* Quick Duration Buttons (for hourly) */}
      {bookingType === 'hours' && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Quick Select</label>
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 4, 8].map((hours) => (
              <button
                key={hours}
                onClick={() => setQuickDuration(hours)}
                className="py-2 px-3 text-sm border border-gray-300 rounded-lg hover:border-green-500 hover:text-green-600"
              >
                {hours}h
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Date Selection */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Date
          </label>
          <input
            type="date"
            value={format(selectedDates.startDate, 'yyyy-MM-dd')}
            onChange={(e) => handleDateChange('startDate', new Date(e.target.value))}
            min={format(new Date(), 'yyyy-MM-dd')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            End Date
          </label>
          <input
            type="date"
            value={format(selectedDates.endDate, 'yyyy-MM-dd')}
            onChange={(e) => handleDateChange('endDate', new Date(e.target.value))}
            min={format(selectedDates.startDate, 'yyyy-MM-dd')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Time Selection (for hourly) */}
      {bookingType === 'hours' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Time
            </label>
            <select
              value={selectedDates.startTime}
              onChange={(e) => handleTimeChange('startTime', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {timeSlots.map((slot) => (
                <option key={slot.value} value={slot.value}>
                  {slot.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Time
            </label>
            <select
              value={selectedDates.endTime}
              onChange={(e) => handleTimeChange('endTime', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {timeSlots.map((slot) => (
                <option key={slot.value} value={slot.value}>
                  {slot.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Duration Display */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
        <div className="text-sm font-medium text-green-800">
          Duration: {formatDuration()}
        </div>
        <div className="text-xs text-green-600 mt-1">
          {format(selectedDates.startDate, 'MMM dd, yyyy')} at {selectedDates.startTime} → {' '}
          {format(selectedDates.endDate, 'MMM dd, yyyy')} at {selectedDates.endTime}
        </div>
      </div>

      {/* Apply Button */}
      <button
        onClick={onClose}
        className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 font-medium"
      >
        Apply Selection
      </button>
    </div>
  );
}
