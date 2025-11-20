import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // Polyfill process.env.API_KEY for @google/genai SDK
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      // Polyfill process.env for other libs (optional but safe)
      'process.env': JSON.stringify(env),
      // Define global for some older libs
      'global': 'window',
    },
  };
});