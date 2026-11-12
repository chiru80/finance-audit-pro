import { environment } from './environment';

export const environmentProduction = {
  ...environment,
  supabaseUrl: 'https://your-project.supabase.co',
  supabaseAnonKey: 'your-anon-key',
};