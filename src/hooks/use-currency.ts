import { useState, useEffect, useMemo } from "react";

// Map browser locale to currency
function getCurrencyFromLocale(): string {
  const locale = navigator.language || "de-CH";
  const localeCurrencyMap: Record<string, string> = {
    "de-CH": "CHF", "fr-CH": "CHF", "it-CH": "CHF",
    "de-AT": "EUR", "de-DE": "EUR", "fr-FR": "EUR", "es-ES": "EUR",
    "it-IT": "EUR", "nl-NL": "EUR", "pt-PT": "EUR", "fi-FI": "EUR",
    "el-GR": "EUR", "sk-SK": "EUR", "sl-SI": "EUR", "et-EE": "EUR",
    "lv-LV": "EUR", "lt-LT": "EUR", "hr-HR": "EUR", "bg-BG": "EUR",
    "ro-RO": "EUR", "en-IE": "EUR",
    "en-US": "USD", "es-MX": "USD", "es-CO": "USD",
    "en-GB": "GBP",
    "ja-JP": "JPY",
    "ko-KR": "KRW",
    "zh-CN": "CNY", "zh-TW": "TWD",
    "pt-BR": "BRL",
    "en-IN": "INR", "hi-IN": "INR",
    "en-AU": "AUD",
    "en-CA": "CAD",
    "sv-SE": "SEK",
    "da-DK": "DKK",
    "nb-NO": "NOK", "nn-NO": "NOK",
    "pl-PL": "PLN",
    "cs-CZ": "CZK",
    "hu-HU": "HUF",
    "tr-TR": "TRY",
    "uk-UA": "UAH",
    "ru-RU": "RUB",
    "th-TH": "THB",
    "vi-VN": "VND",
    "id-ID": "IDR",
    "ms-MY": "MYR",
    "tl-PH": "PHP",
    "en-ZA": "ZAR", "af-ZA": "ZAR",
    "en-NG": "NGN",
    "sw-KE": "KES",
    "am-ET": "ETB",
    "ar-SA": "SAR", "ar-AE": "AED",
    "he-IL": "ILS",
  };

  // Try exact match first
  if (localeCurrencyMap[locale]) return localeCurrencyMap[locale];

  // Try language-only match
  const lang = locale.split("-")[0];
  const langMap: Record<string, string> = {
    de: "EUR", fr: "EUR", es: "EUR", it: "EUR", nl: "EUR",
    pt: "EUR", fi: "EUR", el: "EUR", sk: "EUR", hr: "EUR",
    bg: "EUR", ro: "EUR", da: "DKK", sv: "SEK", no: "NOK",
    pl: "PLN", cs: "CZK", hu: "HUF", tr: "TRY", uk: "UAH",
    ru: "RUB", ko: "KRW", zh: "CNY", ja: "JPY", vi: "VND",
    id: "IDR", tl: "PHP", sw: "KES", am: "ETB", af: "ZAR",
    en: "USD", ar: "SAR", hy: "AMD", ka: "GEL", ig: "NGN",
    yo: "NGN", zu: "ZAR", ht: "HTG", sr: "RSD",
  };
  return langMap[lang] || "CHF";
}

// Currency symbols for display
const currencySymbols: Record<string, string> = {
  CHF: "CHF", EUR: "€", USD: "$", GBP: "£", JPY: "¥",
  KRW: "₩", CNY: "¥", TWD: "NT$", BRL: "R$", INR: "₹",
  AUD: "A$", CAD: "C$", SEK: "kr", DKK: "kr", NOK: "kr",
  PLN: "zł", CZK: "Kč", HUF: "Ft", TRY: "₺", UAH: "₴",
  RUB: "₽", THB: "฿", VND: "₫", IDR: "Rp", MYR: "RM",
  PHP: "₱", ZAR: "R", NGN: "₦", KES: "KSh", ETB: "Br",
  SAR: "﷼", AED: "د.إ", ILS: "₪", AMD: "֏", GEL: "₾",
  HTG: "G", RSD: "din",
};

const CACHE_KEY = "biblebot-fx-rates";
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

type CachedRates = { rates: Record<string, number>; ts: number };

async function fetchRates(): Promise<Record<string, number>> {
  // Check cache
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed: CachedRates = JSON.parse(cached);
      if (Date.now() - parsed.ts < CACHE_TTL) return parsed.rates;
    }
  } catch {}

  // Fetch from free API (base CHF)
  try {
    const resp = await fetch("https://api.exchangerate-api.com/v4/latest/CHF");
    if (resp.ok) {
      const data = await resp.json();
      const rates: Record<string, number> = data.rates || {};
      rates["CHF"] = 1;
      localStorage.setItem(CACHE_KEY, JSON.stringify({ rates, ts: Date.now() }));
      return rates;
    }
  } catch {}

  // Fallback static rates (approximate)
  return {
    CHF: 1, EUR: 0.95, USD: 1.10, GBP: 0.82, JPY: 165,
    KRW: 1450, CNY: 7.8, BRL: 5.5, INR: 92, AUD: 1.6,
    CAD: 1.45, SEK: 11.2, DKK: 7.1, NOK: 11.5, PLN: 4.3,
    CZK: 24, HUF: 390, TRY: 35, UAH: 42, RUB: 100,
    THB: 38, ZAR: 19, NGN: 1650, TWD: 33, VND: 27000,
    IDR: 17000, MYR: 4.8, PHP: 60, KES: 155, ETB: 62,
    SAR: 4.1, AED: 4.0, ILS: 3.9, AMD: 420, GEL: 2.9,
    HTG: 145, RSD: 115,
  };
}

function roundToNearest10(value: number): number {
  return Math.round(value / 10) * 10;
}

export type CurrencyConverter = {
  /** Convert a CHF amount to local currency, rounded to nearest 10 */
  convert: (chfAmount: number) => number;
  /** Format a CHF amount as local price string (e.g. "€ 940") */
  formatPrice: (chfAmount: number) => string;
  /** The detected currency code */
  currency: string;
  /** The currency symbol */
  symbol: string;
  /** Whether rates are still loading */
  isLoading: boolean;
};

export function useCurrency(): CurrencyConverter {
  const [rates, setRates] = useState<Record<string, number> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const currency = useMemo(() => getCurrencyFromLocale(), []);
  const symbol = currencySymbols[currency] || currency;

  useEffect(() => {
    fetchRates().then((r) => {
      setRates(r);
      setIsLoading(false);
    });
  }, []);

  const convert = useMemo(() => {
    return (chfAmount: number): number => {
      if (chfAmount === 0) return 0;
      if (!rates || currency === "CHF") return chfAmount;
      const rate = rates[currency] || 1;
      return roundToNearest10(chfAmount * rate);
    };
  }, [rates, currency]);

  const formatPrice = useMemo(() => {
    return (chfAmount: number): string => {
      if (chfAmount === 0) {
        if (currency === "CHF") return "CHF 0.–";
        return `${symbol} 0`;
      }
      const converted = convert(chfAmount);
      if (currency === "CHF") return `CHF ${converted.toLocaleString("de-CH")}.–`;
      return `${symbol} ${converted.toLocaleString()}`;
    };
  }, [convert, currency, symbol]);

  return { convert, formatPrice, currency, symbol, isLoading };
}
