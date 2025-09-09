import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

const OnlineScreen = () => {
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

       
        <TouchableOpacity style={[styles.button, styles.syncButton]}>
          <Text style={styles.buttonText}>Sync All Recordings</Text>
        </TouchableOpacity>

        <View style={styles.cloudRecordingsList}>
          <Text style={styles.sectionTitle}>Cloud Recordings</Text>
          
          
        </View>
      </ScrollView>
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