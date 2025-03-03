import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Image as ImageIcon, Calendar, Clock, AlertCircle } from 'lucide-react';
import { postStorage, processImage, EDUCATIONAL_LEVELS, storeFile } from '../../lib/storage';
import type { Post } from '../../types';

export const EditPost: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [scheduledFor, setScheduledFor] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const loadPost = async () => {
      if (!id) return;

      try {
        const posts = await postStorage.getAllPosts();
        const foundPost = posts.find(p => p.id === id);

        if (foundPost) {
          setPost(foundPost);
          setTitle(foundPost.title);
          setContent(foundPost.content);
          setImageUrl(foundPost.coverImage);
          setVideoUrl(foundPost.videoUrl);
          setSelectedLevels(foundPost.educationalLevel || []);

          if (foundPost.scheduledFor) {
            const date = new Date(foundPost.scheduledFor);
            setScheduledFor(date.toISOString().split('T')[0]);
            setScheduledTime(date.toTimeString().slice(0, 5));
          }
        } else {
          setError('Post not found');
        }
      } catch (error) {
        console.error('Failed to load post:', error);
        setError('Failed to load post');
      } finally {
        setLoading(false);
      }
    };

    loadPost();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      if (!id) throw new Error('Post ID is missing');

      const updatedPost = await postStorage.updatePost(id, {
        title,
        content,
        coverImage: imageUrl,
        videoUrl: videoUrl,
        educationalLevel: selectedLevels,
      });

      if (!updatedPost) throw new Error('Failed to update post');

      navigate('/admin/posts');
    } catch (err) {
      console.error('Error updating post:', err);
      setError(err instanceof Error ? err.message : 'Failed to update post');
    } finally {
      setSaving(false);
    }
  };

  const handleLevelChange = (level: string) => {
    setSelectedLevels(prev => {
      if (level === 'All School') {
        return ['All School'];
      }
      const newLevels = prev.includes(level)
        ? prev.filter(l => l !== level)
        : [...prev.filter(l => l !== 'All School'), level];
      return newLevels.length === 0 ? ['All School'] : newLevels;
    });
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, resource: "image" | "video" = "image") => {
    e.preventDefault();
    setIsDragging(false);
    setError('');

    const file = e.dataTransfer.files[0];
    if (!file) return;

    try {
      const url = await storeFile(file, resource);
      if(resource === "image"){
        setImageUrl(url);
      }else{
        setVideoUrl(url)
      }
    } catch (err) {
      console.error('Resource processing error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process resource');
    }
  }, []);

  const handleVideoInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    try {
      const url = await storeFile(file, "video");
      setVideoUrl(url);
    } catch (err) {
      console.error('Video processing error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save video');
    }
  };


  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    try {
      const base64Image = await processImage(file);
      setImageUrl(base64Image);
    } catch (err) {
      console.error('Image processing error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process image');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded">
          Post not found
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Edit Post</h2>
      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded mb-4 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-1">
            Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 rounded-md border border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Cover Image
          </label>
          <div
            className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
              isDragging
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-gray-700 hover:border-gray-600'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, "image")}
          >
            <input
              type="file"
              accept="image/*"
              onChange={handleFileInput}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="text-center">
              {imageUrl ? (
                <div className="relative group">
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="max-h-48 mx-auto rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                    <p className="text-white text-sm">Click or drag to change image</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="mx-auto w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-gray-400" />
                  </div>
                  <div className="text-sm text-gray-400">
                    <p className="font-medium">Click to upload or drag and drop</p>
                    <p>PNG, JPG or GIF (max. 5MB)</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Video
          </label>
          <div
            className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
              isDragging
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-gray-700 hover:border-gray-600'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, "video")}
          >
            <input
              type="file"
              accept="video/*"
              max={10000}
              onChange={handleVideoInput}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={loading}
            />
            <div className="text-center">
              {videoUrl ? (
                <div className="relative group">
                  <video
                    src={videoUrl}
                    className="max-h-48 mx-auto rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                    <p className="text-white text-sm">Click or drag to change video</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="mx-auto w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-gray-400" />
                  </div>
                  <div className="text-sm text-gray-400">
                    <p className="font-medium">Click to upload or drag and drop</p>
                    <p>MP4 or WebM (max. 10MB)</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="scheduledDate" className="block text-sm font-medium mb-1">
              Schedule Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="date"
                id="scheduledDate"
                value={scheduledFor}
                onChange={(e) => setScheduledFor(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-gray-800 rounded-md border border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label htmlFor="scheduledTime" className="block text-sm font-medium mb-1">
              Schedule Time
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="time"
                id="scheduledTime"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-gray-800 rounded-md border border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Educational Levels
          </label>
          <div className="space-y-6">
            <div>
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={selectedLevels.includes('All School')}
                  onChange={() => handleLevelChange('All School')}
                  className="form-checkbox h-4 w-4 text-blue-500 rounded border-gray-700 bg-gray-800 focus:ring-2 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm">All School</span>
              </label>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-medium text-blue-400 uppercase tracking-wider">National Section</h4>
              {Object.entries(EDUCATIONAL_LEVELS.NATIONAL).map(([category, levels]) => (
                <div key={category} className="space-y-2">
                  <h5 className="text-sm font-medium text-gray-400">{category}</h5>
                  <div className="flex flex-wrap gap-4">
                    {levels.map(level => (
                      <label key={level} className="inline-flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedLevels.includes(level)}
                          onChange={() => handleLevelChange(level)}
                          className="form-checkbox h-4 w-4 text-blue-500 rounded border-gray-700 bg-gray-800 focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm">{level}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-medium text-blue-400 uppercase tracking-wider">American Section</h4>
              {Object.entries(EDUCATIONAL_LEVELS.AMERICAN).map(([category, levels]) => (
                <div key={category} className="space-y-2">
                  <h5 className="text-sm font-medium text-gray-400">{category}</h5>
                  <div className="flex flex-wrap gap-4">
                    {levels.map(level => (
                      <label key={level} className="inline-flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedLevels.includes(level)}
                          onChange={() => handleLevelChange(level)}
                          className="form-checkbox h-4 w-4 text-blue-500 rounded border-gray-700 bg-gray-800 focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm">{level}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium mb-1">
            Content
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 rounded-md border border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={10}
            required
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};