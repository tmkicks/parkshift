import { useState, useEffect } from 'react';
import { createClientComponentClient, createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';
import { ChevronLeft, ChevronRight, Clock, Save, RotateCcw } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameDay, isBefore } from 'date-fns';
import toast from 'react-hot-toast';

export default function AvailabilityCalendar({ spaceId, userId }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availability, setAvailability] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const supabase = createPagesBrowserClient();

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Hours for time slots
  const hours = Array.from({ length: 24 }, (_, i) => i);

  useEffect(() => {
    if (spaceId) {
      loadAvailability();
    }
  }, [spaceId, currentMonth]);

  const loadAvailability = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('availability_slots')
        .select('*')
        .eq('space_id', spaceId)
        .gte('date', format(monthStart, 'yyyy-MM-dd'))
        .lte('date', format(monthEnd, 'yyyy-MM-dd'));

      if (error) throw error;

      // Convert to lookup object
      const availabilityMap = {};
      data?.forEach(slot => {
        const dateKey = slot.date;
        if (!availabilityMap[dateKey]) {
          availabilityMap[dateKey] = [];
        }
        availabilityMap[dateKey].push(slot);
      });

      setAvailability(availabilityMap);
    } catch (error) {
      console.error('Error loading availability:', error);
      toast.error('Failed to load availability');
    } finally {
      setLoading(false);
    }
  };

  const saveAvailability = async () => {
    setSaving(true);
    try {
      // Convert availability state to database format
      const slots = [];
      Object.entries(availability).forEach(([date, daySlots]) => {
        daySlots.forEach(slot => {
          slots.push({
            space_id: spaceId,
            date,
            start_hour: slot.start_hour,
            end_hour: slot.end_hour,
            is_available: slot.is_available
          });
        });
      });

      // Delete existing slots for the month
      await supabase
        .from('availability_slots')
        .delete()
        .eq('space_id', spaceId)
        .gte('date', format(monthStart, 'yyyy-MM-dd'))
        .lte('date', format(monthEnd, 'yyyy-MM-dd'));

      // Insert new slots
      if (slots.length > 0) {
        const { error } = await supabase
          .from('availability_slots')
          .insert(slots);

        if (error) throw error;
      }

      setHasChanges(false);
      toast.success('Availability saved successfully');
    } catch (error) {
      console.error('Error saving availability:', error);
      toast.error('Failed to save availability');
    } finally {
      setSaving(false);
    }
  };

  const toggleDayAvailability = (date, isAvailable) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const newAvailability = { ...availability };

    if (isAvailable) {
      // Make entire day available (0-24)
      newAvailability[dateKey] = [{
        start_hour: 0,
        end_hour: 24,
        is_available: true
      }];
    } else {
      // Make entire day unavailable
      newAvailability[dateKey] = [{
        start_hour: 0,
        end_hour: 24,
        is_available: false
      }];
    }

    setAvailability(newAvailability);
    setHasChanges(true);
  };

  const toggleHourAvailability = (date, hour) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const newAvailability = { ...availability };

    if (!newAvailability[dateKey]) {
      newAvailability[dateKey] = [];
    }

    // Find if this hour slot exists
    const existingSlotIndex = newAvailability[dateKey].findIndex(
      slot => slot.start_hour <= hour && slot.end_hour > hour
    );

    if (existingSlotIndex >= 0) {
      // Toggle the availability of this slot
      const slot = newAvailability[dateKey][existingSlotIndex];
      newAvailability[dateKey][existingSlotIndex] = {
        ...slot,
        is_available: !slot.is_available
      };
    } else {
      // Create new slot for this hour
      newAvailability[dateKey].push({
        start_hour: hour,
        end_hour: hour + 1,
        is_available: true
      });
    }

    setAvailability(newAvailability);
    setHasChanges(true);
  };

  const getDayStatus = (date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const daySlots = availability[dateKey] || [];

    if (daySlots.length === 0) return 'unavailable';

    const availableHours = daySlots.filter(slot => slot.is_available).length;
    const totalHours = daySlots.length;

    if (availableHours === 0) return 'unavailable';
    if (availableHours === totalHours && totalHours === 1 && daySlots[0].start_hour === 0 && daySlots[0].end_hour === 24) {
      return 'available';
    }
    return 'partial';
  };

  const isHourAvailable = (date, hour) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const daySlots = availability[dateKey] || [];

    const slot = daySlots.find(slot => slot.start_hour <= hour && slot.end_hour > hour);
    return slot ? slot.is_available : false;
  };

  const resetMonth = () => {
    const defaultAvailability = {};
    daysInMonth.forEach(date => {
      if (!isBefore(date, new Date())) {
        const dateKey = format(date, 'yyyy-MM-dd');
        defaultAvailability[dateKey] = [{
          start_hour: 0,
          end_hour: 24,
          is_available: true
        }];
      }
    });
    setAvailability(defaultAvailability);
    setHasChanges(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <ChevronLeft size={20} />
          </button>
          
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={resetMonth}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg"
          >
            <RotateCcw size={16} />
            Reset Month
          </button>
          
          {hasChanges && (
            <button
              onClick={saveAvailability}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Save size={16} />
              )}
              Save Changes
            </button>
          )}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Days of week header */}
        <div className="grid grid-cols-7 bg-gray-50 dark:bg-gray-700">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-3 text-center text-sm font-medium text-gray-700 dark:text-gray-300">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7">
          {/* Empty cells for days before month start */}
          {Array.from({ length: getDay(monthStart) }, (_, i) => (
            <div key={`empty-${i}`} className="h-24 border-r border-b border-gray-200 dark:border-gray-700"></div>
          ))}

          {/* Days of the month */}
          {daysInMonth.map(date => {
            const dayStatus = getDayStatus(date);
            const isPast = isBefore(date, new Date());
            const isSelected = selectedDate && isSameDay(date, selectedDate);

            return (
              <div
                key={date.toISOString()}
                className={`h-24 border-r border-b border-gray-200 dark:border-gray-700 p-2 ${
                  isPast ? 'bg-gray-50 dark:bg-gray-700' : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700'
                } ${isSelected ? 'ring-2 ring-green-500' : ''}`}
                onClick={() => !isPast && setSelectedDate(date)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-medium ${
                    isPast ? 'text-gray-400' : 'text-gray-900 dark:text-gray-100'
                  }`}>
                    {format(date, 'd')}
                  </span>
                  
                  {!isPast && (
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleDayAvailability(date, true);
                        }}
                        className={`w-3 h-3 rounded ${
                          dayStatus === 'available' ? 'bg-green-500' : 'bg-gray-300 hover:bg-green-400'
                        }`}
                        title="Make available"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleDayAvailability(date, false);
                        }}
                        className={`w-3 h-3 rounded ${
                          dayStatus === 'unavailable' ? 'bg-red-500' : 'bg-gray-300 hover:bg-red-400'
                        }`}
                        title="Make unavailable"
                      />
                    </div>
                  )}
                </div>

                <div className={`text-xs ${
                  dayStatus === 'available' ? 'text-green-600' :
                  dayStatus === 'unavailable' ? 'text-red-600' :
                  'text-yellow-600'
                }`}>
                  {isPast ? 'Past' :
                   dayStatus === 'available' ? 'Available' :
                   dayStatus === 'unavailable' ? 'Unavailable' :
                   'Partial'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed hour view for selected date */}
      {selectedDate && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Clock size={20} />
            {format(selectedDate, 'EEEE, MMMM d, yyyy')} - Hourly Availability
          </h3>

          <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-2">
            {hours.map(hour => (
              <button
                key={hour}
                onClick={() => toggleHourAvailability(selectedDate, hour)}
                className={`p-2 text-xs rounded-lg transition-colors ${
                  isHourAvailable(selectedDate, hour)
                    ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 hover:bg-green-50 dark:hover:bg-green-900/10'
                }`}
              >
                {hour.toString().padStart(2, '0')}:00
              </button>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-100 border border-gray-300 rounded"></div>
              <span>Unavailable</span>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Legend</h4>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Fully Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Partially Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Unavailable</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-400 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Past Date</span>
          </div>
        </div>
      </div>
    </div>
  );
}

