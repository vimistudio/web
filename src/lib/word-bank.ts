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
