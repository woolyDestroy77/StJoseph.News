export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      posts: {
        Row: {
          id: string
          title: string
          content: string
          cover_image: string
          published_at: string
          reading_time: number
          educational_level: string[]
          author_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          cover_image: string
          published_at?: string
          reading_time?: number
          educational_level: string[]
          author_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          cover_image?: string
          published_at?: string
          reading_time?: number
          educational_level?: string[]
          author_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          post_id: string
          content: string
          author_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          post_id: string
          content: string
          author_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          content?: string
          author_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      settings: {
        Row: {
          id: string
          title: string
          description: string
          posts_per_page: number
          theme: 'dark' | 'light'
          social_links: {
            twitter: string
            github: string
            linkedin: string
          }
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          posts_per_page?: number
          theme?: 'dark' | 'light'
          social_links?: {
            twitter: string
            github: string
            linkedin: string
          }
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          posts_per_page?: number
          theme?: 'dark' | 'light'
          social_links?: {
            twitter: string
            github: string
            linkedin: string
          }
          created_at?: string
          updated_at?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          email: string
          name: string
          created_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}