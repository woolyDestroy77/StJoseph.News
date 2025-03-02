export interface Post {
  id: string;
  title: string;
  content: string;
  coverImage: string;
  coverImageUrl: string;
  videoUrl: string;
  publishedAt: string;
  readingTime: number;
  educationalLevel: string[];
  author: {
    id: string;
    name: string;
    email: string;
  };
  comments: Comment[];
}

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    email: string;
  };
}

export interface BlogSettings {
  title: string;
  description: string;
  postsPerPage: number;
  defaultAuthorName: string;
  defaultAuthorEmail: string;
  theme: 'dark' | 'light';
  socialLinks: {
    twitter: string;
    github: string;
    linkedin: string;
  };
}