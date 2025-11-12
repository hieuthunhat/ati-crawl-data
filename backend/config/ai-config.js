/**
 * AI Module Configuration
 * Uses ES6 modules to match existing backend
 */

import dotenv from 'dotenv';
dotenv.config();

const aiConfig = {
  // Gemini AI configuration
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite',
    temperature: parseFloat(process.env.GEMINI_TEMPERATURE) || 0.7,
    maxTokens: parseInt(process.env.GEMINI_MAX_TOKENS) || 16384, // Increased to prevent truncation (max for Gemini)
  },

  // Firebase configuration (separate collection for AI)
  firebase: {
    serviceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH || '../environment/firebase-service-account.json',
    databaseUrl: process.env.FIREBASE_DATABASE_URL,
    aiCollection: process.env.FIREBASE_AI_COLLECTION || 'ai-evaluations',
  },

  // Scoring weights
  defaultWeights: {
    profitWeight: 0.60,
    reviewWeight: 0.40,
    trendWeight: 0.00,
  },

  // Quality thresholds
  defaultThresholds: {
    minReviewScore: 2.0,
    minReviewCount: 10,
    minProfitMargin: 0.20,
    minFinalScore: 0.50,
  },

  // Price tiers for markup calculation
  priceTiers: {
    tier1: { min: 1, max: 50, markup: 0.20 },
    tier2: { min: 51, max: 200, markup: 0.30 },
    tier3: { min: 201, max: Infinity, markup: 0.40 },
  },

  // Shopify fees for profit calculation
  fees: {
    shopifyTransactionFee: 0.029, // 2.9%
    shopifyFixedFee: 0.30, // $0.30 per transaction
  },
};

// Validation
if (!aiConfig.gemini.apiKey) {
  console.warn('GEMINI_API_KEY not configured - AI features will be disabled');
}

if (!aiConfig.firebase.serviceAccountPath) {
  console.warn('FIREBASE_SERVICE_ACCOUNT_PATH not configured - Storage features will be disabled');
}

export default aiConfig;