import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import RNFS from 'react-native-fs';
import { useStorage } from '../context/StorageContext';
import MiniPlayer from '../componentes/MiniPlayer';
import FullPlayer from '../componentes/FullPlayer';
import audioService from '../services/audioService';
import firebaseService from '../services/firebase';

const OfflineScreen = () => {
  const [storageFiles, setStorageFiles] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState(new Set());
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showFullPlayer, setShowFullPlayer] = useState(false);
  const { storageLocation } = useStorage();

  useEffect(() => {
    loadStorageFiles();
    loadUploadedFiles();
    
    // Auto-upload check every 5 seconds
    const interval = setInterval(() => {
      checkForNewFiles();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [storageLocation]);

  const loadStorageFiles = async () => {
    try {
      const exists = await RNFS.exists(storageLocation);
      if (exists) {
        const items = await RNFS.readDir(storageLocation);
        const files = items.filter(item => !item.isDirectory());
        setStorageFiles(files);
      }
    } catch (error) {
      console.log('Error loading files:', error);
    }
  };

  const loadUploadedFiles = async () => {
    try {
      const cloudFiles = await firebaseService.listFiles();
      const uploadedNames = new Set(cloudFiles.map(file => file.name));
      setUploadedFiles(uploadedNames);
    } catch (error) {
      console.log('Error loading uploaded files:', error);
    }
  };

  const checkForNewFiles = async () => {
    try {
      const exists = await RNFS.exists(storageLocation);
      if (exists) {
        const items = await RNFS.readDir(storageLocation);
        const files = items.filter(item => !item.isDirectory());
        
        // Get current uploaded files from Firebase
        const cloudFiles = await firebaseService.listFiles();
        const currentUploaded = new Set(cloudFiles.map(file => file.name));
        setUploadedFiles(currentUploaded);
        
        // Check for new files not yet uploaded
        for (const file of files) {
          if (!currentUploaded.has(file.name)) {
            console.log('🔄 Auto-uploading new file:', file.name);
            await uploadFile(file, true);
          }
        }
        
        setStorageFiles(files);
      }
    } catch (error) {
      console.log('Error checking for new files:', error);
    }
  };

  const loadAndPlayTrack = file => {
    audioService.loadTrack(
      file.path,
      trackDuration => {
        setDuration(trackDuration);
        setIsPlaying(true);
        audioService.play(updateProgress);
      },
      updateProgress,
    );
  };

  const updateProgress = (current, total) => {
    setCurrentTime(current);
    if (total) setDuration(total);
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      audioService.pause();
    } else {
      audioService.play(updateProgress);
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = time => {
    audioService.seekTo(time);
    setCurrentTime(time);
  };

  const uploadFile = async (file, isAutoUpload = false) => {
    // Check if already uploaded
    if (uploadedFiles.has(file.name)) {
      console.log('✅ File already uploaded:', file.name);
      return;
    }
    
    try {
      console.log('📱 OfflineScreen: Starting upload for file:', file.name);
      
      const result = await firebaseService.uploadFile(file.path, file.name);
      console.log('📱 OfflineScreen: Upload completed, result:', result);
      
      // Add to uploaded files set
      setUploadedFiles(prev => new Set([...prev, file.name]));
      
      if (!isAutoUpload) {
        Alert.alert('Success', 'File uploaded to cloud');
      }
    } catch (error) {
      console.log('📱 OfflineScreen: Upload error:', error);
      if (!isAutoUpload) {
        Alert.alert('Error', `Upload failed: ${error.message}`);
      }
    }
  };

  useEffect(() => {
    return () => {
      audioService.release();
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Offline Mode</Text>

      <ScrollView style={styles.content}>
        <View style={styles.recordingsList}>
          <Text style={styles.sectionTitle}>
            Recent Recordings ({storageFiles.length})
          </Text>
          {storageFiles.map((file, index) => (
            <View key={index} style={styles.recordingItem}>
              <TouchableOpacity
                style={styles.fileInfo}
                onPress={() => {
                  setCurrentTrack(file);
                  loadAndPlayTrack(file);
                }}
              >
                <Text style={styles.recordingName}>{file.name}</Text>
                <Text style={styles.recordingDate}>
                  {(file.size / 1024).toFixed(1)}KB
                </Text>
              </TouchableOpacity>

              {/* Upload status */}
              {uploadedFiles.has(file.name) ? (
                <View style={styles.uploadedIndicator}>
                  <Text style={styles.uploadedText}>✅</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={() => uploadFile(file)}
                >
                  <Text style={styles.uploadButtonText}>⬆️</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      {currentTrack && (
        <MiniPlayer
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
          currentTime={currentTime}
          duration={duration}
          onSeek={handleSeek}
          onExpand={() => setShowFullPlayer(true)}
        />
      )}

      <FullPlayer
        visible={showFullPlayer}
        onClose={() => setShowFullPlayer(false)}
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onPlayPause={handlePlayPause}
        currentTime={currentTime}
        duration={duration}
        onSeek={handleSeek}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    color: '#333',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },

  recordingsList: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  recordingItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileInfo: {
    flex: 1,
  },
  uploadButton: {
    padding: 8,
    backgroundColor: '#007AFF',
    borderRadius: 6,
  },
  uploadButtonText: {
    fontSize: 16,
  },
  uploadedIndicator: {
    padding: 8,
    backgroundColor: '#4CAF50',
    borderRadius: 6,
  },
  uploadedText: {
    fontSize: 16,
    color: '#fff',
  },
  recordingName: {
    fontSize: 16,
    color: '#333',
    marginBottom: 2,
  },
  recordingDate: {
    fontSize: 12,
    color: '#666',
  },
});

export default OfflineScreen;
