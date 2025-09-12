import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import firebaseService from '../services/firebase';
import { useStorage } from '../context/StorageContext';
import { useTheme } from '../context/ThemeContext';
import RNFS from 'react-native-fs';
import MiniPlayer from '../componentes/MiniPlayer';
import FullPlayer from '../componentes/FullPlayer';
import audioService from '../services/audioService';

const OnlineScreen = () => {
  const { theme } = useTheme();
  const [cloudFiles, setCloudFiles] = useState([]);
  const [localFiles, setLocalFiles] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showFullPlayer, setShowFullPlayer] = useState(false);
  const { storageLocation } = useStorage();

  useEffect(() => {
    loadCloudFiles();
    checkLocalFiles();
  }, []);

  const checkLocalFiles = async () => {
    try {
      const exists = await RNFS.exists(storageLocation);
      if (exists) {
        const items = await RNFS.readDir(storageLocation);
        const fileNames = new Set(items.map(item => item.name));
        setLocalFiles(fileNames);
      }
    } catch (error) {
      console.log('Error checking local files:', error);
    }
  };

  const loadCloudFiles = async () => {
    console.log('🌐 OnlineScreen: Starting to load cloud files...');
    setLoading(true);
    try {
      const files = await firebaseService.listFiles();
      console.log('🌐 OnlineScreen: Received files from Firebase:', files);
      setCloudFiles(files);
      console.log('🌐 OnlineScreen: Cloud files state updated, count:', files.length);
    } catch (error) {
      console.log('🌐 OnlineScreen: Error loading cloud files:', error);
      Alert.alert('Error', 'Failed to load cloud files');
    }
    setLoading(false);
  };





  const playCloudFile = async (file) => {
    setCurrentTrack({ ...file, isCloud: true });
    audioService.loadTrack(
      file.url,
      (trackDuration) => {
        setDuration(trackDuration);
        setIsPlaying(true);
        audioService.play(updateProgress);
      },
      updateProgress
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

  const handleSeek = (time) => {
    audioService.seekTo(time);
    setCurrentTime(time);
  };

  const downloadFile = async (file) => {
    try {
      const localPath = `${storageLocation}/${file.name}`;
      
      // Check if file already exists
      const exists = await RNFS.exists(localPath);
      if (exists) {
        Alert.alert('Info', 'File already exists in local storage');
        return;
      }
      
      Alert.alert('Download', 'Downloading file to local storage...');
      
      await RNFS.downloadFile({
        fromUrl: file.url,
        toFile: localPath,
      }).promise;
      
      Alert.alert('Success', `File downloaded to: ${localPath}`);
      
      // Update local files list
      setLocalFiles(prev => new Set([...prev, file.name]));
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Error', `Download failed: ${error.message}`);
    }
  };
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      
      
      <ScrollView style={styles.content}>
      
       
        <TouchableOpacity 
          style={[styles.button, styles.syncButton]}
          onPress={loadCloudFiles}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Loading...' : 'Refresh Cloud Files'}
          </Text>
        </TouchableOpacity>

        <View style={[styles.cloudRecordingsList, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Cloud Recordings ({cloudFiles.length})</Text>
          {cloudFiles.map((file, index) => (
            <View key={index} style={[styles.recordingItem, { borderBottomColor: theme.border }]}>
              <TouchableOpacity 
                style={styles.fileInfo}
                onPress={() => playCloudFile(file)}
              >
                <Text style={[styles.recordingName, { color: theme.text }]}>{file.name}</Text>
                <Text style={[styles.recordingDate, { color: theme.textSecondary }]}>
                  {(file.size / 1024).toFixed(1)}KB • {new Date(file.timeCreated).toLocaleDateString()}
                </Text>
              </TouchableOpacity>
              
              {localFiles.has(file.name) ? (
                <View style={styles.downloadedIndicator}>
                  <Text style={styles.downloadedText}>✓</Text>
                </View>
              ) : (
                <TouchableOpacity 
                  style={styles.downloadButton}
                  onPress={() => downloadFile(file)}
                >
                  <Text style={styles.downloadButtonText}>↓</Text>
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
    paddingTop: 50,
  },
 

 
  statusText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d5a2d',
    marginBottom: 5,
  },
 
 
 

  
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 15,
  },
  syncButton: {
    backgroundColor: '#34C759',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cloudRecordingsList: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },

  recordingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  fileInfo: {
    flex: 1,
  },
  downloadButton: {
    width: 28,
    height: 28,
    backgroundColor: '#007AFF',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  downloadButtonText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  downloadedIndicator: {
    width: 28,
    height: 28,
    backgroundColor: '#4CAF50',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  downloadedText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
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

export default OnlineScreen;