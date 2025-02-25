import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Edit2, Trash2, PlusCircle, GraduationCap, AlertTriangle } from 'lucide-react';
import { postStorage } from '../../lib/storage';
import { format, isValid } from 'date-fns';
import type { Post } from '../../types';

export const PostsManagement: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const fetchedPosts = await postStorage.getAllPosts();
        setPosts(fetchedPosts);
      } catch (error) {
        console.error('Failed to load posts:', error);
        setError('Failed to load posts');
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, []);

  const handleDelete = (id: string) => {
    setPostToDelete(id);
  };

  const confirmDelete = async () => {
    if (postToDelete) {
      try {
        const success = await postStorage.deletePost(postToDelete);
        if (success) {
          const updatedPosts = await postStorage.getAllPosts();
          setPosts(updatedPosts);
          setPostToDelete(null);
        }
      } catch (error) {
        console.error('Failed to delete post:', error);
        setError('Failed to delete post');
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return isValid(date) ? format(date, 'MMM d, yyyy h:mm a') : 'Invalid date';
  };

  const getExcerpt = (content: string, length: number = 50) => {
    return content.length > length ? `${content.slice(0, length)}...` : content;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Manage Posts</h2>
        <Link
          to="/admin/posts/new"
          className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
        >
          <PlusCircle size={20} />
          <span>New Post</span>
        </Link>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded mb-4">
          {error}
        </div>
      )}

      {posts.length === 0 ? (
        <div className="text-center py-12 bg-gray-900 rounded-lg">
          <p className="text-gray-400 mb-4">No posts yet</p>
          <Link
            to="/admin/posts/new"
            className="text-blue-400 hover:text-blue-300 flex items-center justify-center space-x-2"
          >
            <PlusCircle size={20} />
            <span>Create your first post</span>
          </Link>
        </div>
      ) : (
        <div className="bg-gray-900 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="bg-gray-800">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Educational Levels
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Author
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider w-24">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-800/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {/* Image Wrapper */}
                        <div className="w-16 h-16 flex-shrink-0 overflow-hidden rounded-lg">
                          <img
                            src={post.coverImage}
                            alt={post.title}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Post Details */}
                        <div className="ml-4 min-w-0 flex-shrink">
                          <div className="text-sm font-medium text-white truncate">
                            {post.title}
                          </div>
                          <div className="text-sm text-gray-400 truncate">
                            {getExcerpt(post.content)}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {post.educationalLevel?.map((level) => (
                          <span
                            key={level}
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400"
                          >
                            <GraduationCap size={12} className="mr-1" />
                            {level}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {formatDate(post.publishedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {post.author.name}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-3">
                        <button
                          onClick={() => handleDelete(post.id)}
                          className="text-red-400 hover:text-red-300 transition-colors p-1"
                          title="Delete post"
                        >
                          <Trash2 size={18} />
                        </button>
                        <Link
                          to={`/admin/posts/edit/${post.id}`}
                          className="text-blue-400 hover:text-blue-300 transition-colors p-1"
                          title="Edit post"
                        >
                          <Edit2 size={18} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {postToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center space-x-3 text-red-400 mb-4">
              <AlertTriangle size={24} />
              <h3 className="text-lg font-semibold">Confirm Delete</h3>
            </div>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete this post? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setPostToDelete(null)}
                className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-medium bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};