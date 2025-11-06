import admin from "firebase-admin";
import path from "path";
import { fileURLToPath } from "url";
import { readFileSync } from "fs";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccountPath = path.join(__dirname, "service-account.json");
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf8"));

// Initialize Firebase Admin (only once)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id,
  });
}

const db = admin.firestore();

// 🆕 Helper function to get AI evaluations collection
export const getAICollection = () => {
  return db.collection(process.env.FIREBASE_AI_COLLECTION || 'ai-evaluations');
};

// 🆕 Helper function to get other collections
export const getCollection = (collectionName) => {
  return db.collection(collectionName);
};

// Export existing db and admin
export { db, admin };

console.log('✅ Firebase initialized');
console.log(`📊 AI Collection: ${process.env.FIREBASE_AI_COLLECTION || 'ai-evaluations'}`);

