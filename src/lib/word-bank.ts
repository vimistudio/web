import { Language } from "./i18n";

type WordBank = {
  [key in Language]: {
    small: string[];
    large: string[];
  };
};

export const statements: WordBank = {
  en: {
    small: [
      "SaaS teams",
      "tech founders",
      "product teams",
      "dev teams",
      "crypto teams",
      "AI founders",
    ],
    large: [
      "SaaS founders",
      "tech founders",
      "crypto founders",
      "AI startups",
      "product teams",
      "dev-heavy teams",
      "early startups",
      "MVP builders",
    ],
  },
  es: {
    small: [
      "equipos SaaS",
      "fundadores tech",
      "equipos de producto",
      "equipos dev",
      "equipos crypto",
      "fundadores AI",
    ],
    large: [
      "fundadores SaaS",
      "fundadores tech",
      "fundadores crypto",
      "startups AI",
      "equipos de producto",
      "equipos dev-heavy",
      "startups iniciales",
      "constructores MVP",
    ],
  },
};

// Second rotating section for the inspiration/approach
export const inspirations: WordBank = {
  en: {
    small: [
      "inspired by stories.",
      "built on insights.",
      "powered by data.",
      "driven by vision.",
      "backed by research.",
      "crafted with passion.",
    ],
    large: [
      "inspired by stories.",
      "built on insights.",
      "powered by data.",
      "driven by your vision.",
      "backed by research.",
      "crafted with passion.",
      "fueled by ambition.",
      "shaped by experience.",
    ],
  },
  es: {
    small: [
      "inspirado por historias.",
      "construido con insights.",
      "impulsado por datos.",
      "guiado por visión.",
      "respaldado por investigación.",
      "creado con pasión.",
    ],
    large: [
      "inspirado por historias.",
      "construido con insights.",
      "impulsado por datos.",
      "guiado por tu visión.",
      "respaldado por investigación.",
      "creado con pasión.",
      "alimentado por ambición.",
      "moldeado por experiencia.",
    ],
  },
};
