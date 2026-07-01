/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js}'],
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        'clamav-dark': {
          'primary':          '#e53535',
          'primary-content':  '#ffffff',
          'secondary':        '#b91c1c',
          'secondary-content':'#ffffff',
          'accent':           '#f87171',
          'accent-content':   '#ffffff',
          'neutral':          '#1c1c1c',
          'neutral-content':  '#d4d4d4',
          'base-100':         '#1a1a1a',
          'base-200':         '#222222',
          'base-300':         '#2c2c2c',
          'base-content':     '#e5e5e5',
          'info':             '#38bdf8',
          'info-content':     '#000000',
          'success':          '#4ade80',
          'success-content':  '#000000',
          'warning':          '#fbbf24',
          'warning-content':  '#000000',
          'error':            '#ef4444',
          'error-content':    '#ffffff'
        }
      }
    ],
    darkTheme: 'clamav-dark',
    base: true,
    styled: true,
    utils: true,
    logs: false
  }
}
