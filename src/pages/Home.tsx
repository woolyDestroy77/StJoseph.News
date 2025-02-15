import React, { useState, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { Search, Filter, SortAsc, SortDesc } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { postStorage, EDUCATIONAL_LEVELS } from '../lib/storage';
import { formatError } from '../lib/supabase';
import type { Post } from '../types';

export const Home: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('All School');
  const [sortBy, setSortBy] = useState<'date' | 'comments'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const { ref, inView } = useInView();

  useEffect(() => {
    const loadPosts = async () => {
      if (retryCount > 3) {
        setError('Unable to load posts after multiple attempts. Please check your connection and try again.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');
      
      try {
        const fetchedPosts = await postStorage.getAllPosts({
          level: selectedLevel,
          search: searchTerm,
          sortBy,
          sortOrder
        });
        setPosts(fetchedPosts);
        setError('');
      } catch (error) {
        console.error('Failed to load posts:', error);
        const errorMessage = formatError(error);
        setError(errorMessage);
        
        // Retry with exponential backoff
        if (retryCount < 3) {
          const delay = Math.pow(2, retryCount) * 1000 + Math.random() * 200;
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, delay);
        }
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, [searchTerm, selectedLevel, sortBy, sortOrder, retryCount]);

  // Create a flattened list of all educational levels
  const allLevels = [
    'All School',
    ...Object.values(EDUCATIONAL_LEVELS.NATIONAL).flat(),
    ...Object.values(EDUCATIONAL_LEVELS.AMERICAN).flat()
  ];

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const handleRetry = () => {
    setRetryCount(0);
    setError('');
  };

  return (
    <div className="max-w-3xl mx-auto px-4">
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search articles..."
              className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg hover:bg-gray-800"
          >
            <Filter className="mr-2" />
            Filter
          </button>
        </div>

        {showFilters && (
          <div className="bg-gray-900 p-4 rounded-lg space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Educational Level</label>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {allLevels.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Sort By</label>
              <div className="flex items-center space-x-4">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="date">Date</option>
                  <option value="comments">Comments</option>
                </select>
                <button
                  onClick={toggleSortOrder}
                  className="p-2 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700"
                >
                  {sortOrder === 'asc' ? <SortAsc /> : <SortDesc />}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded mb-4">
            {error}
          </div>
          <button
            onClick={handleRetry}
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {posts.map((post) => (
            <Card key={post.id} post={post} />
          ))}
          {posts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400">No posts found</p>
            </div>
          )}
        </div>
      )}

      <div ref={ref} className="h-10" />
    </div>
  );
};