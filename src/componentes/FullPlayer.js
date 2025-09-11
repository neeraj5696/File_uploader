import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Modal, 
  Dimensions 
} from 'react-native';
import Slider from '@react-native-community/slider';

const { width } = Dimensions.get('window');

const FullPlayer = ({ 
  visible, 
  onClose, 
  currentTrack, 
  isPlaying, 
  onPlayPause, 
  currentTime, 
  duration, 
  onSeek 
}) => {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.dragIndicator} />
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.headerIcon}>↓</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Now Playing</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.headerIcon}>×</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.artwork}>
          <View style={styles.artworkPlaceholder}>
            <Text style={styles.musicIcon}>🎧</Text>
          </View>
        </View>

        <View style={styles.trackInfo}>
          <Text style={styles.trackTitle}>{currentTrack?.name || 'Unknown Track'}</Text>
          <Text style={styles.trackArtist}>Audio Recording</Text>
        </View>

        <View style={styles.seekContainer}>
          <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
          <Slider
            style={styles.seekBar}
            minimumValue={0}
            maximumValue={duration}
            value={currentTime}
            onValueChange={onSeek}
            minimumTrackTintColor="#007AFF"
            maximumTrackTintColor="#E0E0E0"
          />
          <Text style={styles.timeText}>{formatTime(duration)}</Text>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity style={styles.controlButton}>
            <Text style={styles.controlIcon}>⏮️</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.playButton} onPress={onPlayPause}>
            <Text style={styles.playIcon}>
              {isPlaying ? '⏸️' : '▶️'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.controlButton}>
            <Text style={styles.controlIcon}>⏭️</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#ccc',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  artwork: {
    alignItems: 'center',
    marginBottom: 40,
  },
  artworkPlaceholder: {
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackInfo: {
    alignItems: 'center',
    marginBottom: 40,
  },
  trackTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  trackArtist: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  seekContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
  },
  seekBar: {
    flex: 1,
    marginHorizontal: 12,
  },
  timeText: {
    fontSize: 14,
    color: '#666',
    minWidth: 40,
    textAlign: 'center',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButton: {
    padding: 12,
    marginHorizontal: 20,
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
  },
  headerIcon: {
    fontSize: 24,
    color: '#333',
  },
  musicIcon: {
    fontSize: 60,
  },
  controlIcon: {
    fontSize: 28,
    color: '#333',
  },
  playIcon: {
    fontSize: 24,
    color: '#fff',
  },
});

export default FullPlayer;