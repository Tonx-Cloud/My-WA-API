/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Cores WhatsApp customizadas
      colors: {
        whatsapp: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#25D366', // WhatsApp Green
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          'green': '#25D366',
          'green-dark': '#075E54',
          'green-light': '#128C7E',
          'teal': '#25D366',
          'blue': '#34B7F1',
          'gray': '#ECE5DD',
        },
        'whatsapp-dark': {
          50: '#f0f9f0',
          100: '#dcf2dc',
          200: '#b9e5b9',
          300: '#8fd48f',
          400: '#5ebd5e',
          500: '#128C7E', // WhatsApp Teal
          600: '#0f7a6e',
          700: '#0d655b',
          800: '#0c5049',
          900: '#075E54', // WhatsApp Dark Green
        },
      },
      
      // Animações customizadas
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-in': 'bounceIn 0.6s ease-out',
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'spin-slow': 'spin 3s linear infinite',
      },
      
      keyframes: {
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      
      // Sombras customizadas
      boxShadow: {
        'whatsapp': '0 1px 3px 0 rgba(37, 211, 102, 0.1), 0 1px 2px 0 rgba(37, 211, 102, 0.06)',
        'whatsapp-lg': '0 10px 15px -3px rgba(37, 211, 102, 0.1), 0 4px 6px -2px rgba(37, 211, 102, 0.05)',
      },
      
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'whatsapp-gradient': 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
