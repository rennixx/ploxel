import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        space: {
          950: '#0a0e1a'
        },
        neon: {
          cyan: '#00ffff',
          magenta: '#ff00ff'
        }
      }
    }
  },
  plugins: []
}

export default config
