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

const OfflineScreen = () => {
  const [storageFiles, setStorageFiles] = useState([]);
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
            <View key={index} style={styles.recordingItem}>
              <Text style={styles.recordingName}>{file.name}</Text>
              <Text style={styles.recordingDate}>{(file.size / 1024).toFixed(1)}KB</Text>
            </View>
          ))}
        </View>
      </ScrollView>
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