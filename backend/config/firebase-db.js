import admin from "firebase-admin";
import path from "path";
import { fileURLToPath } from "url";
import { readFileSync } from "fs";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccountPath = path.join(__dirname, "firebase-service-account.json");
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf8"));

// Initialize Firebase Admin (only once)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id,
  });
}

const db = admin.firestore();

// Helper function to get AI evaluations collection
export const getAICollection = () => {
  return db.collection(process.env.FIREBASE_AI_COLLECTION || 'ai-evaluations');
};

// Helper function to get other collections
export const getCollection = (collectionName) => {
  return db.collection(collectionName);
};

/**
 * Retrieve evaluation data by ID
 * @param {string} evaluationId - The document ID in Firebase
 * @returns {Promise<Object>} The evaluation data including evaluated products
 */
export const getEvaluationById = async (evaluationId) => {
  try {
    const collection = getAICollection();
    const docRef = collection.doc(evaluationId);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      throw new Error(`Evaluation with ID ${evaluationId} not found`);
    }
    
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      retrievedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error retrieving evaluation:', error.message);
    throw error;
  }
};

/**
 * Store evaluation results in Firebase
 * @param {Object} evaluationData - The data to store
 * @returns {Promise<Object>} Storage result with document ID
 */
export const storeEvaluation = async (evaluationData) => {
  try {
    const collection = getAICollection();
    const docRef = await collection.add(evaluationData);
    
    return {
      success: true,
      evaluationId: docRef.id,
      collection: process.env.FIREBASE_AI_COLLECTION || 'ai-evaluations',
      storedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error storing evaluation:', error.message);
    throw error;
  }
};

// Export existing db and admin
export { db, admin };

console.log('Firebase initialized');
console.log(`AI Collection: ${process.env.FIREBASE_AI_COLLECTION || 'ai-evaluations'}`);

