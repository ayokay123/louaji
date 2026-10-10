/** @type {import('tailwindcss').Config} */
// Louaji design tokens — derived from docs/DESIGN.md (the green brand palette,
// Cairo/Tajawal type, soft rounded shapes). Components consume these tokens via
// className utilities; never hardcode hex/px in components. Light theme only in
// v1 (a dark ramp is FUTURE — keep everything tokenized so it can be added
// without touching components).
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Brand green ramp (deep → mint).
        brand: {
          100: "#E7F4EC", // tint — selected-seat bg, success surface
          300: "#8FCDAC", // soft — secondary fills, low-emphasis chips
          500: "#1FA45D", // primary — CTAs, active tab, selected seat
          700: "#13693B", // dark — pressed CTA, heading accent
          900: "#0B3D26", // deep — logo ground, darkest accents
          DEFAULT: "#1FA45D",
        },
        // Ink (text).
        ink: {
          DEFAULT: "#1C2420",
          muted: "#5E6B64",
        },
        // Surfaces & borders.
        surface: {
          DEFAULT: "#FFFFFF",
          alt: "#F4F6F4", // app background / off-white
        },
        border: "#E3E7E4",
        // Semantic states.
        success: "#1FA45D",
        warning: "#E0A030",
        danger: "#D7453B",
      },
      fontFamily: {
        // Mapped to the exact family names registered by @expo-google-fonts
        // via useFonts() in the root layout. Cairo = headings/display,
        // Tajawal = body/UI.
        sans: ["Tajawal_400Regular"],
        body: ["Tajawal_400Regular"],
        "body-medium": ["Tajawal_500Medium"],
        heading: ["Cairo_600SemiBold"],
        display: ["Cairo_700Bold"],
      },
      borderRadius: {
        seat: "10px",
        input: "12px",
        card: "18px",
      },
    },
  },
  plugins: [],
};
