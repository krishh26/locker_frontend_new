// Blue theme palette colors (Cobalt, Bright Blue, Teal, Aqua, Light Blue + shades)
// Theme CSS variable names to pick from (resolved at runtime)
const cssVars = [
  "--primary",
  "--secondary",
  "--accent",
  "--ring",
  "--chart-1",
  "--chart-2",
  "--chart-3",
  "--chart-4",
  "--chart-5",
];

export const getRandomColor = (seed: string | undefined): string => {
  if (typeof window === "undefined") return "#004aad"; // SSR fallback

  let hash = 0;
  const s = seed || "default";
  for (let i = 0; i < s.length; i++) {
    hash = s.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash) % cssVars.length;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(cssVars[index])
    .trim();

  return value || "#004aad";
};

