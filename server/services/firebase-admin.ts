import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

// Initialize Firebase Admin SDK
let app;
if (getApps().length === 0) {
  // In production, use service account key
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    app = initializeApp({
      credential: cert(serviceAccount),
      projectId: process.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: `${process.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
    });
  } else {
    // For development with Firebase Emulator
    app = initializeApp({
      projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'demo-project',
    });
  }
} else {
  app = getApps()[0];
}

export const adminAuth = getAuth(app);
export const adminDb = getFirestore(app);
export const adminStorage = getStorage(app);

// Validate Firebase ID token
export async function validateFirebaseToken(idToken: string) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying Firebase token:', error);
    throw new Error('Invalid token');
  }
}

// Set custom user claims (roles)
export async function setUserRole(uid: string, role: 'seeker' | 'employer' | 'admin') {
  try {
    await adminAuth.setCustomUserClaims(uid, { role });
  } catch (error) {
    console.error('Error setting user role:', error);
    throw new Error('Failed to set user role');
  }
}

// Create user profile in Firestore
export async function createUserProfile(uid: string, data: {
  displayName: string;
  email: string;
  role: 'seeker' | 'employer' | 'admin';
  emailVerified: boolean;
}) {
  try {
    const userRef = adminDb.collection('users').doc(uid);
    await userRef.set({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw new Error('Failed to create user profile');
  }
}

// Update user profile
export async function updateUserProfile(uid: string, data: any) {
  try {
    const userRef = adminDb.collection('users').doc(uid);
    await userRef.update({
      ...data,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw new Error('Failed to update user profile');
  }
}

// Get user profile
export async function getUserProfile(uid: string) {
  try {
    const userRef = adminDb.collection('users').doc(uid);
    const doc = await userRef.get();
    
    if (!doc.exists) {
      return null;
    }
    
    return {
      id: uid,
      ...doc.data(),
    };
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw new Error('Failed to get user profile');
  }
}

// Delete user and all associated data
export async function deleteUser(uid: string) {
  try {
    const batch = adminDb.batch();
    
    // Delete user profile
    const userRef = adminDb.collection('users').doc(uid);
    batch.delete(userRef);
    
    // Delete user's applications
    const applicationsSnapshot = await adminDb
      .collection('applications')
      .where('applicantUid', '==', uid)
      .get();
      
    applicationsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // Delete user's companies (if employer)
    const companiesSnapshot = await adminDb
      .collection('companies')
      .where('ownerUid', '==', uid)
      .get();
      
    companiesSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // Delete user's jobs
    const jobsSnapshot = await adminDb
      .collection('jobs')
      .where('posterUid', '==', uid)
      .get();
      
    jobsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    
    // Delete from Auth
    await adminAuth.deleteUser(uid);
    
  } catch (error) {
    console.error('Error deleting user:', error);
    throw new Error('Failed to delete user');
  }
}

// Generate signed URL for file access
export async function generateSignedUrl(filePath: string, expiresIn: number = 3600) {
  try {
    const bucket = adminStorage.bucket();
    const file = bucket.file(filePath);
    
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + expiresIn * 1000,
    });
    
    return url;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    throw new Error('Failed to generate signed URL');
  }
}
