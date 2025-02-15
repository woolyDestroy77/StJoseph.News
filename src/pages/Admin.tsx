import React, { useState, useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { PlusCircle, FileText, Settings, Activity, BarChart3 } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { NewPost } from './admin/NewPost';
import { EditPost } from './admin/EditPost';
import { PostsManagement } from './admin/PostsManagement';
import { Settings as SettingsPage } from './admin/Settings';
import { postStorage } from '../lib/storage';

const AdminDashboard: React.FC = () => {
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [activityData, statsData] = await Promise.all([
          postStorage.getRecentActivity(),
          postStorage.getStatistics()
        ]);
        setRecentActivity(activityData);
        setStats(statsData);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return 'Date unavailable';
      
      const date = parseISO(dateString);
      if (!isValid(date)) return 'Date unavailable';
      
      return format(date, 'MMM d, yyyy h:mm a');
    } catch (error) {
      console.error('Date parsing error:', error);
      return 'Date unavailable';
    }
  };

  // Prepare data for the educational levels chart
  const prepareChartData = () => {
    if (!stats?.postsByLevel) return [];

    return Object.entries(stats.postsByLevel)
      .map(([level, count]) => ({
        level: level.length > 15 ? `${level.slice(0, 15)}...` : level,
        posts: count as number,
        fullName: level // Store full name for tooltip
      }))
      .sort((a, b) => b.posts - a.posts); // Sort by post count descending
  };

  const chartData = prepareChartData();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded">
          {error}
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-800 border border-gray-700 p-3 rounded-lg shadow-lg">
          <p className="text-gray-300 mb-1">{data.fullName}</p>
          <p className="text-blue-400 font-semibold">
            {data.posts} {data.posts === 1 ? 'post' : 'posts'}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-900 p-6 rounded-lg">
          <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-4">
            <Link
              to="/admin/posts/new"
              className="flex items-center space-x-2 text-blue-400 hover:text-blue-300"
            >
              <PlusCircle size={20} />
              <span>Create New Post</span>
            </Link>
            <Link
              to="/admin/posts"
              className="flex items-center space-x-2 text-blue-400 hover:text-blue-300"
            >
              <FileText size={20} />
              <span>Manage Posts</span>
            </Link>
            <Link
              to="/admin/settings"
              className="flex items-center space-x-2 text-blue-400 hover:text-blue-300"
            >
              <Settings size={20} />
              <span>Settings</span>
            </Link>
          </div>
        </div>
        
        <div className="bg-gray-900 p-6 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Activity className="text-blue-400" size={24} />
              <h3 className="text-xl font-semibold">Recent Activity</h3>
            </div>
          </div>
          <div className="space-y-4 max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800">
            {recentActivity.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No recent activity</p>
            ) : (
              recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3 group">
                  <div className="w-2 h-2 mt-2 rounded-full bg-blue-400 flex-shrink-0" />
                  <div className="flex-grow">
                    <p className="text-sm text-gray-300">
                      <span className="font-medium text-white">{activity.user}</span>
                      {' '}{activity.action}{' '}
                      <span className="font-medium text-white">"{activity.post}"</span>
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(activity.timestamp)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="bg-gray-900 p-6 rounded-lg">
          <div className="flex items-center space-x-2 mb-4">
            <BarChart3 className="text-blue-400" size={24} />
            <h3 className="text-xl font-semibold">Statistics</h3>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-800 p-4 rounded-lg">
                <p className="text-sm text-gray-400">Total Posts</p>
                <p className="text-2xl font-bold">{stats?.totalPosts || 0}</p>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg">
                <p className="text-sm text-gray-400">Educational Levels</p>
                <p className="text-2xl font-bold">
                  {Object.keys(stats?.postsByLevel || {}).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 p-6 rounded-lg">
        <h3 className="text-xl font-semibold mb-6">Posts by Educational Level</h3>
        {chartData.length > 0 ? (
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <XAxis
                  dataKey="level"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fill: '#9898b0', fontSize: 12 }}
                />
                <YAxis
                  tick={{ fill: '#9898b0' }}
                  axisLine={{ stroke: '#2d2d3d' }}
                  tickLine={{ stroke: '#2d2d3d' }}
                />
                <Tooltip
                  content={CustomTooltip}
                  cursor={{ fill: 'rgba(96, 165, 250, 0.1)' }}
                />
                <Bar
                  dataKey="posts"
                  fill="#60a5fa"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={50}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            No data available
          </div>
        )}
      </div>
    </div>
  );
};

export const Admin: React.FC = () => {
  return (
    <Routes>
      <Route index element={<AdminDashboard />} />
      <Route path="posts" element={<PostsManagement />} />
      <Route path="posts/new" element={<NewPost />} />
      <Route path="posts/edit/:id" element={<EditPost />} />
      <Route path="settings" element={<SettingsPage />} />
    </Routes>
  );
};