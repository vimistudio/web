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
      "inspired by stories.", // 20 chars
      "built on insights.", // 18 chars
      "powered by data.", // 16 chars
      "driven by vision.", // 17 chars
      "backed by research.", // 19 chars
      "crafted with passion.", // 21 chars
    ],
    large: [
      "inspired by stories.", // 20 chars
      "built on insights.", // 18 chars
      "powered by data.", // 16 chars
      "driven by vision.", // 17 chars (not "your vision" - too long!)
      "backed by research.", // 19 chars
      "crafted with passion.", // 21 chars
      "fueled by ambition.", // 19 chars
    ],
  },
  es: {
    small: [
      "inspirado por historias.", // 25 chars
      "construido con insights.", // 24 chars
      "impulsado por datos.", // 20 chars
      "guiado por visión.", // 18 chars
      "respaldado con datos.", // 21 chars ✓
      "creado con pasión.", // 18 chars
    ],
    large: [
      "inspirado por historias.", // 25 chars
      "construido con insights.", // 24 chars
      "impulsado por datos.", // 20 chars
      "guiado por visión.", // 18 chars
      "respaldado con datos.", // 21 chars ✓
      "creado con pasión.", // 18 chars
      "alimentado por ambición.", // 25 chars
    ],
  },
};
