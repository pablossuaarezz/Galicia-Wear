// JUSTIFICACIÓN: paleta inspirada en Galicia (azul atlántico + verde castaño) — coherencia
// visual con la app Android (Material 3). Misma identidad cross-platform.
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        atlantic: {
          50: '#eef6fb',
          100: '#d4e7f4',
          500: '#1e6fa3',
          700: '#15527a',
          900: '#0c2f48',
        },
        galego: {
          50: '#f1f7ee',
          500: '#5c8a3a',
          700: '#3f6128',
        },
        sand: {
          50: '#fbf8f3',
          200: '#ecddc4',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Manrope', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
