/**
 * Zakat calculation utilities and constants
 * Based on Islamic jurisprudence and current Malaysian standards
 */

// Current market rates - in a real application, these would be fetched from an API
export const ZAKAT_RATES = {
  // Gold and silver prices per gram in RM
  goldPrice: 280,
  silverPrice: 3.5,

  // Nisab thresholds
  nisabGold: 85, // grams (approximately 20 mithqal)
  nisabSilver: 595, // grams (approximately 200 dirhams)

  // Zakat percentages
  zakatRate: 2.5, // 2.5% for wealth, business, gold, silver
  agricultureRainFed: 10, // 10% for rain-fed crops
  agricultureIrrigated: 5, // 5% for irrigated crops

  // Zakat Fitrah
  fitrahRate: 7, // RM per person - current Malaysian rate

  // Agriculture nisab (in kg, rice equivalent)
  agricultureNisab: 653,
} as const;

export interface ZakatWealthInputs {
  cash: number;
  bankSavings: number;
  investments: number;
  gold: number; // in grams
  silver: number; // in grams
  businessAssets: number;
  debts: number;
  basicExpenses: number; // monthly
}

export interface ZakatBusinessInputs {
  inventory: number;
  receivables: number;
  cash: number;
  payables: number;
  expenses: number;
}

export interface ZakatAgricultureInputs {
  totalHarvest: number; // in kg
  marketValuePerKg: number;
  irrigationType: 'rain' | 'irrigation';
}

export interface ZakatFitrahInputs {
  numberOfPeople: number;
  customRate?: number;
}

export interface ZakatCalculationResult {
  zakatType:
    | 'wealth'
    | 'business'
    | 'agriculture'
    | 'fitrah'
    | 'gold'
    | 'silver';
  totalWealth: number;
  nisab: number;
  zakatDue: number;
  isEligible: boolean;
  haul: boolean; // Whether the wealth has been held for a full Islamic year
  calculations: Record<string, number>;
  breakdown: {
    assets: Record<string, number>;
    deductions: Record<string, number>;
  };
}

/**
 * Calculate Zakat on Wealth (Zakat al-Mal)
 */
export function calculateWealthZakat(
  inputs: ZakatWealthInputs
): ZakatCalculationResult {
  const { goldPrice, silverPrice, nisabGold, zakatRate } = ZAKAT_RATES;

  // Calculate total assets
  const assets = {
    cash: inputs.cash,
    bankSavings: inputs.bankSavings,
    investments: inputs.investments,
    goldValue: inputs.gold * goldPrice,
    silverValue: inputs.silver * silverPrice,
    businessAssets: inputs.businessAssets,
  };

  const totalAssets = Object.values(assets).reduce(
    (sum, value) => sum + value,
    0
  );

  // Calculate deductions
  const deductions = {
    debts: inputs.debts,
    basicExpenses: inputs.basicExpenses * 12, // Annual expenses
  };

  const totalDeductions = Object.values(deductions).reduce(
    (sum, value) => sum + value,
    0
  );

  // Net wealth
  const netWealth = totalAssets - totalDeductions;

  // Nisab threshold (using gold standard)
  const nisab = nisabGold * goldPrice;

  // Check eligibility
  const isEligible = netWealth >= nisab;

  // Calculate zakat due
  const zakatDue = isEligible ? (netWealth * zakatRate) / 100 : 0;

  return {
    zakatType: 'wealth',
    totalWealth: netWealth,
    nisab,
    zakatDue,
    isEligible,
    haul: true, // Assume haul completion for calculation
    calculations: {
      totalAssets,
      totalDeductions,
      zakatRate,
    },
    breakdown: {
      assets,
      deductions,
    },
  };
}

/**
 * Calculate Business Zakat (Zakat al-Tijarah)
 */
export function calculateBusinessZakat(
  inputs: ZakatBusinessInputs
): ZakatCalculationResult {
  const { goldPrice, nisabGold, zakatRate } = ZAKAT_RATES;

  // Business assets
  const assets = {
    inventory: inputs.inventory,
    receivables: inputs.receivables,
    cash: inputs.cash,
  };

  const totalAssets = Object.values(assets).reduce(
    (sum, value) => sum + value,
    0
  );

  // Business deductions
  const deductions = {
    payables: inputs.payables,
    expenses: inputs.expenses,
  };

  const totalDeductions = Object.values(deductions).reduce(
    (sum, value) => sum + value,
    0
  );

  // Net business wealth
  const netBusinessWealth = totalAssets - totalDeductions;

  // Nisab threshold
  const nisab = nisabGold * goldPrice;

  // Check eligibility
  const isEligible = netBusinessWealth >= nisab;

  // Calculate zakat due
  const zakatDue = isEligible ? (netBusinessWealth * zakatRate) / 100 : 0;

  return {
    zakatType: 'business',
    totalWealth: netBusinessWealth,
    nisab,
    zakatDue,
    isEligible,
    haul: true,
    calculations: {
      totalAssets,
      totalDeductions,
      zakatRate,
    },
    breakdown: {
      assets,
      deductions,
    },
  };
}

/**
 * Calculate Agricultural Zakat (Zakat al-Zuru)
 */
export function calculateAgricultureZakat(
  inputs: ZakatAgricultureInputs
): ZakatCalculationResult {
  const { agricultureRainFed, agricultureIrrigated, agricultureNisab } =
    ZAKAT_RATES;

  // Determine zakat rate based on irrigation type
  const zakatRate =
    inputs.irrigationType === 'rain'
      ? agricultureRainFed
      : agricultureIrrigated;

  // Calculate total harvest value
  const totalValue = inputs.totalHarvest * inputs.marketValuePerKg;

  // Nisab in monetary terms (653 kg of rice equivalent)
  const nisab = agricultureNisab * inputs.marketValuePerKg;

  // Check eligibility
  const isEligible = totalValue >= nisab;

  // Calculate zakat due
  const zakatDue = isEligible ? (totalValue * zakatRate) / 100 : 0;

  return {
    zakatType: 'agriculture',
    totalWealth: totalValue,
    nisab,
    zakatDue,
    isEligible,
    haul: false, // Agriculture zakat is due immediately upon harvest
    calculations: {
      totalHarvest: inputs.totalHarvest,
      marketValuePerKg: inputs.marketValuePerKg,
      zakatRate,
    },
    breakdown: {
      assets: {
        harvestValue: totalValue,
      },
      deductions: {},
    },
  };
}

/**
 * Calculate Zakat Fitrah
 */
export function calculateFitrahZakat(
  inputs: ZakatFitrahInputs
): ZakatCalculationResult {
  const rate = inputs.customRate || ZAKAT_RATES.fitrahRate;
  const zakatDue = inputs.numberOfPeople * rate;

  return {
    zakatType: 'fitrah',
    totalWealth: 0,
    nisab: 0,
    zakatDue,
    isEligible: true, // Fitrah is obligatory for all capable Muslims
    haul: false, // No haul requirement for Fitrah
    calculations: {
      numberOfPeople: inputs.numberOfPeople,
      ratePerPerson: rate,
    },
    breakdown: {
      assets: {},
      deductions: {},
    },
  };
}

/**
 * Calculate Gold Zakat specifically
 */
export function calculateGoldZakat(
  goldInGrams: number
): ZakatCalculationResult {
  const { goldPrice, nisabGold, zakatRate } = ZAKAT_RATES;

  const totalValue = goldInGrams * goldPrice;
  const nisab = nisabGold * goldPrice;
  const isEligible = goldInGrams >= nisabGold;
  const zakatDue = isEligible ? (totalValue * zakatRate) / 100 : 0;

  return {
    zakatType: 'gold',
    totalWealth: totalValue,
    nisab,
    zakatDue,
    isEligible,
    haul: true,
    calculations: {
      goldInGrams,
      goldPrice,
      zakatRate,
    },
    breakdown: {
      assets: {
        goldValue: totalValue,
      },
      deductions: {},
    },
  };
}

/**
 * Calculate Silver Zakat specifically
 */
export function calculateSilverZakat(
  silverInGrams: number
): ZakatCalculationResult {
  const { silverPrice, nisabSilver, zakatRate } = ZAKAT_RATES;

  const totalValue = silverInGrams * silverPrice;
  const nisab = nisabSilver * silverPrice;
  const isEligible = silverInGrams >= nisabSilver;
  const zakatDue = isEligible ? (totalValue * zakatRate) / 100 : 0;

  return {
    zakatType: 'silver',
    totalWealth: totalValue,
    nisab,
    zakatDue,
    isEligible,
    haul: true,
    calculations: {
      silverInGrams,
      silverPrice,
      zakatRate,
    },
    breakdown: {
      assets: {
        silverValue: totalValue,
      },
      deductions: {},
    },
  };
}

/**
 * Format currency for display
 */
export function formatCurrency(
  amount: number,
  currency = 'MYR',
  locale = 'ms-MY'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Get human-readable zakat type labels
 */
export function getZakatTypeLabel(
  type: string,
  language: 'en' | 'ms' = 'en'
): string {
  const labels = {
    en: {
      wealth: 'Wealth Zakat',
      business: 'Business Zakat',
      agriculture: 'Agricultural Zakat',
      fitrah: 'Zakat Fitrah',
      gold: 'Gold Zakat',
      silver: 'Silver Zakat',
    },
    ms: {
      wealth: 'Zakat Harta',
      business: 'Zakat Perniagaan',
      agriculture: 'Zakat Pertanian',
      fitrah: 'Zakat Fitrah',
      gold: 'Zakat Emas',
      silver: 'Zakat Perak',
    },
  };

  return labels[language][type as keyof typeof labels.en] || type;
}

/**
 * Validate zakat inputs
 */
export function validateZakatInputs(type: string, inputs: any): string[] {
  const errors: string[] = [];

  switch (type) {
    case 'wealth':
      if (inputs.cash < 0) errors.push('Cash amount cannot be negative');
      if (inputs.bankSavings < 0)
        errors.push('Bank savings cannot be negative');
      if (inputs.gold < 0) errors.push('Gold amount cannot be negative');
      if (inputs.silver < 0) errors.push('Silver amount cannot be negative');
      break;

    case 'business':
      if (inputs.inventory < 0)
        errors.push('Inventory value cannot be negative');
      if (inputs.receivables < 0) errors.push('Receivables cannot be negative');
      if (inputs.cash < 0) errors.push('Cash amount cannot be negative');
      break;

    case 'agriculture':
      if (inputs.totalHarvest <= 0)
        errors.push('Total harvest must be greater than zero');
      if (inputs.marketValuePerKg <= 0)
        errors.push('Market value per kg must be greater than zero');
      break;

    case 'fitrah':
      if (inputs.numberOfPeople <= 0)
        errors.push('Number of people must be at least 1');
      break;
  }

  return errors;
}
