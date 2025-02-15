import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { postStorage } from '../../lib/storage';
import type { BlogSettings } from '../../types';

export const Settings: React.FC = () => {
  const [settings, setSettings] = useState<BlogSettings | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await postStorage.getSettings();
        setSettings(settings);
      } catch (error) {
        console.error('Failed to load settings:', error);
        setError('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setSaving(true);
    setError('');

    try {
      const updatedSettings = await postStorage.updateSettings(settings);
      setSettings(updatedSettings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!settings) return;

    const { name, value } = e.target;
    if (name.startsWith('social.')) {
      const social = name.split('.')[1];
      setSettings(prev => prev ? {
        ...prev,
        socialLinks: {
          ...prev.socialLinks,
          [social]: value
        }
      } : null);
    } else {
      setSettings(prev => prev ? {
        ...prev,
        [name]: value
      } : null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded">
          Failed to load settings
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Blog Settings</h2>
        {saved && (
          <div className="text-green-400 flex items-center">
            <span className="mr-2">✓</span> Settings saved
          </div>
        )}
        {error && (
          <div className="text-red-400">
            {error}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-gray-900 p-6 rounded-lg space-y-6">
          <h3 className="text-lg font-semibold mb-4">General Settings</h3>
          
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-1">
              Blog Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={settings.title}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-800 rounded-md border border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-1">
              Blog Description
            </label>
            <textarea
              id="description"
              name="description"
              value={settings.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 bg-gray-800 rounded-md border border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="postsPerPage" className="block text-sm font-medium mb-1">
              Posts Per Page
            </label>
            <input
              type="number"
              id="postsPerPage"
              name="postsPerPage"
              value={settings.postsPerPage}
              onChange={handleChange}
              min={1}
              max={50}
              className="w-full px-3 py-2 bg-gray-800 rounded-md border border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="bg-gray-900 p-6 rounded-lg space-y-6">
          <h3 className="text-lg font-semibold mb-4">Author Settings</h3>
          
          <div>
            <label htmlFor="defaultAuthorName" className="block text-sm font-medium mb-1">
              Default Author Name
            </label>
            <input
              type="text"
              id="defaultAuthorName"
              name="defaultAuthorName"
              value={settings.defaultAuthorName}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-800 rounded-md border border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label htmlFor="defaultAuthorEmail" className="block text-sm font-medium mb-1">
              Default Author Email
            </label>
            <input
              type="email"
              id="defaultAuthorEmail"
              name="defaultAuthorEmail"
              value={settings.defaultAuthorEmail}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-800 rounded-md border border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
        </div>

        <div className="bg-gray-900 p-6 rounded-lg space-y-6">
          <h3 className="text-lg font-semibold mb-4">Social Links</h3>
          
          <div>
            <label htmlFor="twitter" className="block text-sm font-medium mb-1">
              Twitter URL
            </label>
            <input
              type="url"
              id="twitter"
              name="social.twitter"
              value={settings.socialLinks.twitter}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-800 rounded-md border border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="github" className="block text-sm font-medium mb-1">
              GitHub URL
            </label>
            <input
              type="url"
              id="github"
              name="social.github"
              value={settings.socialLinks.github}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-800 rounded-md border border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="linkedin" className="block text-sm font-medium mb-1">
              LinkedIn URL
            </label>
            <input
              type="url"
              id="linkedin"
              name="social.linkedin"
              value={settings.socialLinks.linkedin}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-gray-800 rounded-md border border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            <Save size={20} />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};