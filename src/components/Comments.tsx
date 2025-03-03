import React, { useState } from 'react';
import { format, parseISO, isValid } from 'date-fns';
import { MessageSquare, Trash2, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { postStorage } from '../lib/storage';
import type { Comment } from '../types';
import { linkify, sanitizeHTML } from '../utils';

interface CommentsProps {
  postId: string;
  comments: Comment[];
  onCommentUpdate: (comments: Comment[]) => void;
}

export const Comments: React.FC<CommentsProps> = ({ postId, comments, onCommentUpdate }) => {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError('You must be logged in to comment');
      return;
    }

    const trimmedComment = newComment.trim();
    if (!trimmedComment) {
      setError('Comment cannot be empty');
      return;
    }

    if (trimmedComment.length > 1000) {
      setError('Comment is too long (maximum 1000 characters)');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const updatedComments = await postStorage.addComment(postId, {
        content: linkify(trimmedComment),
        author: {
          id: user.id,
          name: user.name || 'Unknown User',
          email: user.email,
        },
      });

      if (!Array.isArray(updatedComments)) {
        throw new Error('Invalid response from server');
      }

      onCommentUpdate(updatedComments);
      setNewComment('');
    } catch (err) {
      console.error('Comment error:', err);
      setError(err instanceof Error ? err.message : 'Failed to add comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!user) {
      setError('You must be logged in to delete comments');
      return;
    }

    console.log(`Deleting comment ID: ${commentId} from post ID: ${postId}`); // Debugging log

    setIsSubmitting(true);
    setError('');

    try {
      const updatedComments = await postStorage.removeComment(postId, commentId);

      if (!Array.isArray(updatedComments)) {
        throw new Error('Invalid response from server: Expected an array');
      }

      console.log('Updated comments after deletion:', updatedComments); // Debugging log
      onCommentUpdate(updatedComments);
    } catch (err) {
      console.error('Delete error:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to delete comment. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

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

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <MessageSquare className="text-blue-500" />
        <h3 className="text-xl font-semibold">Comments ({comments.length})</h3>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded flex items-center">
          <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {user ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <textarea
              value={newComment}
              onChange={(e) => {
                setNewComment(e.target.value);
                setError(''); // Clear error when user starts typing
              }}
              placeholder="Write a comment..."
              className="w-full px-3 py-2 bg-gray-800 rounded-md border border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              maxLength={1000}
              disabled={isSubmitting}
            />
            <div className="mt-1 text-sm text-gray-400 flex justify-end">
              {newComment.length}/1000 characters
            </div>
          </div>
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting || !newComment.trim()}
          >
            {isSubmitting ? 'Posting...' : 'Post Comment'}
          </button>
        </form>
      ) : (
        <div className="bg-gray-800 p-4 rounded-lg text-center">
          <p className="text-gray-400">Please log in to comment on this post.</p>
        </div>
      )}

      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <span className="text-blue-500 font-medium">
                    {(comment.author.name || 'Unknown')[0].toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-medium">{comment.author.name || 'Unknown'}</p>
                  <p className="text-sm text-gray-400">
                    {formatDate(comment.createdAt)}
                  </p>
                </div>
              </div>
              {user && (user.id === comment.author.id || user.role === 'ADMIN') && (
                <button
                  onClick={() => handleDelete(comment.id)}
                  className="text-red-400 hover:text-red-300 transition-colors p-1 rounded-full hover:bg-red-400/10"
                  title="Delete comment"
                  disabled={isSubmitting}
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
            <p className="text-gray-300 whitespace-pre-wrap break-words prose " dangerouslySetInnerHTML={{__html: sanitizeHTML(comment.content)}}></p>
          </div>
        ))}

        {comments.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            No comments yet. Be the first to comment!
          </div>
        )}
      </div>
    </div>
  );
};