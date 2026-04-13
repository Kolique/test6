import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        mairia: {
          blue: "#0055A4",
          red: "#EF4135",
          white: "#FFFFFF",
        },
      },
    },
  },
  plugins: [],
};
export default config;
