export interface Currency {
  value: 'USD' | 'CAD' | 'EUR' | 'GBP' | 'MXN' | 'PEN' | 'BRL' | 'COP';
  label: string;
  symbol: string;
}

export const currencies: Currency[] = [
  { value: 'USD', label: 'US Dollar', symbol: '$' },
  { value: 'CAD', label: 'Canadian Dollar', symbol: 'C$' },
  { value: 'EUR', label: 'Euro', symbol: '€' },
  { value: 'GBP', label: 'British Pound', symbol: '£' },
  { value: 'MXN', label: 'Mexican Peso', symbol: 'MX$' },
  { value: 'PEN', label: 'Peruvian Sol', symbol: 'S/' },
  { value: 'BRL', label: 'Brazilian Real', symbol: 'R$' },
  { value: 'COP', label: 'Colombian Peso', symbol: 'COL$' },
];

export const getCurrencySymbol = (currencyCode: string): string => {
  const currency = currencies.find((c) => c.value === currencyCode);
  return currency?.symbol || '$';
};

export type CurrencyType = Currency['value'];
