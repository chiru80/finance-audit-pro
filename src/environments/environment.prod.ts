export const environment = {
  supabaseUrl: 'https://hlkvaxmqbzdbzcjnrrdh.supabase.co',
  supabaseAnonKey:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhsa3ZheG1xYnpkYnpjam5ycmRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQzNTQ5NjYsImV4cCI6MjEwOTkzMDk2Nn0.fqfONLEAb7L4dH5eFvhbKYCFY8gBN9eLpL0U3nHjwng',
  // R2 API base URL — points to the Supabase Edge Function
  // Deploy with JWT verification enabled: supabase functions deploy r2-presign
  r2ApiBaseUrl: 'https://hlkvaxmqbzdbzcjnrrdh.supabase.co/functions/v1/r2-presign',
  // For Next.js/Vercel: use the local API route
  // r2ApiBaseUrl: '/api/r2',
};

export const environmentProduction = environment;
