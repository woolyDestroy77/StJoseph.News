import { supabase } from './supabase';

export interface User {
  id: string;
  email: string;
  role: 'ADMIN' | 'USER';
  name: string;
}

interface AuthResponse {
  user: User;
  token: string;
}

export const registerUser = async (email: string, password: string, name: string): Promise<AuthResponse> => {
  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        role: 'USER'
      }
    }
  });

  if (signUpError) {
    console.error('Registration error:', signUpError);
    throw signUpError;
  }

  if (!authData.user) {
    throw new Error('Failed to create user');
  }

  // Wait for user profile to be created by trigger
  await new Promise(resolve => setTimeout(resolve, 1000));

  const user: User = {
    id: authData.user.id,
    email: authData.user.email!,
    name: authData.user.user_metadata.name,
    role: authData.user.user_metadata.role || 'USER'
  };

  return {
    user,
    token: authData.session?.access_token || ''
  };
};

export const loginUser = async (email: string, password: string): Promise<AuthResponse> => {
  const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (signInError) {
    console.error('Login error:', signInError);
    throw signInError;
  }

  if (!authData.user) {
    throw new Error('Failed to login');
  }

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', authData.user.id)
    .single();

  if (profileError) {
    console.error('Profile fetch error:', profileError);
    throw profileError;
  }

  const user: User = {
    id: authData.user.id,
    email: profile.email,
    name: profile.name,
    role: authData.user.user_metadata.role || 'USER'
  };

  return {
    user,
    token: authData.session?.access_token || ''
  };
};

export const logoutUser = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Logout error:', error);
    throw error;
  }
  localStorage.removeItem('token');
};

export const getCurrentUser = async (): Promise<User | null> => {
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError) {
    console.error('Profile fetch error:', profileError);
    return null;
  }

  return {
    id: user.id,
    email: profile.email,
    name: profile.name,
    role: user.user_metadata.role || 'USER'
  };
};

export const getStoredUsers = async (): Promise<User[]> => {
  const { data: profiles, error } = await supabase
    .from('user_profiles')
    .select('*');
  
  if (error) {
    console.error('Error fetching users:', error);
    throw error;
  }

  return profiles.map(profile => ({
    id: profile.id,
    email: profile.email,
    name: profile.name,
    role: 'USER' // Default to USER role
  }));
};

export const updateUserRole = async (userId: string, newRole: 'ADMIN' | 'USER'): Promise<User[]> => {
  const { error } = await supabase.auth.admin.updateUserById(userId, {
    user_metadata: { role: newRole }
  });

  if (error) {
    console.error('Error updating user role:', error);
    throw error;
  }

  return getStoredUsers();
};