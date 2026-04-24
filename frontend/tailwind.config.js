/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        chess: {
          bg: '#1a1a1a',
          panel: '#262421',
          card: '#302e2c',
          border: '#3d3a37',
          hover: '#4a4744',
          light: '#b3b0ab',
          text: '#e8e6e3',
          green: '#81b64c',
          'green-d': '#538d1e',
          gold: '#c9a227',
          red: '#cc3333',
          sq: {
            light: '#f0d9b5',
            dark: '#b58863',
          },
        },
      },

      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        sans: ['"DM Sans"', 'sans-serif'],
      },

      boxShadow: {
        board: '0 20px 60px rgba(0,0,0,.7), 0 0 0 1px rgba(255,255,255,.04)',
        panel: '0 4px 24px rgba(0,0,0,.4)',
      },

      animation: {
        'fade-in': 'fadeIn .2s ease',
        'slide-up': 'slideUp .25s cubic-bezier(.34,1.56,.64,1)',
        'pulse-slow': 'pulse 2s ease-in-out infinite',
      },

      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};