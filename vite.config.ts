import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    define: {
      // Polyfill process.env for the app code. 
      // If env.API_KEY is missing, it will be undefined, which our service now handles.
      'process.env.API_KEY': JSON.stringify(env.API_KEY || "")
    }
  };
});