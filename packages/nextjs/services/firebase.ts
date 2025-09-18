import * as firebaseAdmin from "firebase-admin";

let isFirebaseConfigured = false;

// Initialize Firebase if it hasn't been initialized already
if (!firebaseAdmin.apps.length) {
  try {
    // Check if Firebase service account key is properly configured
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (
      !serviceAccountKey ||
      serviceAccountKey === "placeholder" ||
      serviceAccountKey.includes("<") ||
      serviceAccountKey.includes("your-")
    ) {
      console.warn("Firebase not configured - image upload features will not work");
      isFirebaseConfigured = false;
    } else {
      const serviceAccount = JSON.parse(serviceAccountKey);

      firebaseAdmin.initializeApp({
        credential: firebaseAdmin.credential.cert(serviceAccount as firebaseAdmin.ServiceAccount),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      });

      isFirebaseConfigured = true;
      console.log("Firebase initialized successfully");
    }
  } catch (error) {
    console.error("Firebase initialization error:", error);
    isFirebaseConfigured = false;
  }
}

// Only export storage if Firebase is properly configured
export const storage = isFirebaseConfigured && firebaseAdmin.apps.length > 0 ? firebaseAdmin.storage() : null;
export const bucket = isFirebaseConfigured && storage ? storage.bucket() : null;
