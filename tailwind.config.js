/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary color system from reference files
        'primary': {
          DEFAULT: '#6366f1',
          dark: '#4f46e5',
        },
        'accent': {
          DEFAULT: '#10b981',
          hover: '#059669',
        },
        // Background colors
        'background': {
          light: '#f9fafb',
          card: '#ffffff',
        },
        // Text colors
        'text': {
          dark: '#1f2937',
          medium: '#4b5563',
          light: '#6b7280',
        },
        // Status colors
        'danger': '#ef4444',
        'warning': '#f59e0b',
        'success': '#10b981',
        // Border colors
        'border': '#e5e7eb',
        // Legacy purple colors for backward compatibility
        'purple-primary': '#6366f1',
        'purple-secondary': '#8b5cf6',
      },
      backgroundImage: {
        'purple-gradient': 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
        'hero-gradient': 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
      },
      boxShadow: {
        // Enhanced shadow system from reference files
        'sm': '0 1px 2px rgba(0, 0, 0, 0.05)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'focus': '0 0 0 3px rgba(99, 102, 241, 0.4)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'message': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      },
      borderRadius: {
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      fontFamily: {
        'sans': ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Open Sans', 'Helvetica Neue', 'sans-serif'],
      },
      animation: {
        'fadeIn': 'fadeIn 0.5s ease-out',
        'slideIn': 'slideIn 0.4s ease-out',
        'spin': 'spin 1s ease-in-out infinite',
        'dot-flashing': 'dot-flashing 1s infinite linear alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'dot-flashing': {
          '0%': { backgroundColor: '#6366f1' },
          '50%, 100%': { backgroundColor: 'rgba(99, 102, 241, 0.2)' },
        },
      },
    },
  },
  plugins: [],
}