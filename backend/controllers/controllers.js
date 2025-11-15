import { scrapeEbayWithPuppeteer } from "../services/eBay/ebayScrapeService.js";
import { scrapeTikiWithAPI } from "../services/Tiki/tikiScrapeService.js";
import geminiService from "../services/geminiService.js";
import scoringService from "../services/productScoringService.js";
import { admin, storeEvaluation, getEvaluationById } from "../config/firebase-db.js";
import { transformToSimplifiedFormat } from "../presenters/productPresenter.js";

export const getProductsData = async (req, res) => {
  const { 
    productName, 
    platform,
    criteria = {},
    storeResults = true,
  } = req.body;
  
  try {
    let scrapedProducts = [];

    console.log(`\nStarting ${platform} scraping for: ${productName}`);
    
    switch (platform) {
      case "ebay":
        scrapedProducts = await scrapeEbayWithPuppeteer({
          keyword: productName,
          pages: 3,
        });
        break;
      case "tiki":
        scrapedProducts = await scrapeTikiWithAPI({ keyword: productName, pages: 3 });
        break;
      default:
        throw new Error("Unsupported platform");
    }

    console.log(`Scraping completed: ${scrapedProducts.length} products found`);

    let aiEvaluationResult = null;
    
    if (scrapedProducts.length > 0) {
      try {
        console.log(`\nStarting automatic AI evaluation...`);
        
        console.log('Step 1/3: Mathematical scoring...');
        const scoredProducts = scoringService.scoreProducts(scrapedProducts, criteria);
        console.log(`${scoredProducts.length} products passed quality thresholds`);

        if (scoredProducts.length > 0) {
          console.log('Step 2/3: AI evaluation with Gemini 2.0 Flash...');
          const topProducts = scoredProducts.slice(0, 10);

          const productsForAI = topProducts.map(sp => {
            let original = scrapedProducts.find(p => p.id === sp.productId);

            if (!original) {
              original = scrapedProducts.find(p => 
                (p.name || p.title) === sp.productName
              );
            }
            if (!original && sp.productId) {
              original = scrapedProducts.find(p => 
                p.link && p.link.includes(sp.productId)
              );
            }
            
            return original;
          }).filter(p => p !== undefined);
          
          if (productsForAI.length === 0) {
            throw new Error('Failed to map scored products to original products');
          }
          
          const aiEvaluation = await geminiService.evaluateProducts(
            productsForAI,
            criteria
          );

          let storageResult = null;
          if (storeResults) {
            console.log('Step 3/3: Storing and retrieving results from Firebase...');
            
            const cleanedScrapedProducts = scrapedProducts.map(product => {
              const cleaned = {};
              Object.keys(product).forEach(key => {
                if (product[key] !== undefined) {
                  cleaned[key] = product[key];
                }
              });
              return cleaned;
            });
            
            const docData = {
              evaluation: aiEvaluation.evaluation,
              scoredProducts,
              scrapedProducts: cleanedScrapedProducts,
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

            storageResult = await storeEvaluation(docData);
            console.log(`Stored with ID: ${storageResult.evaluationId}`);
            console.log(`Auto-retrieving from Firebase for response...`);
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

    if (aiEvaluationResult && aiEvaluationResult.storage && aiEvaluationResult.storage.evaluationId) {
      try {
        const evaluationData = await getEvaluationById(aiEvaluationResult.storage.evaluationId);

        const products = transformToSimplifiedFormat(evaluationData);
        
        res.status(200).json({
          success: true,
          message: "Scraping and AI evaluation completed successfully",
          evaluationId: aiEvaluationResult.storage.evaluationId,
          platform,
          query: productName,
          totalProducts: products.length,
          products,
        });
        return;
      } catch (retrievalError) {
        console.error('Failed to retrieve from Firebase:', retrievalError.message);
      }
    }

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

/**
 * Retrieve evaluation by ID from Firebase
 * GET /api/evaluations/:id
 */
export const getEvaluationByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Evaluation ID is required'
      });
    }

    console.log(`Retrieving evaluation ${id} from Firebase...`);
    const evaluationData = await getEvaluationById(id);

    const products = transformToSimplifiedFormat(evaluationData);

    res.status(200).json({
      success: true,
      message: 'Evaluation retrieved successfully',
      evaluationId: id,
      platform: evaluationData.metadata?.platform,
      query: evaluationData.metadata?.searchQuery,
      totalProducts: products.length,
      products,
    });

  } catch (error) {
    console.error('Error retrieving evaluation:', error.message);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: 'Evaluation not found',
        details: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve evaluation',
      details: error.message
    });
  }
};
