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
import { useTheme } from '../context/ThemeContext';
import MiniPlayer from '../componentes/MiniPlayer';
import FullPlayer from '../componentes/FullPlayer';
import audioService from '../services/audioService';
import firebaseService from '../services/firebase';
import contactService from '../services/contactService';

const OfflineScreen = () => {
  const { theme } = useTheme();
  const [storageFiles, setStorageFiles] = useState([]);
  const [groupedContacts, setGroupedContacts] = useState([]);
  const [expandedContacts, setExpandedContacts] = useState(new Set());
  const [uploadedFiles, setUploadedFiles] = useState(new Set());
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showFullPlayer, setShowFullPlayer] = useState(false);
  const { storageLocation } = useStorage();

  useEffect(() => {
    initializeContacts();
    loadStorageFiles();
    loadUploadedFiles();
    
    // Auto-upload check every 30 seconds
    const interval = setInterval(() => {
      checkForNewFiles();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [storageLocation]);

  const initializeContacts = async () => {
    await contactService.loadContacts();
  };

  const loadStorageFiles = async () => {
    try {
      const exists = await RNFS.exists(storageLocation);
      if (exists) {
        const items = await RNFS.readDir(storageLocation);
        const files = items.filter(item => !item.isDirectory());
        setStorageFiles(files);
        
        // Group files by contact
        const grouped = contactService.groupFilesByContact(files);
        setGroupedContacts(grouped);
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
        
        // Update grouped contacts
        const grouped = contactService.groupFilesByContact(files);
        setGroupedContacts(grouped);
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
    <View style={[styles.container, { backgroundColor: theme.background }]}>
    

      <ScrollView style={styles.content}>
        <View style={[styles.recordingsList, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Recordings by Contact ({groupedContacts.length} contacts)
          </Text>
          {groupedContacts.map((contact, index) => (
            <View key={index}>
              <TouchableOpacity 
                style={[styles.contactHeader, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}
                onPress={() => {
                  const newExpanded = new Set(expandedContacts);
                  if (expandedContacts.has(contact.phone || 'unknown')) {
                    newExpanded.delete(contact.phone || 'unknown');
                  } else {
                    newExpanded.add(contact.phone || 'unknown');
                  }
                  setExpandedContacts(newExpanded);
                }}
              >
                <View style={styles.contactInfo}>
                  <Text style={[styles.contactName, { color: theme.text }]}>
                    {contact.contactName}
                  </Text>
                  <Text style={[styles.contactPhone, { color: theme.textSecondary }]}>
                    {contact.phone || 'Unknown'} • {contact.files.length} recordings
                  </Text>
                </View>
                <Text style={[styles.expandIcon, { color: theme.textSecondary }]}>
                  {expandedContacts.has(contact.phone || 'unknown') ? '▼' : '▶'}
                </Text>
              </TouchableOpacity>
              
              {expandedContacts.has(contact.phone || 'unknown') && contact.files.map((file, fileIndex) => (
                <View key={fileIndex} style={[styles.recordingItem, { borderBottomColor: theme.border, backgroundColor: theme.surface, marginLeft: 20 }]}>
                  <TouchableOpacity
                    style={[styles.fileInfo, { backgroundColor: theme.surface }]}
                    onPress={() => {
                      setCurrentTrack(file);
                      loadAndPlayTrack(file);
                    }}
                  >
                    <Text style={[styles.recordingName, { color: theme.text }]}>{file.name}</Text>
                    <Text style={[styles.recordingDate, { color: theme.textSecondary }]}>
                      {(file.size / 1024).toFixed(1)}KB
                    </Text>
                  </TouchableOpacity>

                  {/* Upload status */}
                  {uploadedFiles.has(file.name) ? (
                    <View style={styles.uploadedIndicator}>
                      <Text style={styles.uploadedText}>✓</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.uploadButton}
                      onPress={() => uploadFile(file)}
                    >
                      <Text style={styles.uploadButtonText}>↑</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
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
    width: 28,
    height: 28,
    backgroundColor: '#007AFF',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadButtonText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  uploadedIndicator: {
    width: 28,
    height: 28,
    backgroundColor: '#4CAF50',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadedText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  contactPhone: {
    fontSize: 12,
  },
  expandIcon: {
    fontSize: 16,
    marginLeft: 10,
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
