import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Copy, Calendar, Clock, Check, Plus } from 'lucide-react';
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';
import { availabilityService } from '../lib/database';
import toast from 'react-hot-toast';

export default function SchedulingModal({ listing, onClose, onSave }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [availability, setAvailability] = useState({});
  const [selectedTimes, setSelectedTimes] = useState({ start: '00:00', end: '23:00' });
  const [isAllDay, setIsAllDay] = useState(true);
  const [showCopyOptions, setShowCopyOptions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState([]);
  const supabase = createPagesBrowserClient();

  // Generate hours for time selection (hourly only, no half hours)
  const generateHours = () => {
    const hours = [];
    for (let i = 0; i < 24; i++) {
      const hour = i.toString().padStart(2, '0');
      hours.push(`${hour}:00`);
    }
    return hours;
  };

  const timeOptions = generateHours();

  useEffect(() => {
    loadAvailability();
  }, [listing?.id]);

  const loadAvailability = async () => {
    if (!listing?.id) return;
    
    setLoading(true);
    try {
      const slots = await availabilityService.getListingAvailability(supabase, listing.id);
      
      // Convert array format to object format
      const availabilityObj = {};
      slots.forEach(slot => {
        // Check if it's all day by comparing hours (0-24 = all day)
        const isAllDay = slot.is_available && slot.start_hour === 0 && slot.end_hour === 24;
        
        availabilityObj[slot.date] = {
          available: slot.is_available,
          allDay: isAllDay,
          startTime: isAllDay ? '00:00' : `${slot.start_hour.toString().padStart(2, '0')}:00`,
          endTime: isAllDay ? '23:00' : `${slot.end_hour.toString().padStart(2, '0')}:00`
        };
      });
      
      setAvailability(availabilityObj);
    } catch (error) {
      console.error('Error loading availability:', error);
      toast.error('Failed to load availability');
    } finally {
      setLoading(false);
    }
  };

  // Calendar generation
  const generateCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDay = firstDay.getDay(); // 0 = Sunday

    const days = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toISOString().split('T')[0];
      const isToday = date.toDateString() === new Date().toDateString();
      const isPast = date < new Date().setHours(0, 0, 0, 0);
      const isSelected = selectedDate === dateStr;
      const hasAvailability = availability[dateStr];
      
      days.push({
        day,
        date: dateStr,
        isToday,
        isPast,
        isSelected,
        hasAvailability
      });
    }
    
    return { days, month, year };
  };

  const { days, month, year } = generateCalendar();
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const handleDateClick = (dateStr) => {
    if (!dateStr) return;
    
    setSelectedDate(dateStr);
    const existingAvailability = availability[dateStr];
    
    if (existingAvailability) {
      if (existingAvailability.allDay) {
        setIsAllDay(true);
        setSelectedTimes({ start: '00:00', end: '23:00' });
      } else {
        setIsAllDay(false);
        setSelectedTimes({
          start: existingAvailability.startTime || '09:00',
          end: existingAvailability.endTime || '18:00'
        });
      }
    } else {
      setIsAllDay(true);
      setSelectedTimes({ start: '00:00', end: '23:00' });
    }
  };

  const handleAvailabilityChange = (available) => {
    if (!selectedDate) return;
    
    const updatedAvailability = { ...availability };
    
    if (available) {
      updatedAvailability[selectedDate] = {
        available: true,
        allDay: isAllDay,
        startTime: isAllDay ? '00:00' : selectedTimes.start,
        endTime: isAllDay ? '23:00' : selectedTimes.end
      };
    } else {
      updatedAvailability[selectedDate] = { available: false };
    }
    
    setAvailability(updatedAvailability);
  };

  const handleTimeChange = (type, value) => {
    const newTimes = { ...selectedTimes, [type]: value };
    setSelectedTimes(newTimes);
    
    if (selectedDate && availability[selectedDate]?.available) {
      const updatedAvailability = { ...availability };
      updatedAvailability[selectedDate] = {
        ...updatedAvailability[selectedDate],
        startTime: newTimes.start,
        endTime: newTimes.end,
        allDay: isAllDay
      };
      setAvailability(updatedAvailability);
    }
  };

  const handleAllDayChange = (allDay) => {
    setIsAllDay(allDay);
    
    if (allDay) {
      setSelectedTimes({ start: '00:00', end: '23:00' });
    }
    
    if (selectedDate && availability[selectedDate]?.available) {
      const updatedAvailability = { ...availability };
      updatedAvailability[selectedDate] = {
        ...updatedAvailability[selectedDate],
        allDay,
        startTime: allDay ? '00:00' : selectedTimes.start,
        endTime: allDay ? '23:00' : selectedTimes.end
      };
      setAvailability(updatedAvailability);
    }
  };

  const copyToMultipleDays = () => {
    if (!selectedDate || !availability[selectedDate]) return;
    
    setShowCopyOptions(true);
  };

  const applyCopySettings = (targetDates) => {
    const sourceSettings = availability[selectedDate];
    const updatedAvailability = { ...availability };
    
    targetDates.forEach(dateStr => {
      updatedAvailability[dateStr] = { ...sourceSettings };
    });
    
    setAvailability(updatedAvailability);
    setShowCopyOptions(false);
    setSelectedDateRange([]);
    toast.success(`Applied settings to ${targetDates.length} days`);
  };

  const saveAvailability = async () => {
    setLoading(true);
    try {
      await availabilityService.updateAvailability(supabase, listing.id, availability);
      
      toast.success('Availability updated successfully');
      onSave?.(availability);
      onClose();
    } catch (error) {
      console.error('Error saving availability:', error);
      toast.error('Failed to save availability');
    } finally {
      setLoading(false);
    }
  };

  const getDateStatus = (dayData) => {
    if (!dayData?.hasAvailability) return null;
    
    const avail = dayData.hasAvailability;
    if (!avail.available) return 'unavailable';
    if (avail.allDay) return 'all-day';
    return 'partial';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Manage Availability</h2>
            <p className="text-sm text-gray-600 mt-1">{listing?.title || 'Parking Space'}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row h-[600px]">
          {/* Calendar Section */}
          <div className="flex-1 p-6 border-r border-gray-200">
            <div className="h-full flex flex-col">
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => navigateMonth(-1)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeft size={20} className="text-gray-600" />
                </button>
                
                <h3 className="text-lg font-semibold text-gray-900">
                  {monthNames[month]} {year}
                </h3>
                
                <button
                  onClick={() => navigateMonth(1)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronRight size={20} className="text-gray-600" />
                </button>
              </div>

              {/* Days of week header */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 flex-1">
                {days.map((dayData, index) => {
                  if (!dayData) {
                    return <div key={index} className="p-2"></div>;
                  }

                  const status = getDateStatus(dayData);
                  const statusColors = {
                    'unavailable': 'bg-red-100 text-red-700 border-red-300',
                    'all-day': 'bg-green-100 text-green-700 border-green-300',
                    'partial': 'bg-blue-100 text-blue-700 border-blue-300'
                  };

                  return (
                    <button
                      key={dayData.date}
                      onClick={() => handleDateClick(dayData.date)}
                      disabled={dayData.isPast}
                      className={`
                        p-2 text-sm rounded-lg border-2 transition-all relative
                        ${dayData.isPast 
                          ? 'bg-gray-50 text-gray-300 cursor-not-allowed' 
                          : 'hover:bg-gray-50 cursor-pointer'
                        }
                        ${dayData.isSelected 
                          ? 'ring-2 ring-green-500 border-green-500' 
                          : 'border-transparent'
                        }
                        ${dayData.isToday 
                          ? 'bg-green-50 text-green-700 font-semibold' 
                          : 'text-gray-700'
                        }
                        ${status ? statusColors[status] : ''}
                      `}
                    >
                      {dayData.day}
                      {status && (
                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-current opacity-60"></div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="mt-4 flex flex-wrap gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
                  <span className="text-gray-600">Available All Day</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded"></div>
                  <span className="text-gray-600">Available Partial</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
                  <span className="text-gray-600">Not Available</span>
                </div>
              </div>
            </div>
          </div>

          {/* Settings Section */}
          <div className="w-full lg:w-80 p-6 bg-gray-50">
            <div className="h-full flex flex-col">
              {selectedDate ? (
                <>
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      {new Date(selectedDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </h4>
                  </div>

                  {/* Availability Options */}
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Availability Status
                      </label>
                      <div className="space-y-2">
                        <button
                          onClick={() => handleAvailabilityChange(false)}
                          className={`w-full p-2 text-left rounded-lg border-2 transition-colors ${
                            availability[selectedDate]?.available === false
                              ? 'border-red-500 bg-red-50 text-red-700'
                              : 'border-gray-200 hover:border-red-300 text-gray-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${
                              availability[selectedDate]?.available === false
                                ? 'bg-red-500'
                                : 'bg-gray-300'
                            }`}></div>
                            <span className="font-medium text-sm">Not Available</span>
                          </div>
                        </button>
                        
                        <button
                          onClick={() => handleAvailabilityChange(true)}
                          className={`w-full p-2 text-left rounded-lg border-2 transition-colors ${
                            availability[selectedDate]?.available === true
                              ? 'border-green-500 bg-green-50 text-green-700'
                              : 'border-gray-200 hover:border-green-300 text-gray-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${
                              availability[selectedDate]?.available === true
                                ? 'bg-green-500'
                                : 'bg-gray-300'
                            }`}></div>
                            <span className="font-medium text-sm">Available</span>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Time Settings - Only show if available */}
                    {availability[selectedDate]?.available && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Time Settings
                        </label>
                        
                        <div className="space-y-2">
                          {/* All Day Option */}
                          <button
                            onClick={() => handleAllDayChange(true)}
                            className={`w-full p-2 text-left rounded-lg border-2 transition-colors ${
                              isAllDay
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-gray-200 hover:border-blue-300 text-gray-700'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${
                                isAllDay ? 'bg-blue-500' : 'bg-gray-300'
                              }`}></div>
                              <div>
                                <div className="font-medium text-sm">All Day</div>
                                <div className="text-xs opacity-75">00:00 - 23:00 (Full Day)</div>
                              </div>
                            </div>
                          </button>

                          {/* Custom Time Option */}
                          <button
                            onClick={() => handleAllDayChange(false)}
                            className={`w-full p-2 text-left rounded-lg border-2 transition-colors ${
                              !isAllDay
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-gray-200 hover:border-blue-300 text-gray-700'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${
                                !isAllDay ? 'bg-blue-500' : 'bg-gray-300'
                              }`}></div>
                              <div>
                                <div className="font-medium text-sm">Custom Time</div>
                                <div className="text-xs opacity-75">Set specific hours</div>
                              </div>
                            </div>
                          </button>

                          {/* Time Selectors */}
                          {!isAllDay && (
                            <div className="ml-5 space-y-2 pt-1">
                              <div className="mb-2">
                                <label className="block text-xs font-medium text-gray-600 mb-2">
                                  Select Available Hours
                                </label>
                                <div className="text-xs text-gray-500 mb-2">
                                  {selectedTimes.start} - {selectedTimes.end}
                                </div>
                              </div>
                              
                              <TimeRangeSelector
                                startTime={selectedTimes.start}
                                endTime={selectedTimes.end}
                                onChange={(start, end) => {
                                  const newTimes = { start, end };
                                  setSelectedTimes(newTimes);
                                  handleTimeChange('start', start);
                                  handleTimeChange('end', end);
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Copy to Multiple Days */}
                  {availability[selectedDate] && (
                    <div className="mb-4">
                      <button
                        onClick={copyToMultipleDays}
                        className="w-full flex items-center justify-center gap-2 p-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <Copy size={14} />
                        <span className="text-sm font-medium">Apply to Multiple Days</span>
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-center">
                  <div>
                    <Calendar size={48} className="text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Select a date to manage availability</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3 mt-auto">
                <button
                  onClick={saveAvailability}
                  disabled={loading}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                
                <button
                  onClick={onClose}
                  className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Copy Options Modal */}
        {showCopyOptions && (
          <CopyOptionsModal
            currentDate={selectedDate}
            currentSettings={availability[selectedDate]}
            onApply={applyCopySettings}
            onClose={() => setShowCopyOptions(false)}
            generateCalendar={generateCalendar}
            currentMonth={currentDate}
          />
        )}
      </div>
    </div>
  );
}

// Copy Options Modal Component
function CopyOptionsModal({ currentDate, currentSettings, onApply, onClose, generateCalendar, currentMonth }) {
  const [selectedDates, setSelectedDates] = useState([]);
  const [copyMode, setCopyMode] = useState('select'); // 'select', 'week', 'month'

  const toggleDate = (dateStr) => {
    if (dateStr === currentDate) return; // Can't copy to self
    
    setSelectedDates(prev =>
      prev.includes(dateStr)
        ? prev.filter(d => d !== dateStr)
        : [...prev, dateStr]
    );
  };

  const selectWeekdays = () => {
    const { days } = generateCalendar();
    const weekdays = days
      .filter(day => day && !day.isPast && day.date !== currentDate)
      .filter(day => {
        const dayOfWeek = new Date(day.date).getDay();
        return dayOfWeek >= 1 && dayOfWeek <= 5; // Monday to Friday
      })
      .map(day => day.date);
    
    setSelectedDates(weekdays);
  };

  const selectWeekends = () => {
    const { days } = generateCalendar();
    const weekends = days
      .filter(day => day && !day.isPast && day.date !== currentDate)
      .filter(day => {
        const dayOfWeek = new Date(day.date).getDay();
        return dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
      })
      .map(day => day.date);
    
    setSelectedDates(weekends);
  };

  const { days } = generateCalendar();

  return (
    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full m-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Copy Settings to Multiple Days
            </h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X size={16} className="text-gray-500" />
            </button>
          </div>

          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Current settings:</strong> {
                !currentSettings.available 
                  ? 'Not Available'
                  : currentSettings.allDay 
                    ? 'Available All Day'
                    : `Available ${currentSettings.startTime} - ${currentSettings.endTime}`
              }
            </p>
          </div>

          {/* Quick Select Buttons */}
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Quick Select:</p>
            <div className="flex gap-2">
              <button
                onClick={selectWeekdays}
                className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
              >
                Weekdays
              </button>
              <button
                onClick={selectWeekends}
                className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors"
              >
                Weekends
              </button>
              <button
                onClick={() => setSelectedDates([])}
                className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Select dates:</p>
            <div className="grid grid-cols-7 gap-1 text-xs">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                <div key={day} className="p-1 text-center font-medium text-gray-500">
                  {day}
                </div>
              ))}
              {days.map((dayData, index) => {
                if (!dayData) {
                  return <div key={index} className="p-1"></div>;
                }

                const isSelected = selectedDates.includes(dayData.date);
                const isCurrentDate = dayData.date === currentDate;

                return (
                  <button
                    key={dayData.date}
                    onClick={() => toggleDate(dayData.date)}
                    disabled={dayData.isPast || isCurrentDate}
                    className={`
                      p-1 text-xs rounded transition-colors
                      ${dayData.isPast || isCurrentDate
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : isSelected
                          ? 'bg-green-500 text-white'
                          : 'hover:bg-blue-100 text-gray-700'
                      }
                      ${isCurrentDate ? 'ring-2 ring-blue-300' : ''}
                    `}
                  >
                    {dayData.day}
                  </button>
                );
              })}
            </div>
          </div>

          <p className="text-xs text-gray-600 mb-4">
            {selectedDates.length} day{selectedDates.length !== 1 ? 's' : ''} selected
          </p>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => onApply(selectedDates)}
              disabled={selectedDates.length === 0}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              Apply to {selectedDates.length} day{selectedDates.length !== 1 ? 's' : ''}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Time Range Selector Component
function TimeRangeSelector({ startTime, endTime, onChange }) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState(null); // 'start', 'end', or 'range'

  // Generate 24-hour time slots (including 24:00 as end option)
  const timeSlots = [];
  for (let i = 0; i < 24; i++) {
    timeSlots.push({
      hour: i,
      label: `${i.toString().padStart(2, '0')}:00`,
      value: `${i.toString().padStart(2, '0')}:00`
    });
  }

  const startHour = parseInt(startTime.split(':')[0]);
  const endHour = parseInt(endTime.split(':')[0]);
  
  // For display, treat 23:00 as full day end (represents 23:00-24:00)
  const displayEndHour = endHour === 23 ? 23 : endHour;

  const handleMouseDown = (e, type, hour) => {
    e.preventDefault();
    setIsDragging(true);
    setDragType(type);
    
    if (type === 'start') {
      onChange(`${hour.toString().padStart(2, '0')}:00`, endTime);
    } else if (type === 'end') {
      onChange(startTime, `${hour.toString().padStart(2, '0')}:00`);
    }
  };

  const handleMouseMove = (e, hour) => {
    if (!isDragging) return;
    
    if (dragType === 'start' && hour <= displayEndHour) {
      onChange(`${hour.toString().padStart(2, '0')}:00`, endTime);
    } else if (dragType === 'end' && hour >= startHour) {
      onChange(startTime, `${hour.toString().padStart(2, '0')}:00`);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragType(null);
  };

  const handleSlotClick = (hour) => {
    if (hour < startHour || hour > displayEndHour) {
      // Extend range to include this hour
      const newStart = Math.min(hour, startHour);
      const newEnd = Math.max(hour, displayEndHour);
      onChange(`${newStart.toString().padStart(2, '0')}:00`, `${newEnd.toString().padStart(2, '0')}:00`);
    }
  };

  return (
    <div 
      className="select-none"
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Time labels */}
      <div className="grid grid-cols-6 gap-1 mb-2 text-xs text-gray-500">
        <div className="text-center">00</div>
        <div className="text-center">04</div>
        <div className="text-center">08</div>
        <div className="text-center">12</div>
        <div className="text-center">16</div>
        <div className="text-center">20</div>
      </div>
      
      {/* Time grid */}
      <div className="grid grid-cols-6 gap-1">
        {timeSlots.map((slot) => {
          const isSelected = slot.hour >= startHour && slot.hour <= displayEndHour;
          const isStart = slot.hour === startHour;
          const isEnd = slot.hour === displayEndHour;
          
          return (
            <button
              key={slot.hour}
              className={`
                h-6 text-xs rounded transition-colors relative
                ${isSelected 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                }
                ${isStart ? 'ring-2 ring-green-600' : ''}
                ${isEnd ? 'ring-2 ring-blue-600' : ''}
              `}
              onMouseDown={(e) => {
                if (isStart) handleMouseDown(e, 'start', slot.hour);
                else if (isEnd) handleMouseDown(e, 'end', slot.hour);
                else handleSlotClick(slot.hour);
              }}
              onMouseEnter={(e) => handleMouseMove(e, slot.hour)}
              title={`${slot.label} ${isStart ? '(Start)' : isEnd ? '(End)' : ''}`}
            >
              {slot.hour}
              {isStart && (
                <div className="absolute -top-1 -left-1 w-2 h-2 bg-green-600 rounded-full"></div>
              )}
              {isEnd && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-600 rounded-full"></div>
              )}
            </button>
          );
        })}
      </div>
      
      {/* Instructions */}
      <div className="mt-2 text-xs text-gray-500">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-600 rounded-full"></div>
            <span>Start</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
            <span>End</span>
          </div>
        </div>
        <p className="mt-1">Click and drag to adjust time range</p>
      </div>
    </div>
  );
}