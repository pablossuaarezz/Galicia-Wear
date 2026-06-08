// JUSTIFICACIÓN: identidad "Atlántico editorial sostenible". Paleta inspirada en Galicia
// (azul atlántico + verde castaño + papel arena) coherente con la app Android (Material 3).
// Se AMPLÍA la base de Fase 0 (no se rompe): se completan escalas 50–950, se añaden neutros
// cálidos (tinta/piedra), colores semánticos, radios, sombras suaves y tokens de movimiento.
import type { Config } from 'tailwindcss';

const config: Config = {
  // Tema claro por defecto; el oscuro es un extra activable con la clase `dark`.
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Azul atlántico — color de marca. 500/700/900 conservan los valores de Fase 0.
        atlantic: {
          50: '#eef6fb',
          100: '#d4e7f4',
          200: '#b0d4ec',
          300: '#7fb8dd',
          400: '#4a97c8',
          500: '#1e6fa3',
          600: '#195d8a',
          700: '#15527a',
          800: '#103f5e',
          900: '#0c2f48',
          950: '#081f30',
        },
        // Verde gallego — acentos de sostenibilidad. 50/500/700 conservan los de Fase 0.
        galego: {
          50: '#f1f7ee',
          100: '#e0efd8',
          200: '#c3deb4',
          300: '#9cc684',
          400: '#79ab5c',
          500: '#5c8a3a',
          600: '#486e2d',
          700: '#3f6128',
          800: '#324d20',
          900: '#2a401d',
        },
        // Arena/papel — fondos cálidos editoriales. 50/200 conservan los de Fase 0.
        sand: {
          50: '#fbf8f3',
          100: '#f6f0e6',
          200: '#ecddc4',
          300: '#e0c9a3',
          400: '#d2b07f',
        },
        // Tinta — neutro cálido para textos (más amable que el gris puro).
        tinta: {
          50: '#f7f6f4',
          100: '#e9e7e2',
          200: '#d3cfc6',
          300: '#b3ada0',
          400: '#8d8676',
          500: '#6e6757',
          600: '#564f43',
          700: '#423d34',
          800: '#2c2823',
          900: '#1c1915',
        },
        // Piedra — neutro frío para bordes, superficies y datos.
        piedra: {
          50: '#f6f7f8',
          100: '#eceef0',
          200: '#dce0e3',
          300: '#c2c8cd',
          400: '#9aa3ab',
          500: '#788289',
          600: '#5e676d',
          700: '#4c5359',
          800: '#3f454a',
          900: '#373b3f',
        },
        // Semánticos: suave (fondo), DEFAULT (icono/texto), fuerte (énfasis).
        exito: { suave: '#e7f4ec', DEFAULT: '#2f8f5b', fuerte: '#1f6b41' },
        aviso: { suave: '#fbf0d9', DEFAULT: '#c8861a', fuerte: '#955f0f' },
        peligro: { suave: '#fae8e6', DEFAULT: '#c0392b', fuerte: '#8f261b' },
        info: { suave: '#e6f1f8', DEFAULT: '#1e6fa3', fuerte: '#15527a' },
      },
      fontFamily: {
        // Las familias "* Variable" las registran los paquetes @fontsource-variable.
        sans: ['"Inter Variable"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"Manrope Variable"', 'Manrope', 'Inter', 'sans-serif'],
        editorial: ['"Fraunces Variable"', 'Georgia', 'serif'],
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      boxShadow: {
        suave: '0 1px 2px rgba(12, 47, 72, 0.04), 0 1px 3px rgba(12, 47, 72, 0.06)',
        tarjeta: '0 2px 8px rgba(12, 47, 72, 0.06), 0 8px 24px rgba(12, 47, 72, 0.05)',
        flotante: '0 12px 32px rgba(12, 47, 72, 0.14), 0 4px 12px rgba(12, 47, 72, 0.08)',
      },
      transitionTimingFunction: {
        suave: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      transitionDuration: {
        250: '250ms',
        400: '400ms',
      },
      keyframes: {
        aparecer: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        subir: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        brillo: {
          '100%': { transform: 'translateX(100%)' },
        },
        latido: {
          '0%, 100%': { transform: 'scale(1)' },
          '40%': { transform: 'scale(1.35)' },
        },
        'desplazar-marquesina': {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        aparecer: 'aparecer 0.4s cubic-bezier(0.22, 1, 0.36, 1) both',
        subir: 'subir 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
        brillo: 'brillo 1.6s infinite',
        latido: 'latido 0.45s cubic-bezier(0.22, 1, 0.36, 1)',
        marquesina: 'desplazar-marquesina 28s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
