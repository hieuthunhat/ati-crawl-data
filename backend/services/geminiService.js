import { GoogleGenerativeAI } from '@google/generative-ai';
import aiConfig from '../config/ai-config.js';

let genAI = null;
let model = null;

/**
 * Initialize Gemini AI
 */
export const initializeGemini = () => {
  if (!aiConfig.gemini.apiKey) {
    console.warn('Gemini API key not configured - AI evaluation disabled');
    return null;
  }

  if (!genAI) {
    try {
      genAI = new GoogleGenerativeAI(aiConfig.gemini.apiKey);
      model = genAI.getGenerativeModel({ 
        model: aiConfig.gemini.model,
        generationConfig: {
          temperature: aiConfig.gemini.temperature,
          maxOutputTokens: aiConfig.gemini.maxTokens,
          responseMimeType: "application/json", // Force JSON output
        },
      });
      console.log('Gemini AI initialized with JSON mode');
    } catch (error) {
      console.error('Gemini initialization failed:', error.message);
      return null;
    }
  }
  return model;
};

/**
 * Build evaluation prompt for Gemini
 */
const buildEvaluationPrompt = (products, criteria) => {
  const {
    weights = aiConfig.defaultWeights,
    thresholds = aiConfig.defaultThresholds,
  } = criteria;

  // Format products list
  const formattedProducts = products.map((p, i) => {
    const price = p.price || 0;
    const originalPrice = p.original_price || p.list_price || price;
    const discount = p.discount_rate || ((originalPrice - price) / originalPrice * 100);
    const rating = p.rating_average || p.rating || 0;
    const reviews = p.review_count || p.reviews || 0;
    const seller = p.seller?.name || p.current_seller?.name || 'N/A';
    const sold = p.quantity_sold?.text || p.all_time_quantity_sold || 'N/A';

    const productText = [
      'Product ' + (i + 1) + ':',
      '- ID: ' + (p.id || p._id),
      '- Name: ' + (p.name || p.title),
      '- Price: ' + price.toLocaleString() + ' VND',
      '- Original Price: ' + originalPrice.toLocaleString() + ' VND',
      '- Discount: ' + discount.toFixed(1) + '%',
      '- Rating: ' + rating + '/5 (' + reviews + ' reviews)',
      '- Seller: ' + seller,
      '- Quantity Sold: ' + sold,
      '- URL: ' + (p.url_path || p.short_url || 'N/A')
    ].join('\n');

    return productText;
  }).join('\n\n');

  // Calculate percentages
  const profitWeightPct = (weights.profitWeight * 100).toFixed(0);
  const reviewWeightPct = (weights.reviewWeight * 100).toFixed(0);
  const trendWeightPct = (weights.trendWeight * 100).toFixed(0);
  const minProfitPct = (thresholds.minProfitMargin * 100).toFixed(0);
  const minScorePct = (thresholds.minFinalScore * 100).toFixed(0);

  // Build prompt using string concatenation
  const prompt = [
    'You are a professional Vietnamese e-commerce product analyst specializing in dropshipping for Shopify merchants.',
    '',
    'EVALUATION CRITERIA:',
    '- Profit Potential Weight: ' + profitWeightPct + '%',
    '- Review Quality Weight: ' + reviewWeightPct + '%',
    '- Market Trend Weight: ' + trendWeightPct + '%',
    '',
    'QUALITY THRESHOLDS:',
    '- Minimum Rating: ' + thresholds.minReviewScore + '/5 stars',
    '- Minimum Reviews: ' + thresholds.minReviewCount,
    '- Minimum Profit Margin: ' + minProfitPct + '%',
    '- Minimum Final Score: ' + minScorePct + '%',
    '',
    'PRICING STRATEGY:',
    '- Products 1-50k VND: 20% markup',
    '- Products 51-200k VND: 30% markup',
    '- Products 201k+ VND: 40% markup',
    '- Shopify fees: 2.9% + 0.30 USD per transaction',
    '',
    'PRODUCTS TO EVALUATE (' + products.length + ' total):',
    formattedProducts,
    '',
    'TASK:',
    'Evaluate each product for dropshipping potential. Calculate profit margins after Shopify fees.',
    'Rank products by final score (profit × ' + weights.profitWeight + ' + reviews × ' + weights.reviewWeight + ' + trend × ' + weights.trendWeight + ').',
    '',
    'CRITICAL INSTRUCTIONS:',
    '1. Return ONLY valid JSON - no explanations, no markdown, no code blocks',
    '2. Do not include backticks or code markers',
    '3. Ensure all strings are properly escaped',
    '4. Do not use newlines inside string values',
    '5. All numbers must be valid (not NaN or Infinity)',
    '6. No trailing commas',
    '7. Start response with { and end with }',
    '8. Keep all text SHORT - max 2 strengths/weaknesses, 1 sentence recommendation',
    '9. IMPORTANT: Complete the entire JSON - do not truncate',
    '',
    'Required JSON structure:',
    '{',
    '  "evaluatedProducts": [',
    '    {',
    '      "productId": 123,',
    '      "productName": "Product name here",',
    '      "rank": 1,',
    '      "scores": {',
    '        "profitScore": 0.85,',
    '        "reviewScore": 0.90,',
    '        "trendScore": 0.75,',
    '        "finalScore": 0.84',
    '      },',
    '      "pricing": {',
    '        "costPrice": 100000,',
    '        "suggestedSellingPrice": 140000,',
    '        "shopifyFee": 4360,',
    '        "netProfit": 35640,',
    '        "profitMargin": 25.46',
    '      },',
    '      "analysis": {',
    '        "strengths": ["High profit margin", "Good reviews"],',
    '        "weaknesses": ["High price point", "Limited sales data"],',
    '        "riskLevel": "low",',
    '        "recommendation": "Recommended for dropshipping with strong marketing."',
    '      }',
    '    }',
    '  ],',
    '  "summary": {',
    '    "totalEvaluated": ' + products.length + ',',
    '    "totalRecommended": 10,',
    '    "averageScore": 0.75,',
    '    "averageProfitMargin": 28.5,',
    '    "priceRange": {"min": 50000, "max": 500000},',
    '    "topCategory": "Electronics",',
    '    "marketInsights": ["Strong demand for tech products", "Competitive pricing", "Good seller reputation"]',
    '  }',
    '}',
    '',
    'Return pure JSON only. No extra text before or after.'
  ].join('\n');

  return prompt;
};

/**
 * Evaluate products with Gemini AI
 */
export const evaluateProducts = async (products, criteria = {}) => {
  try {
    const aiModel = initializeGemini();
    
    if (!aiModel) {
      throw new Error('Gemini AI not initialized - check GEMINI_API_KEY in .env');
    }

    if (!products || !Array.isArray(products) || products.length === 0) {
      throw new Error('Products array is required and must not be empty');
    }

    console.log(`Evaluating ${products.length} products with Gemini AI...`);
    
    const prompt = buildEvaluationPrompt(products, criteria);
    const result = await aiModel.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    console.log('Raw Gemini response length:', text.length);

    // Clean response (remove markdown code blocks)
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Extract JSON from response (in case there's extra text)
    let jsonText = text;
    
    // Try to find JSON object boundaries
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      jsonText = text.substring(jsonStart, jsonEnd + 1);
    }

    // Parse JSON with better error handling
    let evaluation;
    try {
      evaluation = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('JSON parse error:', parseError.message);
      
      // Show problematic snippet
      const errorPos = parseInt(parseError.message.match(/\d+/)?.[0]) || 0;
      const snippetStart = Math.max(0, errorPos - 100);
      const snippetEnd = Math.min(jsonText.length, errorPos + 100);
      console.error('Problematic JSON snippet:', jsonText.substring(snippetStart, snippetEnd));
      
      // Try multiple fix strategies
      let fixedJson = jsonText;
      
      // Strategy 1: Remove trailing commas
      fixedJson = fixedJson.replace(/,(\s*[}\]])/g, '$1');
      
      // Strategy 2: Remove control characters
      fixedJson = fixedJson.replace(/[\u0000-\u001F]+/g, '');
      
      // Strategy 3: Fix incomplete JSON (add missing closing braces)
      const openBraces = (fixedJson.match(/{/g) || []).length;
      const closeBraces = (fixedJson.match(/}/g) || []).length;
      const openBrackets = (fixedJson.match(/\[/g) || []).length;
      const closeBrackets = (fixedJson.match(/\]/g) || []).length;
      
      // Add missing closing braces/brackets
      if (openBraces > closeBraces) {
        const missingBraces = openBraces - closeBraces;
        console.log(`Adding ${missingBraces} missing closing braces`);
        fixedJson += '}'.repeat(missingBraces);
      }
      if (openBrackets > closeBrackets) {
        const missingBrackets = openBrackets - closeBrackets;
        console.log(`Adding ${missingBrackets} missing closing brackets`);
        fixedJson += ']'.repeat(missingBrackets);
      }
      
      try {
        evaluation = JSON.parse(fixedJson);
        console.log('Successfully parsed after fixing JSON');
      } catch (secondError) {
        console.error('Could not parse JSON even after fixes');
        console.error('Second error:', secondError.message);
        
        // Strategy 4: Try to salvage partial data more aggressively
        try {
          console.log('Attempting aggressive salvage...');
          
          // Find the last complete product object
          let truncatedJson = fixedJson;
          
          // Remove incomplete trailing data after last complete }
          const lastCompleteObject = truncatedJson.lastIndexOf('}');
          if (lastCompleteObject > 0) {
            truncatedJson = truncatedJson.substring(0, lastCompleteObject + 1);
          }
          
          // Close any open arrays and objects
          truncatedJson = truncatedJson.trim();
          if (!truncatedJson.endsWith(']')) {
            truncatedJson += ']';
          }
          if (!truncatedJson.endsWith('}')) {
            truncatedJson += '}';
          }
          
          // Try parsing the truncated version
          try {
            evaluation = JSON.parse(truncatedJson);
            console.log('Salvaged by removing incomplete data');
          } catch (truncError) {
            // Manual reconstruction
            console.log('Manual reconstruction attempt...');
            
            // Extract just completed product objects
            const productMatches = truncatedJson.match(/\{[^{}]*"productId"[^{}]*"analysis"[^{}]*\}/g);
            if (productMatches && productMatches.length > 0) {
              const productsJson = '[' + productMatches.join(',') + ']';
              evaluation = {
                evaluatedProducts: JSON.parse(productsJson),
                summary: {
                  totalEvaluated: productMatches.length,
                  totalRecommended: productMatches.length,
                  averageScore: 0,
                  marketInsights: ['Partial evaluation - some products were truncated']
                }
              };
              console.log(`Salvaged ${productMatches.length} complete product(s)`);
            } else {
              throw new Error('No complete products found');
            }
          }
        } catch (thirdError) {
          // Final fallback
          console.error('All salvage attempts failed');
          console.error('Creating empty fallback response.');
          evaluation = {
            evaluatedProducts: [],
            summary: {
              totalEvaluated: 0,
              totalRecommended: 0,
              averageScore: 0,
              marketInsights: ['AI evaluation failed - invalid response format']
            }
          };
        }
      }
    }
    
    const evaluatedCount = evaluation.evaluatedProducts?.length || 0;
    console.log(`Gemini evaluation complete: ${evaluatedCount} products analyzed`);

    return {
      success: true,
      evaluation,
      metadata: {
        timestamp: new Date().toISOString(),
        productsEvaluated: products.length,
        criteria,
        model: aiConfig.gemini.model,
      },
    };
  } catch (error) {
    console.error('Gemini evaluation error:', error.message);
    
    if (error instanceof SyntaxError) {
      throw new Error('Failed to parse AI response - invalid JSON format');
    }
    
    throw error;
  }
};

/**
 * Check if Gemini is available
 */
export const isGeminiAvailable = () => {
  return !!aiConfig.gemini.apiKey;
};

export default {
  initializeGemini,
  evaluateProducts,
  isGeminiAvailable,
};
