import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format, parseISO, isValid } from 'date-fns';
import { ArrowLeft, Clock, BookOpen, GraduationCap, ImageOff } from 'lucide-react';
import { postStorage } from '../lib/storage';
import { Comments } from '../components/Comments';
import ReactMarkdown from 'react-markdown';
import type { Post } from '../types';

export const PostView: React.FC = () => {
  const { id } = useParams();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const loadPost = async () => {
      if (!id) return;
      
      try {
        const posts = await postStorage.getAllPosts();
        const foundPost = posts.find(p => p.id === id);
        if (!foundPost) {
          setError('Post not found');
          return;
        }
        setPost(foundPost);
      } catch (error) {
        console.error('Failed to load post:', error);
        setError('Failed to load post. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadPost();
  }, [id]);

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
  const isBase64Image = post?.coverImage?.startsWith('data:image/');

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded mb-4">
            {error}
          </div>
          <Link to="/" className="text-blue-400 hover:text-blue-300">
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Post not found</h2>
          <Link to="/" className="text-blue-400 hover:text-blue-300">
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link
        to="/"
        className="inline-flex items-center text-blue-400 hover:text-blue-300 mb-8"
      >
        <ArrowLeft className="mr-2" size={20} />
        Back to Home
      </Link>

      <article className="bg-gray-900 rounded-lg overflow-hidden shadow-xl">
        {/* IMAGE CONTAINER (FIXED) */}
        <div className="aspect-[16/10] bg-gray-800 flex items-center justify-center overflow-hidden">
          {imageError || !isBase64Image ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center text-gray-400">
                <ImageOff className="w-16 h-16 mx-auto mb-2" />
                <p>Image not available</p>
              </div>
            </div>
          ) : (
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-auto h-full max-h-[500px] object-contain"
              onError={handleImageError}
              loading="lazy"
            />
          )}
        </div>

        <div className="p-8">
          <div className="flex items-center space-x-4 mb-6">
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

          <h1 className="text-3xl font-bold text-white mb-4">{post.title}</h1>

          <div className="flex flex-wrap gap-2 mb-6">
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

          <div className="prose prose-invert max-w-none">
            <ReactMarkdown>{post.content}</ReactMarkdown>
          </div>

          <div className="flex items-center space-x-2 text-gray-400 mt-8 pt-6 border-t border-gray-800">
            <BookOpen size={16} />
            <span className="text-sm">{post.readingTime} min read</span>
          </div>
        </div>

        <div className="px-8 pb-8">
          <Comments
            postId={post.id}
            comments={post.comments || []}
            onCommentUpdate={(comments) => setPost({ ...post, comments })}
          />
        </div>
      </article>
    </div>
  );
};