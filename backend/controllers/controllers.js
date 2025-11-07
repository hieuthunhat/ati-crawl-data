import { scrapeEbayWithPuppeteer } from "../services/eBay/ebayScrapeService.js";
import {
  getCategoryByText,
  scrapeChototWithPuppeteer,
} from "../services/Chotot/chototScrapeService.js";
import { scrapeTikiWithAPI } from "../services/Tiki/tikiScrapeService.js";
import geminiService from "../services/geminiService.js";
import scoringService from "../services/productScoringService.js";
import { getAICollection, admin } from "../config/firebase-db.js";
import aiConfig from "../config/ai-config.js";

export const getProductsData = async (req, res) => {
  const { 
    productName, 
    platform,
    // AI evaluation parameters (optional)
    criteria = {},
    storeResults = true,
    userId,
    sessionId,
  } = req.body;
  
  try {
    let scrapedProducts = [];
    
    //Scrape products based on platform
    console.log(`\nStarting ${platform} scraping for: ${productName}`);
    
    switch (platform) {
      case "ebay":
        scrapedProducts = await scrapeEbayWithPuppeteer({
          keyword: productName,
          pages: 3,
        });
        break;
      case "chotot":
        const category = getCategoryByText(productName);
        scrapedProducts = await scrapeChototWithPuppeteer({ category });
        break;
      case "tiki":
        scrapedProducts = await scrapeTikiWithAPI({ keyword: productName, pages: 3 });
        break;
      default:
        throw new Error("Unsupported platform");
    }

    console.log(`Scraping completed: ${scrapedProducts.length} products found`);

    //Automatic AI Evaluation
    let aiEvaluationResult = null;
    
    if (scrapedProducts.length > 0) {
      try {
        console.log(`\nStarting automatic AI evaluation...`);
        
        // Mathematical scoring
        console.log('Step 1/3: Mathematical scoring...');
        const scoredProducts = scoringService.scoreProducts(scrapedProducts, criteria);
        console.log(`${scoredProducts.length} products passed quality thresholds`);

        if (scoredProducts.length > 0) {
          // AI evaluation (top 10 products to avoid response truncation)
          console.log('Step 2/3: AI evaluation with Gemini 2.0 Flash...');
          const topProducts = scoredProducts.slice(0, 10);
          
          // Map scored products back to original products
          const productsForAI = topProducts.map(sp => {
            // Try to find by ID first (Tiki products)
            let original = scrapedProducts.find(p => p.id === sp.productId);
            
            // If not found by ID, try matching by name/title (eBay/Chotot products)
            if (!original) {
              original = scrapedProducts.find(p => 
                (p.name || p.title) === sp.productName
              );
            }
            
            // If still not found, try matching by link (extract ID from link)
            if (!original && sp.productId) {
              original = scrapedProducts.find(p => 
                p.link && p.link.includes(sp.productId)
              );
            }
            
            return original;
          }).filter(p => p !== undefined); // Remove any unmatched products
          
          if (productsForAI.length === 0) {
            throw new Error('Failed to map scored products to original products');
          }
          
          const aiEvaluation = await geminiService.evaluateProducts(
            productsForAI,
            criteria
          );

          // Store results in Firebase
          let storageResult = null;
          if (storeResults) {
            console.log('Step 3/3: Storing results in Firebase...');
            
            // Clean scraped products - remove undefined values
            const cleanedScrapedProducts = scrapedProducts.map(product => {
              const cleaned = {};
              Object.keys(product).forEach(key => {
                if (product[key] !== undefined) {
                  cleaned[key] = product[key];
                }
              });
              return cleaned;
            });
            
            const collection = getAICollection();
            const docData = {
              evaluation: aiEvaluation.evaluation,
              scoredProducts,
              scrapedProducts: cleanedScrapedProducts, // Use cleaned data
              metadata: {
                ...aiEvaluation.metadata,
                platform,
                searchQuery: productName,
                userId: userId || 'anonymous',
                sessionId: sessionId || `session-${Date.now()}`,
                totalProducts: scrapedProducts.length,
                qualifiedProducts: scoredProducts.length,
                criteria,
                storedAt: admin.firestore.FieldValue.serverTimestamp(),
                source: 'auto-evaluation',
              },
            };

            const docRef = await collection.add(docData);
            storageResult = {
              success: true,
              evaluationId: docRef.id,
              collection: aiConfig.firebase.aiCollection,
            };

            console.log(`Stored with ID: ${docRef.id}`);
          }

          aiEvaluationResult = {
            scoredProducts,
            aiEvaluation: aiEvaluation.evaluation,
            metadata: aiEvaluation.metadata,
            storage: storageResult,
          };

          console.log('AI evaluation complete!\n');
        } else {
          console.log('No products met quality thresholds for AI evaluation');
          aiEvaluationResult = {
            message: 'No products met the quality thresholds',
            scoredProducts: [],
            aiEvaluation: null,
          };
        }

      } catch (aiError) {
        console.error('AI evaluation failed:', aiError.message);
        aiEvaluationResult = {
          error: 'AI evaluation failed',
          details: aiError.message,
        };
      }
    }

    // Return comprehensive results
    res.status(200).json({
      success: true,
      message: "Scraping and AI evaluation completed successfully",
      scraping: {
        platform,
        query: productName,
        totalProducts: scrapedProducts.length,
        products: scrapedProducts,
      },
      aiEvaluation: aiEvaluationResult,
    });

  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};
