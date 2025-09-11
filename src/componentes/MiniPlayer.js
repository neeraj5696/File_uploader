import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import Icon from 'react-native-vector-icons/MaterialIcons';

const MiniPlayer = ({ 
  currentTrack, 
  isPlaying, 
  onPlayPause, 
  currentTime = 0, 
  duration = 100, 
  onSeek,
  onExpand 
}) => {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.playerContent} onPress={onExpand}>
        <View style={styles.trackInfo}>
          <Text style={styles.trackName} numberOfLines={1}>
            {currentTrack?.name || 'No track selected'}
          </Text>
          <Text style={styles.trackDuration}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </Text>
        </View>
        
        <TouchableOpacity style={styles.playButton} onPress={onPlayPause}>
          <Icon 
            name={isPlaying ? 'pause' : 'play-arrow'} 
            size={24} 
            color="#fff" 
          />
        </TouchableOpacity>
      </TouchableOpacity>
      
      <Slider
        style={styles.seekBar}
        minimumValue={0}
        maximumValue={duration}
        value={currentTime}
        onValueChange={onSeek}
        minimumTrackTintColor="#007AFF"
        maximumTrackTintColor="#E0E0E0"
        thumbStyle={styles.thumb}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  playerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  trackInfo: {
    flex: 1,
    marginRight: 12,
  },
  trackName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  trackDuration: {
    fontSize: 12,
    color: '#666',
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  seekBar: {
    height: 20,
    marginHorizontal: -6,
  },
  thumb: {
    width: 16,
    height: 16,
    backgroundColor: '#007AFF',
  },
});

export default MiniPlayer;