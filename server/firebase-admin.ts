import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Initialize Firebase Admin
const projectId = process.env.FIREBASE_PROJECT_ID || 'keep02alive';
const serviceAccountPath = join(process.cwd(), 'serviceAccount.json');

if (!admin.apps.length) {
  try {
    if (existsSync(serviceAccountPath)) {
      console.log('Initializing Firebase Admin with serviceAccount.json...');
      const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: projectId
      });
    } else {
      console.log(`Initializing Firebase Admin for project: ${projectId} (using default credentials)...`);
      admin.initializeApp({
        projectId: projectId
      });
    }
  } catch (err) {
    console.error('Firebase Admin Init Error:', err);
  }
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
export default admin;
