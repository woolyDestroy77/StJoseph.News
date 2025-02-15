import React, { useState } from 'react';
import { format, parseISO, isValid } from 'date-fns';
import { Clock, GraduationCap, ImageOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Post } from '../../types';

interface CardProps {
  post: Post;
}

export const Card: React.FC<CardProps> = ({ post }) => {
  const [imageError, setImageError] = useState(false);

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

  const handleImageError = () => {
    setImageError(true);
  };

  // Check if the image is a base64 string
  const isBase64Image = post.coverImage?.startsWith('data:image/');

  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden shadow-xl transition-transform duration-300 hover:-translate-y-1 hover:shadow-2xl">
      <div className="aspect-[16/9] relative bg-gray-800">
        {imageError ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <ImageOff className="w-12 h-12 mx-auto mb-2" />
              <p className="text-sm">Image not available</p>
            </div>
          </div>
        ) : (
          <div className="w-full h-full">
            {isBase64Image ? (
              <img
                src={post.coverImage}
                alt={post.title}
                className="w-full h-full object-cover"
                onError={handleImageError}
                loading="lazy"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <ImageOff className="w-12 h-12 mx-auto mb-2" />
                  <p className="text-sm">Invalid image format</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="p-6 relative">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold text-lg">
            {post.author.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <h4 className="font-medium text-white">{post.author.name || 'Unknown author'}</h4>
            <div className="flex items-center space-x-2 text-gray-400 text-sm">
              <Clock size={14} />
              <span>{formatDate(post.publishedAt)}</span>
            </div>
          </div>
        </div>

        <h3 className="text-2xl font-bold text-white mb-3">{post.title}</h3>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {post.educationalLevel?.map((level) => (
            <span
              key={level}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20"
            >
              <GraduationCap size={14} className="mr-1.5" />
              {level}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-end pt-4 border-t border-gray-800">
          <Link 
            to={`/posts/${post.id}`}
            className="text-blue-400 hover:text-blue-300 transition-colors text-sm font-medium"
          >
            Read More →
          </Link>
        </div>
      </div>
    </div>
  );
};