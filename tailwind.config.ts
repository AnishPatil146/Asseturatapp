import type { Config } from 'tailwindcss'

const config: Config = {
    content: [
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['DM Sans', 'sans-serif'],
                mono: ['DM Mono', 'monospace'],
            },
            colors: {
                bg: '#08090d',
                bg2: '#0e1117',
                bg3: '#141720',
                bg4: '#1a1e2a',
                border: '#1e2333',
                border2: '#252b3d',
                green: '#00d4a0',
                green2: '#00a87e',
                red: '#ff4d6a',
                red2: '#cc3d55',
                blue: '#4f8ef7',
                amber: '#f5a623',
                purple: '#8b5cf6',
            },
        },
    },
    plugins: [],
}

export default config