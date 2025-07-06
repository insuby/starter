import terser from '@rollup/plugin-terser';
import * as nodePath from 'node:path';
import * as process from 'node:process';
import { defineConfig, loadEnv } from 'vite';

import react from '@vitejs/plugin-react';

const pathResolve = (path: string) => nodePath.resolve(__dirname, path);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    server: {
      host: '0.0.0.0', // Добавьте эту строку
      port: 5173,
      proxy: {
        '/api': {
          target: env.API_URL,
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: 'build',
      assetsDir: 'static',
      minify: 'terser',
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom'],
            ui: ['antd', '@headlessui/react', 'react-toastify'],
            icons: [
              '@fortawesome/fontawesome-svg-core',
              '@fortawesome/free-solid-svg-icons',
              '@fortawesome/react-fontawesome',
            ],
            forms: ['react-hook-form', '@hookform/resolvers', 'yup'],
          },
        },
        plugins: [
          terser({
            compress: {
              drop_console: true,
            },
            mangle: true,
          }),
        ],
      },
    },
    plugins: [react()],
    resolve: {
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.scss'],
      alias: {
        app: pathResolve('./src/app'),
        'app/*': pathResolve('./src/app/*'),
        pages: pathResolve('./src/pages'),
        'pages/*': pathResolve('./src/pages/*'),
        widgets: pathResolve('./src/widgets'),
        'widgets/*': pathResolve('./src/widgets/*'),
        features: pathResolve('./src/features'),
        'features/*': pathResolve('./src/features/*'),
        entities: pathResolve('./src/entities'),
        'entities/*': pathResolve('src/entities/*'),
        shared: pathResolve('src/shared'),
        'shared/*': pathResolve('src/shared/*'),
      },
    },
    define: {
      'process.env': env,
    },
  };
});
