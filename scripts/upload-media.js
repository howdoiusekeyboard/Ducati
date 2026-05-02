const { initializeApp } = require('firebase/app');
const { getStorage, ref, uploadBytes } = require('firebase/storage');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

async function uploadMediaFiles() {
  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const storage = getStorage(app);

    // Files to upload
    const filesToUpload = [
      { localPath: 'public/icons8-money-96.png', storagePath: 'icons8-money-96.png' },
      { localPath: 'public/og-image.png', storagePath: 'og-image.png' }
    ];

    console.log('Starting media file upload to Firebase Storage...');

    for (const file of filesToUpload) {
      const { localPath, storagePath } = file;
      
      if (!fs.existsSync(localPath)) {
        console.warn(`File not found: ${localPath}`);
        continue;
      }

      console.log(`Uploading ${localPath} to ${storagePath}...`);
      
      const fileBuffer = fs.readFileSync(localPath);
      const storageRef = ref(storage, storagePath);
      
      await uploadBytes(storageRef, fileBuffer);
      console.log(`✓ Successfully uploaded ${storagePath}`);
    }

    console.log('All media files uploaded successfully!');
    console.log('\nNext steps:');
    console.log('1. Deploy storage rules: firebase deploy --only storage');
    console.log('2. Verify files are accessible at:');
    console.log('   - https://denarii-mvp-f5aea.firebasestorage.app/o/icons8-money-96.png?alt=media');
    console.log('   - https://denarii-mvp-f5aea.firebasestorage.app/o/og-image.png?alt=media');
    
  } catch (error) {
    console.error('Error uploading files:', error);
    process.exit(1);
  }
}

uploadMediaFiles();