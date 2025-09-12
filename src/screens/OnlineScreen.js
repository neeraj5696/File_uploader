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
import RNFS from 'react-native-fs';
import MiniPlayer from '../componentes/MiniPlayer';
import FullPlayer from '../componentes/FullPlayer';
import audioService from '../services/audioService';

const OnlineScreen = () => {
  const [cloudFiles, setCloudFiles] = useState([]);

  const [loading, setLoading] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showFullPlayer, setShowFullPlayer] = useState(false);
  const { storageLocation } = useStorage();

  useEffect(() => {
    loadCloudFiles();
  }, []);

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
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Online Mode</Text>
      
      <ScrollView style={styles.content}>
        <View style={styles.statusCard}>
          <Text style={styles.statusText}>🟢 Connected</Text>
          <Text style={styles.statusSubtext}>Ready to sync recordings</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Cloud Storage</Text>
          <Text style={styles.cardSubtitle}>Sync and backup your recordings</Text>
        </View>

       
        <TouchableOpacity 
          style={[styles.button, styles.syncButton]}
          onPress={loadCloudFiles}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Loading...' : 'Refresh Cloud Files'}
          </Text>
        </TouchableOpacity>

        <View style={styles.cloudRecordingsList}>
          <Text style={styles.sectionTitle}>Cloud Recordings ({cloudFiles.length})</Text>
          {cloudFiles.map((file, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.recordingItem}
              onPress={() => playCloudFile(file)}
            >
              <Text style={styles.recordingName}>{file.name}</Text>
              <Text style={styles.recordingDate}>
                {(file.size / 1024).toFixed(1)}KB • {new Date(file.timeCreated).toLocaleDateString()}
              </Text>
            </TouchableOpacity>
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
  statusCard: {
    backgroundColor: '#e8f5e8',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d5a2d',
    marginBottom: 5,
  },
  statusSubtext: {
    fontSize: 14,
    color: '#4a7c4a',
  },
  card: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
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
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
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