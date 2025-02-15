import { supabase } from './supabase';
import type { Post, Comment, BlogSettings } from '../types';

const validateImageFormat = (base64String: string): boolean => {
  // Check if it's a valid base64 image string
  const validFormats = ['data:image/jpeg', 'data:image/png', 'data:image/gif'];
  return validFormats.some(format => base64String.startsWith(format));
};

export const processImage = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      reject(new Error('Please upload a JPG, PNG, or GIF file'));
      return;
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      reject(new Error('Image size must be less than 5MB'));
      return;
    }

    const reader = new FileReader();
    
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('Failed to process image'));
        return;
      }

      if (!validateImageFormat(reader.result)) {
        reject(new Error('Invalid image format'));
        return;
      }

      resolve(reader.result);
    };

    reader.onerror = () => {
      reject(new Error('Failed to read image file'));
    };

    reader.readAsDataURL(file);
  });
};

export const EDUCATIONAL_LEVELS = {
  // National Section
  NATIONAL: {
    KINDERGARTEN: ['KG1', 'KG2'],
    PRIMARY: ['Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6'],
    PREPARATORY: ['Preparatory 1', 'Preparatory 2', 'Preparatory 3'],
    SECONDARY: ['Secondary 1', 'Secondary 2', 'Secondary 3']
  },
  // American Section
  AMERICAN: {
    ELEMENTARY: ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5'],
    MIDDLE: ['Grade 6', 'Grade 7', 'Grade 8'],
    HIGH: ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12']
  },
  // General
  ALL: ['All School']
} as const;

class PostStorage {
  async getAllPosts(filters?: {
    level?: string;
    search?: string;
    sortBy?: 'date' | 'comments';
    sortOrder?: 'asc' | 'desc';
  }): Promise<Post[]> {
    try {
      let query = supabase
        .from('posts')
        .select(`
          *,
          author:user_profiles!posts_author_id_fkey (
            id,
            email,
            name
          ),
          comments (
            id,
            content,
            created_at,
            author:user_profiles!comments_author_id_fkey (
              id,
              email,
              name
            )
          )
        `);

      // Apply filters
      if (filters?.level && filters.level !== 'All School') {
        query = query.contains('educational_level', [filters.level]);
      }

      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%`);
      }

      // Apply sorting
      if (filters?.sortBy) {
        const order = filters.sortOrder === 'asc';
        switch (filters.sortBy) {
          case 'date':
            query = query.order('published_at', { ascending: order });
            break;
          case 'comments':
            query = query.order('published_at', { ascending: order }); // Fallback to date sorting
            break;
        }
      } else {
        query = query.order('published_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) {
        console.error('Database query error:', error);
        throw error;
      }

      if (!data) {
        return [];
      }

      return data.map(post => ({
        id: post.id,
        title: post.title,
        content: post.content,
        coverImage: post.cover_image,
        publishedAt: post.published_at,
        readingTime: post.reading_time,
        educationalLevel: post.educational_level,
        author: {
          id: post.author.id,
          email: post.author.email,
          name: post.author.name
        },
        comments: (post.comments || []).map(comment => ({
          id: comment.id,
          content: comment.content,
          createdAt: comment.created_at,
          author: {
            id: comment.author.id,
            email: comment.author.email,
            name: comment.author.name
          }
        }))
      }));
    } catch (error) {
      console.error('Error fetching posts:', error);
      throw new Error('Failed to load posts. Please try again later.');
    }
  }

  async addComment(postId: string, comment: { content: string; author: { id: string; name: string; email: string } }): Promise<Comment[]> {
    if (!comment.content.trim()) {
      throw new Error('Comment cannot be empty');
    }

    if (comment.content.length > 1000) {
      throw new Error('Comment is too long (maximum 1000 characters)');
    }

    try {
      // First verify the post exists
      const { data: post, error: postError } = await supabase
        .from('posts')
        .select('id')
        .eq('id', postId)
        .single();

      if (postError || !post) {
        throw new Error('Post not found');
      }

      // Add the comment
      const { data: newComment, error: commentError } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          content: comment.content.trim(),
          author_id: comment.author.id
        })
        .select(`
          id,
          content,
          created_at,
          author:user_profiles!comments_author_id_fkey (
            id,
            email,
            name
          )
        `)
        .single();

      if (commentError) {
        throw new Error('Failed to add comment');
      }

      // Fetch all comments for the post
      const { data: comments, error: fetchError } = await supabase
        .from('comments')
        .select(`
          id,
          content,
          created_at,
          author:user_profiles!comments_author_id_fkey (
            id,
            email,
            name
          )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (fetchError) {
        throw new Error('Failed to fetch comments');
      }

      return comments.map(comment => ({
        id: comment.id,
        content: comment.content,
        createdAt: comment.created_at,
        author: {
          id: comment.author.id,
          email: comment.author.email,
          name: comment.author.name
        }
      }));
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error instanceof Error ? error : new Error('Failed to add comment');
    }
  }

  async removeComment(postId: string, commentId: string): Promise<Comment[]> {
    try {
      // First verify the comment exists and belongs to the post
      const { data: comment, error: verifyError } = await supabase
        .from('comments')
        .select('id')
        .eq('id', commentId)
        .eq('post_id', postId)
        .single();

      if (verifyError || !comment) {
        throw new Error('Comment not found');
      }

      // Delete the comment
      const { error: deleteError } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (deleteError) {
        throw new Error('Failed to delete comment');
      }

      // Fetch updated comments
      const { data: comments, error: fetchError } = await supabase
        .from('comments')
        .select(`
          id,
          content,
          created_at,
          author:user_profiles!comments_author_id_fkey (
            id,
            email,
            name
          )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (fetchError) {
        throw new Error('Failed to fetch comments');
      }

      return comments.map(comment => ({
        id: comment.id,
        content: comment.content,
        createdAt: comment.created_at,
        author: {
          id: comment.author.id,
          email: comment.author.email,
          name: comment.author.name
        }
      }));
    } catch (error) {
      console.error('Error removing comment:', error);
      throw error instanceof Error ? error : new Error('Failed to delete comment');
    }
  }

  async createPost(postData: {
    title: string;
    content: string;
    coverImage: string;
    educationalLevel: string[];
  }): Promise<Post> {
    try {
      if (!validateImageFormat(postData.coverImage)) {
        throw new Error('Invalid image format');
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('User not authenticated');

      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert({
          title: postData.title,
          content: postData.content,
          cover_image: postData.coverImage,
          educational_level: postData.educationalLevel,
          author_id: user.id
        })
        .select(`
          *,
          author:user_profiles!posts_author_id_fkey(
            id,
            email,
            name
          )
        `)
        .single();

      if (postError) throw postError;
      if (!post) throw new Error('Failed to create post');

      return {
        id: post.id,
        title: post.title,
        content: post.content,
        coverImage: post.cover_image,
        publishedAt: post.published_at,
        readingTime: post.reading_time,
        educationalLevel: post.educational_level,
        author: {
          id: post.author.id,
          email: post.author.email,
          name: post.author.name
        },
        comments: []
      };
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  }

  async updatePost(id: string, postData: {
    title: string;
    content: string;
    coverImage: string;
    educationalLevel: string[];
  }): Promise<Post> {
    try {
      if (!validateImageFormat(postData.coverImage)) {
        throw new Error('Invalid image format');
      }

      const { data: post, error: postError } = await supabase
        .from('posts')
        .update({
          title: postData.title,
          content: postData.content,
          cover_image: postData.coverImage,
          educational_level: postData.educationalLevel,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          author:user_profiles!posts_author_id_fkey(
            id,
            email,
            name
          ),
          comments (
            id,
            content,
            created_at,
            author:user_profiles!comments_author_id_fkey (
              id,
              email,
              name
            )
          )
        `)
        .single();

      if (postError) throw postError;
      if (!post) throw new Error('Failed to update post');

      return {
        id: post.id,
        title: post.title,
        content: post.content,
        coverImage: post.cover_image,
        publishedAt: post.published_at,
        readingTime: post.reading_time,
        educationalLevel: post.educational_level,
        author: {
          id: post.author.id,
          email: post.author.email,
          name: post.author.name
        },
        comments: (post.comments || []).map(comment => ({
          id: comment.id,
          content: comment.content,
          createdAt: comment.created_at,
          author: {
            id: comment.author.id,
            email: comment.author.email,
            name: comment.author.name
          }
        }))
      };
    } catch (error) {
      console.error('Error updating post:', error);
      throw error;
    }
  }

  async deletePost(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  }

  async getRecentActivity(): Promise<any[]> {
    try {
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select(`
          id,
          title,
          author:user_profiles!posts_author_id_fkey(
            id,
            name
          ),
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (postsError) throw postsError;

      const { data: comments, error: commentsError } = await supabase
        .from('comments')
        .select(`
          id,
          post_id,
          author:user_profiles!comments_author_id_fkey(
            id,
            name
          ),
          created_at,
          posts(title)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (commentsError) throw commentsError;

      const activity = [
        ...posts.map((post: any) => ({
          timestamp: post.created_at,
          user: post.author.name,
          action: 'created a new post',
          post: post.title
        })),
        ...comments.map((comment: any) => ({
          timestamp: comment.created_at,
          user: comment.author.name,
          action: 'commented on',
          post: comment.posts?.title || 'Unknown Post'
        }))
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);

      return activity;
    } catch (error) {
      console.error('Error fetching activity:', error);
      return [];
    }
  }

  async getStatistics() {
    try {
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select('id, educational_level, created_at');

      if (postsError) throw postsError;

      const totalPosts = posts.length;

      const postsByLevel = posts.reduce((acc: Record<string, number>, post: any) => {
        post.educational_level.forEach((level: string) => {
          acc[level] = (acc[level] || 0) + 1;
        });
        return acc;
      }, {});

      return {
        totalPosts,
        postsByLevel
      };
    } catch (error) {
      console.error('Error fetching statistics:', error);
      return {
        totalPosts: 0,
        postsByLevel: {}
      };
    }
  }

  async getSettings(): Promise<BlogSettings> {
    try {
      // First try to get the first settings record
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      // If no settings exist or there's an error, return defaults
      if (error || !data) {
        console.log('Using default settings');
        return {
          title: 'St.Josef News',
          description: 'Latest news and updates from St.Josef International School',
          postsPerPage: 9,
          defaultAuthorName: 'Admin',
          defaultAuthorEmail: 'admin@stjosefschool.com',
          theme: 'dark',
          socialLinks: {
            twitter: '',
            github: '',
            linkedin: ''
          }
        };
      }

      return {
        title: data.title,
        description: data.description,
        postsPerPage: data.posts_per_page,
        defaultAuthorName: 'Admin',
        defaultAuthorEmail: 'admin@stjosefschool.com',
        theme: data.theme,
        socialLinks: data.social_links
      };
    } catch (error) {
      console.error('Error fetching settings:', error);
      // Return defaults on error
      return {
        title: 'St.Josef News',
        description: 'Latest news and updates from St.Josef International School',
        postsPerPage: 9,
        defaultAuthorName: 'Admin',
        defaultAuthorEmail: 'admin@stjosefschool.com',
        theme: 'dark',
        socialLinks: {
          twitter: '',
          github: '',
          linkedin: ''
        }
      };
    }
  }

  async updateSettings(settings: BlogSettings): Promise<BlogSettings> {
    try {
      // First, get the existing settings ID if any exists
      const { data: existingSettings } = await supabase
        .from('settings')
        .select('id')
        .limit(1)
        .maybeSingle();

      const settingsId = existingSettings?.id || undefined;

      // Update or insert settings
      const { data, error } = await supabase
        .from('settings')
        .upsert({
          id: settingsId, // This will update existing record or create new if none exists
          title: settings.title,
          description: settings.description,
          posts_per_page: settings.postsPerPage,
          theme: settings.theme,
          social_links: settings.socialLinks,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return {
        title: data.title,
        description: data.description,
        postsPerPage: data.posts_per_page,
        defaultAuthorName: 'Admin',
        defaultAuthorEmail: 'admin@stjosefschool.com',
        theme: data.theme,
        socialLinks: data.social_links
      };
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  }
}

export const postStorage = new PostStorage();