import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { createClientComponentClient, createPagesBrowserClient  } from '@supabase/auth-helpers-nextjs';
import Layout from '../components/Layout';
import { 
  Monitor, 
  Search, 
  Bell, 
  Car, 
  Shield, 
  BarChart3, 
  HelpCircle, 
  Sun, 
  Moon, 
  Globe,
  CreditCard,
  MapPin,
  Clock,
  Download,
  Trash2,
  Save
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useTheme } from '../lib/contexts/ThemeContext';

export default function SettingsPage() {
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState({
    // Display preferences
    theme: 'light',
    language: 'en',
    currency: 'EUR',
    mapStyle: 'streets',
    density: 'comfortable',
    
    // Search preferences
    defaultRadius: 1,
    autoLocation: true,
    defaultDuration: 2,
    priceRangeMin: 0,
    priceRangeMax: 10,
    preferredAmenities: [],
    vehicleAutoSelect: true,
    
    // Notification preferences
    pushNotifications: true,
    bookingNotifications: true,
    messageNotifications: true,
    marketingNotifications: false,
    bookingReminders: 60,
    soundAlerts: true,
    
    // Booking preferences
    autoConfirm: false,
    defaultCheckIn: '09:00',
    defaultCheckOut: '17:00',
    
    // Owner preferences (if applicable)
    autoAcceptBookings: false,
    responseTimeTarget: 4,
    
    // Privacy preferences
    profileVisibility: {
      showPhone: false,
      showFullName: true
    },
    locationSharing: 'precise',
    reviewPrivacy: true,
    
    // Data preferences
    usageAnalytics: true,
    locationHistory: true,
    bookingHistoryRetention: 365,
    analyticsSharing: false,
    
    // Emergency contact
    emergencyContact: {
      name: '',
      phone: ''
    },
    
    // Accessibility
    accessibilityNeeds: '',
    
    // Communication
    communicationPreferences: ['in-app'],
    
    // Payment preferences
    autoPayment: true,
    receiptPreferences: 'email'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [activeSection, setActiveSection] = useState('display');
  const router = useRouter();
  const supabase = createPagesBrowserClient();
  const { theme, setLightTheme, setDarkTheme, setAutoTheme } = useTheme();

  const sections = [
    { id: 'display', title: 'Display & Interface', icon: Monitor },
    { id: 'search', title: 'Search & Booking', icon: Search },
    { id: 'notifications', title: 'Notifications', icon: Bell },
    { id: 'privacy', title: 'Privacy & Security', icon: Shield },
    { id: 'payment', title: 'Payment & Billing', icon: CreditCard },
    { id: 'owner', title: 'Owner Settings', icon: MapPin },
    { id: 'data', title: 'Data & Analytics', icon: BarChart3 },
    { id: 'support', title: 'Support & Legal', icon: HelpCircle }
  ];

  useEffect(() => {
    getUser();
  }, []);

  useEffect(() => {
    if (user) {
      loadSettings();
    }
  }, [user]);

  const getUser = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      router.push('/auth');
      return;
    }
    setUser(user);
  };

  const loadSettings = async () => {
    setLoading(true);
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('preferences')
        .eq('id', user.id)
        .single();

      if (profile?.preferences) {
        setSettings(prev => ({ ...prev, ...profile.preferences }));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (path, value) => {
    setSettings(prev => {
      const newSettings = { ...prev };
      if (path.includes('.')) {
        const [parent, child] = path.split('.');
        newSettings[parent] = { ...newSettings[parent], [child]: value };
      } else {
        newSettings[path] = value;
      }
      return newSettings;
    });
    setHasUnsavedChanges(true);
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ preferences: settings })
        .eq('id', user.id);

      if (error) throw error;

      setHasUnsavedChanges(false);
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const resetSection = (sectionId) => {
    // Reset section to defaults
    const defaults = {
      display: {
        theme: 'light',
        language: 'en',
        currency: 'EUR',
        mapStyle: 'streets',
        density: 'comfortable'
      },
      search: {
        defaultRadius: 1,
        autoLocation: true,
        defaultDuration: 2,
        priceRangeMin: 0,
        priceRangeMax: 10,
        preferredAmenities: [],
        vehicleAutoSelect: true
      },
      notifications: {
        pushNotifications: true,
        bookingNotifications: true,
        messageNotifications: true,
        marketingNotifications: false,
        bookingReminders: 60,
        soundAlerts: true
      }
      // Add other section defaults as needed
    };

    if (defaults[sectionId]) {
      setSettings(prev => ({ ...prev, ...defaults[sectionId] }));
      setHasUnsavedChanges(true);
    }
  };

  const exportData = async () => {
    try {
      const response = await fetch('/api/settings/export');
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `parkshift-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Data exported successfully');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    }
  };

  const deleteAccount = () => {
    const confirmed = confirm(
      'Are you sure you want to delete your account? This action cannot be undone. You will need to contact support@parkshift.be to complete the deletion.'
    );
    
    if (confirmed) {
      window.location.href = 'mailto:support@parkshift.be?subject=Account Deletion Request&body=I would like to delete my ParkShift account. User ID: ' + user.id;
    }
  };

  const handleThemeChange = (newTheme) => {
    switch (newTheme) {
      case 'light':
        setLightTheme();
        break;
      case 'dark':
        setDarkTheme();
        break;
      case 'auto':
        setAutoTheme();
        break;
    }
    updateSetting('theme', newTheme);
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
            <p className="text-gray-600 dark:text-gray-400">Customize your ParkShift experience</p>
          </div>
          
          <div className="flex gap-3">
            {hasUnsavedChanges && (
              <button
                onClick={saveSettings}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                <Save size={16} />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-64 space-y-2">
            {sections.map(section => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeSection === section.id
                      ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{section.title}</span>
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              {/* Display & Interface Settings */}
              {activeSection === 'display' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Display & Interface</h2>
                    <button
                      onClick={() => resetSection('display')}
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                    >
                      Reset to defaults
                    </button>
                  </div>

                  {/* Theme */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Theme</label>
                    <div className="flex gap-3">
                      {[
                        { value: 'light', label: 'Light', icon: Sun },
                        { value: 'dark', label: 'Dark', icon: Moon },
                        { value: 'auto', label: 'Auto', icon: Monitor }
                      ].map(option => {
                        const Icon = option.icon;
                        return (
                          <button
                            key={option.value}
                            onClick={() => handleThemeChange(option.value)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                              theme === option.value
                                ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            <Icon size={16} />
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Language */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Language</label>
                    <select
                      value={settings.language}
                      onChange={(e) => updateSetting('language', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="en">English</option>
                      <option value="nl" disabled>Dutch (Coming soon)</option>
                      <option value="fr" disabled>French (Coming soon)</option>
                    </select>
                  </div>

                  {/* Map Style */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Map Style</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: 'streets', label: 'Streets' },
                        { value: 'satellite', label: 'Satellite' },
                        { value: 'hybrid', label: 'Hybrid' }
                      ].map(option => (
                        <button
                          key={option.value}
                          onClick={() => updateSetting('mapStyle', option.value)}
                          className={`p-3 rounded-lg border text-center transition-colors ${
                            settings.mapStyle === option.value
                              ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Density */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">List Density</label>
                    <div className="flex gap-3">
                      {[
                        { value: 'compact', label: 'Compact' },
                        { value: 'comfortable', label: 'Comfortable' }
                      ].map(option => (
                        <button
                          key={option.value}
                          onClick={() => updateSetting('density', option.value)}
                          className={`px-4 py-2 rounded-lg border transition-colors ${
                            settings.density === option.value
                              ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Search & Booking Settings */}
              {activeSection === 'search' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Search & Booking</h2>
                    <button
                      onClick={() => resetSection('search')}
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                    >
                      Reset to defaults
                    </button>
                  </div>

                  {/* Default Search Radius */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Default Search Radius: {settings.defaultRadius}km
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="10"
                      step="0.5"
                      value={settings.defaultRadius}
                      onChange={(e) => updateSetting('defaultRadius', parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <span>0.5km</span>
                      <span>10km</span>
                    </div>
                  </div>

                  {/* Auto Location */}
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Auto-detect Location</label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Automatically use your current location for searches</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.autoLocation}
                        onChange={(e) => updateSetting('autoLocation', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
                    </label>
                  </div>

                  {/* Default Duration */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Default Booking Duration</label>
                    <select
                      value={settings.defaultDuration}
                      onChange={(e) => updateSetting('defaultDuration', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="1">1 hour</option>
                      <option value="2">2 hours</option>
                      <option value="4">4 hours</option>
                      <option value="24">1 day</option>
                    </select>
                  </div>

                  {/* Price Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Preferred Price Range: €{settings.priceRangeMin} - €{settings.priceRangeMax}/hour
                    </label>
                    <div className="space-y-2">
                      <input
                        type="range"
                        min="0"
                        max="20"
                        step="0.5"
                        value={settings.priceRangeMax}
                        onChange={(e) => updateSetting('priceRangeMax', parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                      />
                    </div>
                  </div>

                  {/* Preferred Amenities */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Default Filters</label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { key: 'evCharging', label: 'EV Charging' },
                        { key: 'covered', label: 'Covered' },
                        { key: 'security', label: 'Security' },
                        { key: 'accessibility', label: 'Accessible' }
                      ].map(amenity => (
                        <label key={amenity.key} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.preferredAmenities.includes(amenity.key)}
                            onChange={(e) => {
                              const amenities = e.target.checked
                                ? [...settings.preferredAmenities, amenity.key]
                                : settings.preferredAmenities.filter(a => a !== amenity.key);
                              updateSetting('preferredAmenities', amenities);
                            }}
                            className="w-4 h-4 text-green-600 border-gray-300 dark:border-gray-600 rounded focus:ring-green-500 dark:focus:ring-green-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{amenity.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Vehicle Auto-select */}
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Auto-select Primary Vehicle</label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Automatically select your primary vehicle in searches</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.vehicleAutoSelect}
                        onChange={(e) => updateSetting('vehicleAutoSelect', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
                    </label>
                  </div>
                </div>
              )}

              {/* Notification Settings */}
              {activeSection === 'notifications' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Notifications</h2>
                    <button
                      onClick={() => resetSection('notifications')}
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                    >
                      Reset to defaults
                    </button>
                  </div>

                  {/* Push Notifications */}
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Browser Push Notifications</label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Receive notifications even when the app is closed</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.pushNotifications}
                        onChange={(e) => updateSetting('pushNotifications', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
                    </label>
                  </div>

                  {/* Notification Types */}
                  <div className="space-y-4">
                    {[
                      { key: 'bookingNotifications', label: 'Booking Updates', desc: 'Confirmations, cancellations, changes' },
                      { key: 'messageNotifications', label: 'New Messages', desc: 'Chat messages from other users' },
                      { key: 'marketingNotifications', label: 'Marketing & Updates', desc: 'Promotional offers and feature updates' }
                    ].map(notif => (
                      <div key={notif.key} className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{notif.label}</label>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{notif.desc}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings[notif.key]}
                            onChange={(e) => updateSetting(notif.key, e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>

                  {/* Booking Reminders */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Booking Reminders</label>
                    <select
                      value={settings.bookingReminders}
                      onChange={(e) => updateSetting('bookingReminders', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="0">No reminders</option>
                      <option value="30">30 minutes before</option>
                      <option value="60">1 hour before</option>
                      <option value="120">2 hours before</option>
                      <option value="1440">1 day before</option>
                    </select>
                  </div>

                  {/* Sound Alerts */}
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Sound Alerts</label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Play sound when receiving notifications</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.soundAlerts}
                        onChange={(e) => updateSetting('soundAlerts', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
                    </label>
                  </div>
                </div>
              )}

              {/* Privacy & Security Settings */}
              {activeSection === 'privacy' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Privacy & Security</h2>

                  {/* Profile Visibility */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">Profile Visibility</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Show Phone Number</label>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Allow other users to see your phone number</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.profileVisibility.showPhone}
                            onChange={(e) => updateSetting('profileVisibility.showPhone', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Show Full Name</label>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Display your full name to other users</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.profileVisibility.showFullName}
                            onChange={(e) => updateSetting('profileVisibility.showFullName', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Location Sharing */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Location Sharing</label>
                    <div className="space-y-2">
                      {[
                        { value: 'precise', label: 'Precise Location', desc: 'Share exact location' },
                        { value: 'approximate', label: 'Approximate Location', desc: 'Share general area only' },
                        { value: 'none', label: 'No Location Sharing', desc: 'Do not share location data' }
                      ].map(option => (
                        <label key={option.value} className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="radio"
                            name="locationSharing"
                            value={option.value}
                            checked={settings.locationSharing === option.value}
                            onChange={(e) => updateSetting('locationSharing', e.target.value)}
                            className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500 dark:focus:ring-green-600 dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"
                          />
                          <div>
                            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{option.label}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{option.desc}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Data Export */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">Data Management</h3>
                    <div className="space-y-4">
                      <button
                        onClick={exportData}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Download size={16} />
                        Export My Data
                      </button>
                      
                      <button
                        onClick={deleteAccount}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <Trash2 size={16} />
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment & Billing Settings */}
              {activeSection === 'payment' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Payment & Billing</h2>

                  {/* Auto Payment */}
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Automatic Payment</label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Automatically charge default payment method for bookings</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.autoPayment}
                        onChange={(e) => updateSetting('autoPayment', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
                    </label>
                  </div>

                  {/* Receipt Preferences */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Receipt Delivery</label>
                    <select
                      value={settings.receiptPreferences}
                      onChange={(e) => updateSetting('receiptPreferences', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="email">Email receipts</option>
                      <option value="app">In-app only</option>
                      <option value="both">Email and in-app</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Owner Settings */}
              {activeSection === 'owner' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Owner Settings</h2>

                  {/* Auto Accept Bookings */}
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Auto-accept Bookings</label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Automatically approve booking requests without manual review</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.autoAcceptBookings}
                        onChange={(e) => updateSetting('autoAcceptBookings', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
                    </label>
                  </div>

                  {/* Response Time Target */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Response Time Target</label>
                    <select
                      value={settings.responseTimeTarget}
                      onChange={(e) => updateSetting('responseTimeTarget', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="1">1 hour</option>
                      <option value="4">4 hours</option>
                      <option value="24">24 hours</option>
                      <option value="48">48 hours</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Data & Analytics Settings */}
              {activeSection === 'data' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Data & Analytics</h2>

                  {/* Usage Analytics */}
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Usage Analytics</label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Allow anonymous usage data collection to improve the service</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.usageAnalytics}
                        onChange={(e) => updateSetting('usageAnalytics', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
                    </label>
                  </div>

                  {/* Location History */}
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Location History</label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Keep search history for personalized recommendations</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.locationHistory}
                        onChange={(e) => updateSetting('locationHistory', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
                    </label>
                  </div>

                  {/* Booking History Retention */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Booking History Retention</label>
                    <select
                      value={settings.bookingHistoryRetention}
                      onChange={(e) => updateSetting('bookingHistoryRetention', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="365">1 year</option>
                      <option value="730">2 years</option>
                      <option value="0">Forever</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Support & Legal Settings */}
              {activeSection === 'support' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Support & Legal</h2>

                  {/* Emergency Contact */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">Emergency Contact</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                        <input
                          type="text"
                          value={settings.emergencyContact.name}
                          onChange={(e) => updateSetting('emergencyContact.name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          placeholder="Emergency contact name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                        <input
                          type="tel"
                          value={settings.emergencyContact.phone}
                          onChange={(e) => updateSetting('emergencyContact.phone', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          placeholder="+32 123 45 67 89"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Accessibility Needs */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Accessibility Requirements</label>
                    <textarea
                      value={settings.accessibilityNeeds}
                      onChange={(e) => updateSetting('accessibilityNeeds', e.target.value)}
                      placeholder="Describe any accessibility requirements or needs..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>

                  {/* Communication Preferences */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Communication Preferences</label>
                    <div className="space-y-2">
                      {[
                        { value: 'in-app', label: 'In-app notifications' },
                        { value: 'email', label: 'Email updates' },
                        { value: 'sms', label: 'SMS notifications' }
                      ].map(option => (
                        <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.communicationPreferences.includes(option.value)}
                            onChange={(e) => {
                              const prefs = e.target.checked
                                ? [...settings.communicationPreferences, option.value]
                                : settings.communicationPreferences.filter(p => p !== option.value);
                              updateSetting('communicationPreferences', prefs);
                            }}
                            className="w-4 h-4 text-green-600 border-gray-300 dark:border-gray-600 rounded focus:ring-green-500 dark:focus:ring-green-600 dark:ring-offset-gray-800"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Legal Links */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">Legal & Support</h3>
                    <div className="space-y-2">
                      {[
                        { label: 'Privacy Policy', href: '/privacy' },
                        { label: 'Terms of Service', href: '/terms' },
                        { label: 'FAQ & Help', href: '/faq' },
                        { label: 'Contact Support', href: 'mailto:support@parkshift.be' }
                      ].map(link => (
                        <a
                          key={link.label}
                          href={link.href}
                          className="block text-sm text-green-600 hover:text-green-700 underline"
                          target={link.href.startsWith('mailto:') ? '_self' : '_blank'}
                        >
                          {link.label}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Unsaved Changes Warning */}
        {hasUnsavedChanges && (
          <div className="fixed bottom-4 right-4 bg-orange-100 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 shadow-lg">
            <p className="text-orange-800 dark:text-orange-200 text-sm font-medium">You have unsaved changes</p>
            <div className="flex gap-2 mt-2">
              <button
                onClick={saveSettings}
                disabled={saving}
                className="px-3 py-1 bg-orange-600 text-white rounded text-sm hover:bg-orange-700 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving...' : 'Save Now'}
              </button>
              <button
                onClick={() => {
                  setHasUnsavedChanges(false);
                  loadSettings();
                }}
                className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors"
              >
                Discard
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
