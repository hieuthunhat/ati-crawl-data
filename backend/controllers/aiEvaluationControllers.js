import geminiService from '../services/geminiService.js';
import scoringService from '../services/productScoringService.js';
import { getAICollection, admin } from '../config/firebase-db.js';
import aiConfig from '../config/ai-config.js';

/**
 * POST /api/ai/evaluate
 */
export const evaluateProducts = async (req, res) => {
  try {
    const { 
      products,
      criteria = {},
      storeResults = true,
      userId,
      sessionId,
    } = req.body;

    // Validation
    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Products array is required and must not be empty',
      });
    }

    console.log(`\nEvaluating ${products.length} products...`);

    // Mathematical scoring
    console.log('Step 1/3: Mathematical scoring...');
    const scoredProducts = scoringService.scoreProducts(products, criteria);
    console.log(`${scoredProducts.length} products passed initial screening`);

    if (scoredProducts.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No products met the quality thresholds',
        scoredProducts: [],
        aiEvaluation: null,
      });
    }

    //AI evaluation (20 products)
    console.log('Step 2/3: AI evaluation...');
    const topProducts = scoredProducts.slice(0, 20);
    const aiEvaluation = await geminiService.evaluateProducts(
      topProducts.map(sp => {
        const original = products.find(p => p.id === sp.productId);
        return original;
      }),
      criteria
    );

    //Storing data
    let storageResult = null;
    if (storeResults) {
      console.log('Step 3/3: Storing results...');
      
      const collection = getAICollection();
      const docData = {
        evaluation: aiEvaluation.evaluation,
        scoredProducts,
        metadata: {
          ...aiEvaluation.metadata,
          userId: userId || 'anonymous',
          sessionId: sessionId || `session-${Date.now()}`,
          totalProducts: products.length,
          qualifiedProducts: scoredProducts.length,
          criteria,
          storedAt: admin.firestore.FieldValue.serverTimestamp(),
          source: 'backend-ai',
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

    console.log('Evaluation complete!\n');

    return res.status(200).json({
      success: true,
      scoredProducts,
      aiEvaluation: aiEvaluation.evaluation,
      metadata: aiEvaluation.metadata,
      storage: storageResult,
    });

  } catch (error) {
    console.error('Evaluation error:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message,
      details: error.stack,
    });
  }
};

/**
 * GET /api/ai/evaluations
 */
export const getEvaluations = async (req, res) => {
  try {
    const { limit = 20, userId } = req.query;
    
    const collection = getAICollection();
    let query = collection.orderBy('metadata.storedAt', 'desc').limit(parseInt(limit));

    if (userId) {
      query = query.where('metadata.userId', '==', userId);
    }

    const snapshot = await query.get();

    const evaluations = [];
    snapshot.forEach(doc => {
      evaluations.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return res.status(200).json({
      success: true,
      evaluations,
      total: evaluations.length,
    });

  } catch (error) {
    console.error('Get evaluations error:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * GET /api/ai/evaluations/:id
 */
export const getEvaluation = async (req, res) => {
  try {
    const { id } = req.params;
    
    const collection = getAICollection();
    const doc = await collection.doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Evaluation not found',
      });
    }

    return res.status(200).json({
      success: true,
      id: doc.id,
      data: doc.data(),
    });

  } catch (error) {
    console.error('Get evaluation error:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * DELETE /api/ai/evaluations/:id
 */
export const deleteEvaluation = async (req, res) => {
  try {
    const { id } = req.params;
    
    const collection = getAICollection();
    await collection.doc(id).delete();

    console.log(`Deleted evaluation: ${id}`);

    return res.status(200).json({
      success: true,
      deleted: id,
    });

  } catch (error) {
    console.error('Delete evaluation error:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * GET /api/ai/config
 */
export const getConfig = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      config: {
        weights: aiConfig.defaultWeights,
        thresholds: aiConfig.defaultThresholds,
        priceTiers: aiConfig.priceTiers,
        geminiAvailable: geminiService.isGeminiAvailable(),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export default {
  evaluateProducts,
  getEvaluations,
  getEvaluation,
  deleteEvaluation,
  getConfig,
};
