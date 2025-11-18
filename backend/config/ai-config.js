import dotenv from 'dotenv';
dotenv.config();

const aiConfig = {
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite',
    temperature: parseFloat(process.env.GEMINI_TEMPERATURE) || 0.7,
    maxTokens: parseInt(process.env.GEMINI_MAX_TOKENS) || 16384,
  },

  defaultWeights: {
    profitWeight: 0.60,
    reviewWeight: 0.40,
    trendWeight: 0.00,
  },

  defaultThresholds: {
    minReviewScore: 2.0,
    minReviewCount: 5,
    minProfitMargin: 0.15,
    minFinalScore: 0.40,
  },

  priceTiers: {
    tier1: { min: 1, max: 50, markup: 0.20 },
    tier2: { min: 51, max: 200, markup: 0.30 },
    tier3: { min: 201, max: Infinity, markup: 0.40 },
  },

  fees: {
    shopifyTransactionFee: 0.029,
    shopifyFixedFee: 0.30
  },
};

if (!aiConfig.gemini.apiKey) {
  console.warn('GEMINI_API_KEY not configured - AI features will be disabled');
}

export default aiConfig;