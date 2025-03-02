import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Image as ImageIcon, AlertCircle } from 'lucide-react';
import { postStorage, processImage, EDUCATIONAL_LEVELS, storeFile } from '../../lib/storage';

export const NewPost: React.FC = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [selectedLevels, setSelectedLevels] = useState<string[]>(['All School']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content || !imageUrl || selectedLevels.length === 0) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await postStorage.createPost({
        title,
        content,
        coverImage: imageUrl,
        educationalLevel: selectedLevels,
      });

      navigate('/admin/posts');
    } catch (err) {
      console.error('Error creating post:', err);
      setError(err instanceof Error ? err.message : 'Failed to create post');
    } finally {
      setLoading(false);
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

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
      console.log("File:", file)

    setError('');
    try {
      const base64Image = await storeFile(file, "image");
      setImageUrl(base64Image);
    } catch (err) {
      console.error('Image processing error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process image');
    }
  };

  const handleVideoInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
      console.log("File:", file)

    setError('');
    try {
      const base64Image = await storeFile(file, "video");
      setImageUrl(base64Image);
    } catch (err) {
      console.error('Video processing error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save video');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Create New Post</h2>
      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded mb-4 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 rounded-md border border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Cover Image <span className="text-red-500">*</span>
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
              disabled={loading}
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

        <div>
          <label className="block text-sm font-medium mb-2">
            Educational Levels <span className="text-red-500">*</span>
          </label>
          <div className="space-y-6">
            <div>
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={selectedLevels.includes('All School')}
                  onChange={() => handleLevelChange('All School')}
                  className="form-checkbox h-4 w-4 text-blue-500 rounded border-gray-700 bg-gray-800 focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
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
                          disabled={loading}
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
                          disabled={loading}
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
            Content <span className="text-red-500">*</span>
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 rounded-md border border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={10}
            required
            disabled={loading}
          />
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/admin/posts')}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Post'}
          </button>
        </div>
      </form>
    </div>
  );
};