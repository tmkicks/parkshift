import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { createClientComponentClient, createPagesBrowserClient  } from '@supabase/auth-helpers-nextjs';
import Layout from '../components/Layout';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  Euro, 
  Car, 
  MapPin, 
  Download,
  Clock,
  Star,
  Users
} from 'lucide-react';
import { format, subDays, subMonths } from 'date-fns';

export default function AnalyticsPage() {
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState('renter'); // 'renter' or 'owner'
  const [timeRange, setTimeRange] = useState('30'); // days
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    bookings: [],
    revenue: [],
    spaces: [],
    summary: {}
  });
  const router = useRouter();
  const supabase = createPagesBrowserClient();

  useEffect(() => {
    getUser();
  }, []);

  useEffect(() => {
    if (user) {
      loadAnalytics();
    }
  }, [user, userType, timeRange]);

  const getUser = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      router.push('/auth');
      return;
    }
    setUser(user);
  };

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/analytics?type=${userType}&range=${timeRange}`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async () => {
    try {
      const response = await fetch(`/api/analytics/export?type=${userType}&range=${timeRange}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `parkshift-${userType}-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error downloading report:', error);
    }
  };

  const StatCard = ({ title, value, change, icon: Icon, color = 'green' }) => (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {change !== undefined && (
            <p className={`text-sm mt-1 flex items-center gap-1 ${
              change >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              <TrendingUp size={16} className={change < 0 ? 'rotate-180' : ''} />
              {Math.abs(change)}% from last period
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full bg-${color}-100`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
      </div>
    </div>
  );

  if (!user) {
    return null;
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
            <p className="text-gray-600">Track your ParkShift activity and performance</p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={downloadReport}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              <Download size={16} />
              Export Report
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          {/* User Type Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setUserType('renter')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                userType === 'renter'
                  ? 'bg-white text-green-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Car className="w-4 h-4 inline mr-1" />
              As Renter
            </button>
            <button
              onClick={() => setUserType('owner')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                userType === 'owner'
                  ? 'bg-white text-green-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <MapPin className="w-4 h-4 inline mr-1" />
              As Owner
            </button>
          </div>

          {/* Time Range */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 3 months</option>
            <option value="365">Last year</option>
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {userType === 'renter' ? (
                <>
                  <StatCard
                    title="Total Bookings"
                    value={analytics.summary.totalBookings || 0}
                    change={analytics.summary.bookingsChange}
                    icon={Calendar}
                    color="blue"
                  />
                  <StatCard
                    title="Total Spent"
                    value={`€${analytics.summary.totalSpent || 0}`}
                    change={analytics.summary.spentChange}
                    icon={Euro}
                    color="green"
                  />
                  <StatCard
                    title="Hours Parked"
                    value={analytics.summary.totalHours || 0}
                    change={analytics.summary.hoursChange}
                    icon={Clock}
                    color="purple"
                  />
                  <StatCard
                    title="Favorite Locations"
                    value={analytics.summary.favoriteLocations || 0}
                    icon={MapPin}
                    color="orange"
                  />
                </>
              ) : (
                <>
                  <StatCard
                    title="Total Revenue"
                    value={`€${analytics.summary.totalRevenue || 0}`}
                    change={analytics.summary.revenueChange}
                    icon={Euro}
                    color="green"
                  />
                  <StatCard
                    title="Active Listings"
                    value={analytics.summary.activeListings || 0}
                    change={analytics.summary.listingsChange}
                    icon={MapPin}
                    color="blue"
                  />
                  <StatCard
                    title="Occupancy Rate"
                    value={`${analytics.summary.occupancyRate || 0}%`}
                    change={analytics.summary.occupancyChange}
                    icon={BarChart3}
                    color="purple"
                  />
                  <StatCard
                    title="Avg Rating"
                    value={analytics.summary.avgRating ? analytics.summary.avgRating.toFixed(1) : '0.0'}
                    change={analytics.summary.ratingChange}
                    icon={Star}
                    color="yellow"
                  />
                </>
              )}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue/Spending Chart */}
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {userType === 'renter' ? 'Spending Over Time' : 'Revenue Over Time'}
                </h3>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  {/* Placeholder for chart - would implement with Chart.js or similar */}
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>Chart visualization would go here</p>
                    <p className="text-sm">Integration with Chart.js recommended</p>
                  </div>
                </div>
              </div>

              {/* Activity Chart */}
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {userType === 'renter' ? 'Booking Activity' : 'Space Utilization'}
                </h3>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <TrendingUp className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>Activity chart would go here</p>
                    <p className="text-sm">Line chart showing trends over time</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Recent {userType === 'renter' ? 'Bookings' : 'Activity'}
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Date</th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">
                        {userType === 'renter' ? 'Location' : 'Space'}
                      </th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Duration</th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Amount</th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {analytics.bookings.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center py-8 text-gray-500">
                          No activity found for the selected period
                        </td>
                      </tr>
                    ) : (
                      analytics.bookings.slice(0, 10).map((booking, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="py-4 px-6 text-sm text-gray-900">
                            {format(new Date(booking.created_at), 'MMM dd, yyyy')}
                          </td>
                          <td className="py-4 px-6 text-sm text-gray-900">
                            {booking.space?.title || 'N/A'}
                          </td>
                          <td className="py-4 px-6 text-sm text-gray-600">
                            {Math.ceil((new Date(booking.end_datetime) - new Date(booking.start_datetime)) / (1000 * 60 * 60))}h
                          </td>
                          <td className="py-4 px-6 text-sm font-medium text-gray-900">
                            €{booking.total_amount}
                          </td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              booking.status === 'completed' 
                                ? 'bg-green-100 text-green-800'
                                : booking.status === 'active'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {booking.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
