export const APPEARANCE_STORAGE_KEY = "cineastra-appearance"
export const DEFAULT_APPEARANCE = "cineastra"

export const appearances = [
  {
    value: "cineastra",
    label: "CineAstra",
    description: "Tema original",
    preview: ["#7C1029", "#FAD241", "#353323"],
  },
  {
    value: "violet-bloom",
    label: "Violet Bloom",
    description: "tweakcn",
    preview: ["#7033ff", "#e2ebff", "#1a1b1e"],
  },
  {
    value: "mocha-mousse",
    label: "Mocha Mousse",
    description: "tweakcn",
    preview: ["#a37764", "#e4c7b8", "#2d2521"],
  },
  {
  value: "catppucin",
  label: "Catppuccin",
  description: "Tema pastel",
  preview: ["#8839ef", "#04a5e5", "#181825"],
},
]

export const appearanceValues = appearances.map(({ value }) => value)

export function isAppearance(value) {
  return appearanceValues.includes(value)
}
