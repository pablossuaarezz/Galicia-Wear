// JUSTIFICACIÓN: identidad clonada 1:1 de la app Android (Material 3, tema "Tema.GaliciaWear").
// Paleta de la bandera de Galicia (azul atlántico #0A5CA8 + celeste #29A9E0 sobre campo blanco
// con tinte celeste) y tipografía Syne en todo. Los nombres de token se conservan (atlantic,
// galego, sand, tinta, piedra) pero sus valores ahora son los hex EXACTOS de res/values/colors.xml.
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Azul atlántico — primario de marca (primario #0A5CA8 / oscuro #06396B / claro #4FB3E8).
        atlantic: {
          50: '#F2F8FD', // fondo (campo de la bandera, blanco con tinte celeste)
          100: '#E3F2FC', // celeste_muy_claro
          200: '#D4E9FA', // contenedor_primario
          300: '#9AD4F2', // celeste_claro
          400: '#4FB3E8', // primario_claro
          500: '#0A5CA8', // primario  ← color de marca
          600: '#084C8C',
          700: '#06396B', // primario_oscuro
          800: '#08304F',
          900: '#0D2A40', // texto_primario (tinta azul marino)
          950: '#081A29', // fondo_oscuro
        },
        // Celeste — acento de la bandera gallega (#29A9E0).
        celeste: {
          100: '#E3F2FC',
          200: '#D4E9FA',
          300: '#9AD4F2',
          400: '#4FB3E8',
          500: '#29A9E0', // acento / celeste
          600: '#1E8FC4',
          700: '#1573A3',
        },
        // "galego" se reutiliza como el verde sostenible virado a TEAL del Android
        // (verde_sostenible #00838F, verde_claro #4DD0E1). Mantiene la semántica eco.
        galego: {
          50: '#E0F4F1', // fondo_badge_km
          100: '#C9EDE9',
          200: '#A7E0DC',
          300: '#4DD0E1', // verde_claro
          400: '#26B6C4',
          500: '#00838F', // verde_sostenible
          600: '#016B76',
          700: '#015560',
          800: '#06424B',
          900: '#0A363D',
        },
        // "sand" se reutiliza como las superficies frías (fondo / superficie_variante).
        sand: {
          50: '#F2F8FD', // fondo
          100: '#E3EFF8', // superficie_variante
          200: '#D4E9FA', // contenedor_primario
          300: '#C2DDF0',
          400: '#9AD4F2',
        },
        // Tinta — texto en azul marino (texto_primario/secundario/deshabilitado).
        tinta: {
          50: '#F2F6FA',
          100: '#E3EFF8',
          200: '#CBDBE8',
          300: '#A7B7C4', // texto_deshabilitado
          400: '#7C92A4',
          500: '#5B7185', // texto_secundario
          600: '#3E5568',
          700: '#244055',
          800: '#15324A',
          900: '#0D2A40', // texto_primario
        },
        // Piedra — grises azulados para bordes y superficies sutiles.
        piedra: {
          50: '#F2F6FA',
          100: '#E3EFF8', // superficie_variante (bordes sutiles, como en la app)
          200: '#D2E2EE',
          300: '#B6CADB',
          400: '#8BA3B6',
          500: '#6B8497',
          600: '#51697B',
          700: '#3D5365',
          800: '#2B3F4F',
          900: '#1C3046',
        },
        // Semánticos — exactos del Android (error/exito/aviso) + info = primario.
        exito: { suave: '#E4F3E6', DEFAULT: '#2E7D32', fuerte: '#1B5E20' },
        aviso: { suave: '#FCEFD9', DEFAULT: '#EF8C00', fuerte: '#B36A00' },
        peligro: { suave: '#FBE4E4', DEFAULT: '#C62828', fuerte: '#8E1C1C' },
        info: { suave: '#E3F2FC', DEFAULT: '#0A5CA8', fuerte: '#06396B' },
      },
      fontFamily: {
        // Syne en todo, igual que `android:fontFamily=@font/syne` global de la app.
        sans: ['"Syne Variable"', 'Syne', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"Syne Variable"', 'Syne', 'system-ui', 'sans-serif'],
        editorial: ['"Syne Variable"', 'Syne', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        // Formas de marca del tema Android: Media 18dp (tarjetas), Grande 28dp.
        xl2: '1.125rem', // 18px — cardCornerRadius de la app
        grande: '1.75rem', // 28px — Forma.GaliciaWear.Grande
      },
      boxShadow: {
        // Elevaciones suaves (2–3dp) con sombra en azul marino de marca.
        suave: '0 1px 2px rgba(13, 42, 64, 0.05), 0 1px 3px rgba(13, 42, 64, 0.07)',
        tarjeta: '0 2px 8px rgba(13, 42, 64, 0.07), 0 8px 24px rgba(13, 42, 64, 0.06)',
        flotante: '0 12px 32px rgba(13, 42, 64, 0.16), 0 4px 12px rgba(13, 42, 64, 0.09)',
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
