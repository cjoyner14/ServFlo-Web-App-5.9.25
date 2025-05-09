/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'servflo': {
          DEFAULT: '#0A7E3D', // Slightly deeper green for better contrast
          light: 'rgba(10, 126, 61, 0.1)',
          hover: 'rgba(10, 126, 61, 0.2)',
        },
        'schedule': {
          DEFAULT: '#3A6EA5', // Professional blue that works with service businesses
          light: 'rgba(58, 110, 165, 0.1)',
          hover: 'rgba(58, 110, 165, 0.2)',
        },
        primary: {
          DEFAULT: '#0A7E3D', // Main brand green
          50: '#E7F5EE',
          100: '#CFEBDD',
          200: '#A0D8BB',
          300: '#70C499',
          400: '#41B077',
          500: '#0A7E3D',
          600: '#096E36',
          700: '#075D2E',
          800: '#064D26',
          900: '#043C1F',
        },
        secondary: {
          DEFAULT: '#3A6EA5', // Professional blue
          50: '#EBF1F7',
          100: '#D7E3EF',
          200: '#AFC7DF',
          300: '#87ABCF',
          400: '#608FBF',
          500: '#3A6EA5',
          600: '#326091',
          700: '#2B517C',
          800: '#244367',
          900: '#1D3452',
        },
        accent: {
          DEFAULT: '#F59E0B', // Amber/orange - practical, approachable
          50: '#FEF7EA',
          100: '#FDEFCF',
          200: '#FADF9F',
          300: '#F8CF6F',
          400: '#F7BF3F',
          500: '#F59E0B',
          600: '#D88C09',
          700: '#B77508',
          800: '#965E06',
          900: '#754A05',
        },
        neutral: {
          DEFAULT: '#475569', // Slate - professional, not too corporate
          50: '#F8F9FA',
          100: '#F1F3F5',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#475569',
          600: '#374151',
          700: '#1F2937',
          800: '#111827',
          900: '#0F172A',
        },
        background: {
          start: '#F8FAFC', // Lighter, cleaner background
          end: '#F1F5F9',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        body: ['Source Sans Pro', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideOutRight: {
          '0%': { transform: 'translateX(0)', opacity: '1' },
          '100%': { transform: 'translateX(100%)', opacity: '0' },
        },
      },
      animation: {
        slideInRight: 'slideInRight 0.3s ease-out forwards',
        slideOutRight: 'slideOutRight 0.3s ease-in forwards',
      },
      boxShadow: {
        'card': '0 4px 6px rgba(0, 0, 0, 0.05), 0 10px 15px rgba(0, 0, 0, 0.1)',
        'card-hover': '0 10px 20px rgba(0, 0, 0, 0.1), 0 20px 25px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  safelist: [
    // Theme colors with variants
    'bg-servflo',
    'bg-servflo-light',
    'bg-servflo-hover',
    'text-servflo',
    'border-servflo',
    
    'bg-schedule',
    'bg-schedule-light',
    'bg-schedule-hover',
    'text-schedule',
    'border-schedule',
    
    'bg-secondary',
    'bg-secondary-light',
    'bg-secondary-hover',
    'text-secondary',
    'border-secondary',
    
    'bg-accent',
    'bg-accent-light',
    'bg-accent-hover',
    'text-accent',
    'border-accent',
    
    'bg-neutral',
    'text-neutral',
    'border-neutral',
    
    // Color variants
    ...Array.from({ length: 10 }, (_, i) => [
      `bg-primary-${i}00`,
      `text-primary-${i}00`,
      `border-primary-${i}00`,
      
      `bg-secondary-${i}00`,
      `text-secondary-${i}00`,
      `border-secondary-${i}00`,
      
      `bg-accent-${i}00`,
      `text-accent-${i}00`,
      `border-accent-${i}00`,
      
      `bg-neutral-${i}00`,
      `text-neutral-${i}00`,
      `border-neutral-${i}00`,
    ]).flat(),
    
    // Hover states
    'hover:bg-servflo',
    'hover:bg-schedule',
    'hover:bg-secondary',
    'hover:bg-accent',
    'hover:bg-neutral',
    'hover:bg-primary',
    
    // Focus states
    'focus:ring-servflo',
    'focus:ring-schedule',
    'focus:ring-secondary',
    'focus:ring-accent',
    'focus:ring-neutral',
    'focus:ring-primary',
    
    // Opacity variations
    'bg-servflo/10',
    'bg-schedule/10',
    'bg-secondary/10',
    'bg-accent/10',
    'bg-neutral/10',
    'bg-primary/10',
    
    // Arbitrary values (new colors)
    'bg-[#0A7E3D]',
    'bg-[#0A7E3D]/10',
    'bg-[#0A7E3D]/90',
    'text-[#0A7E3D]',
    'border-[#0A7E3D]',
    
    'bg-[#3A6EA5]',
    'bg-[#3A6EA5]/10',
    'bg-[#3A6EA5]/90',
    'text-[#3A6EA5]',
    'border-[#3A6EA5]',
    
    'bg-[#F59E0B]',
    'bg-[#F59E0B]/10',
    'bg-[#F59E0B]/90',
    'text-[#F59E0B]',
    'border-[#F59E0B]',
    
    'bg-[#475569]',
    'bg-[#475569]/10',
    'bg-[#475569]/90',
    'text-[#475569]',
    'border-[#475569]',
    
    // Hover states for arbitrary values
    'hover:bg-[#0A7E3D]/90',
    'hover:bg-[#3A6EA5]/90',
    'hover:bg-[#F59E0B]/90',
    'hover:bg-[#475569]/90',
    
    // Focus states for arbitrary values
    'focus:ring-[#0A7E3D]',
    'focus:ring-[#3A6EA5]',
    'focus:ring-[#F59E0B]',
    'focus:ring-[#475569]',
  ],
  plugins: [
    function({ addUtilities }) {
      const newUtilities = {
        '.pt-safe': {
          paddingTop: 'env(safe-area-inset-top)'
        },
        '.pr-safe': {
          paddingRight: 'env(safe-area-inset-right)'
        },
        '.pb-safe': {
          paddingBottom: 'env(safe-area-inset-bottom)'
        },
        '.pl-safe': {
          paddingLeft: 'env(safe-area-inset-left)'
        },
        '.mt-safe': {
          marginTop: 'env(safe-area-inset-top)'
        },
        '.mr-safe': {
          marginRight: 'env(safe-area-inset-right)'
        },
        '.mb-safe': {
          marginBottom: 'env(safe-area-inset-bottom)'
        },
        '.ml-safe': {
          marginLeft: 'env(safe-area-inset-left)'
        },
      }
      addUtilities(newUtilities)
    },
  ],
};