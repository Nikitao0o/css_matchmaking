export interface CountryOption {
  code: string;
  name: string;
  region: string;
}

export const COUNTRIES: CountryOption[] = [
  { code: 'RU', name: 'Россия', region: 'СНГ' },
  { code: 'BY', name: 'Беларусь', region: 'СНГ' },
  { code: 'KZ', name: 'Казахстан', region: 'СНГ' },
  { code: 'UA', name: 'Украина', region: 'СНГ' },
  { code: 'UZ', name: 'Узбекистан', region: 'СНГ' },
  { code: 'AM', name: 'Армения', region: 'СНГ' },
  { code: 'AZ', name: 'Азербайджан', region: 'СНГ' },
  { code: 'GE', name: 'Грузия', region: 'Кавказ' },
  { code: 'EU', name: 'Европа (общий)', region: 'Европа' },
  { code: 'DE', name: 'Германия', region: 'Европа' },
  { code: 'PL', name: 'Польша', region: 'Европа' },
  { code: 'SE', name: 'Швеция', region: 'Европа' },
  { code: 'FI', name: 'Финляндия', region: 'Европа' },
  { code: 'NL', name: 'Нидерланды', region: 'Европа' },
  { code: 'FR', name: 'Франция', region: 'Европа' },
  { code: 'GB', name: 'Великобритания', region: 'Европа' },
  { code: 'TR', name: 'Турция', region: 'Европа / Азия' },
  { code: 'US', name: 'США', region: 'Северная Америка' },
  { code: 'CA', name: 'Канада', region: 'Северная Америка' },
  { code: 'BR', name: 'Бразилия', region: 'Южная Америка' },
  { code: 'CN', name: 'Китай', region: 'Азия' },
  { code: 'KR', name: 'Южная Корея', region: 'Азия' },
  { code: 'JP', name: 'Япония', region: 'Азия' },
];

const COUNTRY_MAP = new Map(COUNTRIES.map((c) => [c.code, c]));

export function isValidCountryCode(code?: string | null): boolean {
  if (!code) return false;
  return COUNTRY_MAP.has(code.trim().toUpperCase());
}

export function getCountryName(code?: string | null): string {
  const normalized = code?.trim().toUpperCase() || 'RU';
  return COUNTRY_MAP.get(normalized)?.name ?? 'Россия';
}
