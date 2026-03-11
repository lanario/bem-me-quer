import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bmq: {
          dark: "#5e7f59",
          "mid-dark": "#75976f",
          mid: "#8cae86",
          accent: "#a3c69c",
          bg: "#fdfdfd",
          border: "#eeeeee",
          placeholder: "#cbd5e0",
          /** Fundo do painel – verde muito sutil (#F4F8F4) para profundidade e identidade. */
          pageBg: "#F4F8F4",
          /** Cards em branco puro para contraste e profundidade. */
          cardBg: "#FFFFFF",
        },
      },
      borderRadius: {
        "card": "12px",
      },
      boxShadow: {
        /** Sombra suave e moderna nos cards (destacam sobre o fundo verde). */
        card: "0 4px 12px rgba(0, 0, 0, 0.03)",
        /** Sombra no hover dos cards (micro-interação). */
        cardHover: "0 8px 24px rgba(0, 0, 0, 0.06)",
      },
      keyframes: {
        "fade-slide-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "icon-cart-slide": {
          "0%, 100%": { transform: "translateX(0)" },
          "50%": { transform: "translateX(5px)" },
        },
        "icon-tag-sway": {
          "0%, 100%": { transform: "rotate(0deg)" },
          "25%": { transform: "rotate(-10deg)" },
          "75%": { transform: "rotate(10deg)" },
        },
        "icon-box-jump": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
        "icon-arrows-slide": {
          "0%, 100%": { transform: "translateX(0)" },
          "50%": { transform: "translateX(4px)" },
        },
        "icon-bars-grow": {
          "0%": { transform: "scaleY(0.88)" },
          "100%": { transform: "scaleY(1.15)" },
        },
        "icon-bounce": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-3px)" },
        },
        "icon-truck-slide": {
          "0%, 100%": { transform: "translateX(0)" },
          "50%": { transform: "translateX(4px)" },
        },
      },
      animation: {
        "fade-slide-up": "fade-slide-up 0.45s ease-out both",
        "icon-cart-slide": "icon-cart-slide 0.5s ease-in-out",
        "icon-tag-sway": "icon-tag-sway 0.55s ease-in-out",
        "icon-box-jump": "icon-box-jump 0.4s ease-in-out",
        "icon-arrows-slide": "icon-arrows-slide 0.5s ease-in-out",
        "icon-bars-grow": "icon-bars-grow 0.45s ease-out both",
        "icon-bounce": "icon-bounce 0.4s ease-in-out",
        "icon-truck-slide": "icon-truck-slide 0.5s ease-in-out",
      },
    },
  },
  plugins: [],
};

export default config;
