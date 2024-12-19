/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    theme: {
      extend: {
        colors: {
          'primary': '#000000',
          'secondary': '#ffffff',
          'neutral-gray': '#85888C',
          'white-smoke': '#EDECED',
          'dark-gray': '#2a2b2a',
          'taupe-gray': '#8b8988',
          'dark-olive': '#46423c',
          'bone': '#e3e0da',
          'pale-slate': '#dbdce0',
          'desert-sand': '#e3cdbd',
          'champagne': '#e3d9c5',
          'dark-midnight': '#0d1e32',
          'goldenrod': '#d29230',
        },
        fontFamily: {
          'caslon': ['Caslon Grad', 'serif'],
          'body': ['Helvetica', 'Arial', 'sans-serif'],
        },
        typography: (theme) => ({
            DEFAULT: {
                css: {
                    p: {
                        marginTop: theme('spacing.4'), // Add margin above each paragraph
                        marginBottom: theme('spacing.4'), // Add margin below each paragraph
                    },
                },
            },
        }),
      },
    },
    variants: {},
    plugins: [],
};