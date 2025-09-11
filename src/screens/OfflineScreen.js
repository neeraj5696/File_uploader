import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import RNFS from 'react-native-fs';
import { useStorage } from '../context/StorageContext';
import MiniPlayer from '../componentes/MiniPlayer';
import FullPlayer from '../componentes/FullPlayer';
import audioService from '../services/audioService';

const OfflineScreen = () => {
  const [storageFiles, setStorageFiles] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showFullPlayer, setShowFullPlayer] = useState(false);
  const { storageLocation } = useStorage();

  useEffect(() => {
    loadStorageFiles();
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

  const loadAndPlayTrack = (file) => {
    audioService.loadTrack(
      file.path,
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

  useEffect(() => {
    return () => {
      audioService.release();
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Offline Mode</Text>

      <ScrollView style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Local Recordings</Text>
          <Text style={styles.cardSubtitle}>Access your offline recordings</Text>
        </View>

        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Start Recording</Text>
        </TouchableOpacity>

        <View style={styles.recordingsList}>
          <Text style={styles.sectionTitle}>Recent Recordings ({storageFiles.length})</Text>
          {storageFiles.map((file, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.recordingItem}
              onPress={() => {
                setCurrentTrack(file);
                loadAndPlayTrack(file);
              }}
            >
              <Text style={styles.recordingName}>{file.name}</Text>
              <Text style={styles.recordingDate}>{(file.size / 1024).toFixed(1)}KB</Text>
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
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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