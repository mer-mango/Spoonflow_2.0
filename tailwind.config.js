/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#f7f7f9',
        card: '#ffffff',
        text: '#2c2c2a',
        muted: '#888780',
        border: 'rgba(44, 44, 42, 0.11)',
        brand: '#6b2358',
        meeting: '#6484a1',
        tasks: '#c198ad',
        content: '#e2b7be',
        nurture: '#8fa790',
        goals: '#93738e',
        contacts1: '#6d8c90',
        contacts2: '#8ba5a8',
        contacts3: '#a8c0c2',
        pt: '#bcd1d5',
        medical: '#c9888e',
        virtual: '#d4a77a',
        todo: '#d6a0a9',
        inprog: '#e4b9ab',
        await: '#e1d6cb',
        done: '#c2cfc9',
      },
      fontFamily: {
        serif: ['Lora', 'Georgia', 'serif'],
        sans: ['Poppins', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
