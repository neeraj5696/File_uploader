import storage from '@react-native-firebase/storage';

class FirebaseService {
  constructor() {
    // Initialize storage instance
  }

  // List all files from Firebase Storage
  async listFiles() {
    try {
      console.log('🔍 Starting to list files from Firebase Storage...');
      const result = await storage().ref('recordings').listAll();
      console.log('📁 Found items count:', result.items.length);
      
      if (result.items.length === 0) {
        console.log('📂 No files found in recordings folder');
        return [];
      }
      
      console.log('📋 Processing each file...');
      const files = await Promise.all(
        result.items.map(async (item, index) => {
          console.log(`📄 Processing file ${index + 1}: ${item.name}`);
          const url = await item.getDownloadURL();
          const metadata = await item.getMetadata();
          console.log(`✅ File ${index + 1} processed: ${item.name}`);
          return {
            name: item.name,
            url: url,
            size: metadata.size,
            timeCreated: metadata.timeCreated,
            fullPath: item.fullPath,
          };
        })
      );
      console.log('🎉 Successfully listed all files:', files.length);
      return files;
    } catch (error) {
      console.error('❌ Error listing files:', error);
      return [];
    }
  }

  // Upload file to Firebase Storage
  async uploadFile(filePath, fileName) {
    try {
      console.log('🚀 Starting upload...');
      console.log('📂 File path:', filePath);
      console.log('📝 File name:', fileName);
      
      // Check if file exists locally first
      const RNFS = require('react-native-fs');
      const exists = await RNFS.exists(filePath);
      console.log('📂 File exists locally?', exists);
      
      if (!exists) {
        throw new Error(`File does not exist at: ${filePath}`);
      }
      
      // Create storage reference
      const reference = storage().ref(`recordings/${fileName}`);
      console.log('🎯 Firebase reference:', `recordings/${fileName}`);
      
      // Ensure file:// prefix for local file
      const fileUri = filePath.startsWith('file://') ? filePath : `file://${filePath}`;
      console.log('🔗 File URI:', fileUri);
      
      // Upload file
      const task = reference.putFile(fileUri);
      
      task.on('state_changed', (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log('📊 Progress:', progress.toFixed(1) + '%');
      });
      
      await task;
      console.log('✅ Upload completed!');
      
      const downloadURL = await reference.getDownloadURL();
      console.log('🎉 Success! URL:', downloadURL);
      return downloadURL;
    } catch (error) {
      console.error('❌ Upload failed:', error.message);
      throw error;
    }
  }

  // Delete file from Firebase Storage
  async deleteFile(fullPath) {
    try {
      await storage().ref(fullPath).delete();
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }
}

export default new FirebaseService();