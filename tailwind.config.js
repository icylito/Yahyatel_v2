/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: { extend: { colors: { border: "hsl(var(--border))", input: "hsl(var(--input))", ring: "hsl(var(--ring))", background: "hsl(var(--background))", foreground: "hsl(var(--foreground))", primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" }, secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" }, brand: { 50: "hsl(var(--brand-50))", 100: "hsl(var(--brand-100))", 200: "hsl(var(--brand-200))", 300: "hsl(var(--brand-300))", 400: "hsl(var(--brand-400))", 500: "hsl(var(--brand-500))", 600: "hsl(var(--brand-600))", 700: "hsl(var(--brand-700))", 800: "hsl(var(--brand-800))", 900: "hsl(var(--brand-900))" } }, borderRadius: { lg: "var(--radius)", md: "calc(var(--radius) - 2px)", sm: "calc(var(--radius) - 4px)" } } },
  plugins: [require("tailwindcss-animate")],
}
