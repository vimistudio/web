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
      "founders",
      "startups",
      "SaaS teams",
      "crypto founders",
      "product teams",
      "tech founders",
    ],
    large: [
      "SaaS founders",
      "technical founders",
      "crypto startups",
      "early-stage startups",
      "product builders",
      "ambitious founders",
      "first-time founders",
      "bootstrapped startups",
    ],
  },
  es: {
    small: [
      "fundadores",
      "startups",
      "equipos SaaS",
      "fundadores crypto",
      "equipos de producto",
      "fundadores tech",
    ],
    large: [
      "fundadores de SaaS",
      "fundadores técnicos",
      "startups crypto",
      "startups en etapa inicial",
      "constructores de productos",
      "fundadores ambiciosos",
      "fundadores primerizos",
      "startups bootstrapped",
    ],
  },
};
