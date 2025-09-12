import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  RefreshControl,
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

  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return hrs > 0 ? `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}` : `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  const [storageFiles, setStorageFiles] = useState([]);
  const [groupedContacts, setGroupedContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [expandedContacts, setExpandedContacts] = useState(new Set());
  const [selectedContact, setSelectedContact] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedDay, setSelectedDay] = useState('');
  const [filterDuration, setFilterDuration] = useState('');
  const [showContactDropdown, setShowContactDropdown] = useState(false);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showDayDropdown, setShowDayDropdown] = useState(false);
  const [allContacts, setAllContacts] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState(new Set());
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showFullPlayer, setShowFullPlayer] = useState(false);
  const [loading, setLoading] = useState(false);
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
    setTimeout(() => {
      const phoneContacts = contactService.contacts.map(c => c.displayName || c.givenName).filter(Boolean);
      setAllContacts([...new Set(phoneContacts)]);
    }, 100);
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
        setFilteredContacts(grouped);
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
        setFilteredContacts(grouped);
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

  useEffect(() => {
    let filtered = [...groupedContacts];
    
    if (selectedContact) {
      filtered = filtered.filter(contact => 
        contact.contactName === selectedContact
      );
    }
    
    if (selectedMonth) {
      filtered = filtered.map(contact => ({
        ...contact,
        files: contact.files.filter(file => {
          const fileDate = new Date(file.mtime);
          return fileDate.getMonth() + 1 === parseInt(selectedMonth);
        })
      })).filter(contact => contact.files.length > 0);
    }
    
    if (selectedDay) {
      filtered = filtered.map(contact => ({
        ...contact,
        files: contact.files.filter(file => {
          const fileDate = new Date(file.mtime);
          return fileDate.getDate() === parseInt(selectedDay);
        })
      })).filter(contact => contact.files.length > 0);
    }
    
    if (filterDuration) {
      const minDuration = parseInt(filterDuration) || 0;
      filtered = filtered.map(contact => ({
        ...contact,
        files: contact.files.filter(file => 
          Math.floor(file.size / 8000) >= minDuration
        )
      })).filter(contact => contact.files.length > 0);
    }
    
    setFilteredContacts(filtered);
  }, [groupedContacts, selectedContact, selectedMonth, selectedDay, filterDuration]);

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
    

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => {
              setLoading(true);
              loadStorageFiles();
              loadUploadedFiles();
              setTimeout(() => setLoading(false), 1000);
            }}
            colors={['#007AFF', '#34C759', '#FF3B30']}
            tintColor="#007AFF"
            title="Pull to refresh"
            titleColor="#007AFF"
          />
        }
      >
        <View style={[styles.filterContainer, { backgroundColor: theme.surface }]}>
          <View style={styles.filterRow}>
            <TouchableOpacity 
              style={[styles.filterInput, styles.filterInputRow, { 
                color: theme.text, 
                borderColor: showContactDropdown ? '#007AFF' : theme.border,
                borderWidth: showContactDropdown ? 2 : 1,
                justifyContent: 'center' 
              }]}
              onPress={() => {
                setShowContactDropdown(!showContactDropdown);
                setShowDayDropdown(false);
              }}
            >
              <Text style={[{ color: selectedContact ? theme.text : theme.textSecondary }]}>
                {selectedContact || 'Contact'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.filterInput, styles.filterInputRow, { 
                borderColor: showDayDropdown ? '#007AFF' : theme.border,
                borderWidth: showDayDropdown ? 2 : 1,
                justifyContent: 'center' 
              }]}
              onPress={() => {
                setShowDayDropdown(!showDayDropdown);
                setShowContactDropdown(false);
              }}
            >
              <Text style={[{ color: (selectedMonth || selectedDay) ? theme.text : theme.textSecondary }]}>
                {selectedMonth && selectedDay ? `${new Date(2024, parseInt(selectedMonth) - 1).toLocaleString('default', { month: 'short' })} ${selectedDay}` : 'Date'}
              </Text>
            </TouchableOpacity>
            
            <TextInput
              style={[styles.filterInput, styles.filterInputRow, { color: theme.text, borderColor: theme.border }]}
              placeholder="Duration (s)"
              placeholderTextColor={theme.textSecondary}
              value={filterDuration}
              onChangeText={setFilterDuration}
              onFocus={() => {
                setShowContactDropdown(false);
                setShowDayDropdown(false);
              }}
              keyboardType="numeric"
            />
          </View>
          
          {showContactDropdown && (
            <View style={[styles.dropdown, styles.contactDropdown]}>
              <ScrollView style={styles.dropdownScroll} nestedScrollEnabled={true} removeClippedSubviews={true}>
                <TouchableOpacity 
                  style={styles.dropdownItem}
                  onPress={() => {
                    setSelectedContact('');
                    setShowContactDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownText}>All Contacts</Text>
                </TouchableOpacity>
                {allContacts.slice(0, 50).map((contact, index) => (
                  <TouchableOpacity 
                    key={contact}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setSelectedContact(contact);
                      setShowContactDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownText}>{contact}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
          
          {showDayDropdown && (
            <View style={[styles.dropdown, styles.dateDropdown, { top: 60 }]}>
              <View style={styles.dateHeader}>
                <TouchableOpacity 
                  style={styles.clearDateButton}
                  onPress={() => {
                    setSelectedMonth('');
                    setSelectedDay('');
                    setShowDayDropdown(false);
                  }}
                >
                  <Text style={styles.clearDateText}>Clear Date</Text>
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.dateScroll} nestedScrollEnabled={true}>
                <View style={styles.monthGrid}>
                  {Array.from({length: 12}, (_, i) => i + 1).map(month => (
                    <TouchableOpacity 
                      key={month}
                      style={[styles.monthItem, selectedMonth === month.toString() && styles.selectedItem]}
                      onPress={() => setSelectedMonth(month.toString())}
                    >
                      <Text style={[styles.monthText, selectedMonth === month.toString() && styles.selectedText]}>
                        {new Date(2024, month - 1).toLocaleString('default', { month: 'short' })}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                
                <View style={styles.dayGrid}>
                  {Array.from({length: 31}, (_, i) => i + 1).map(day => (
                    <TouchableOpacity 
                      key={day}
                      style={[styles.dayItem, selectedDay === day.toString() && styles.selectedItem]}
                      onPress={() => {
                        setSelectedDay(day.toString());
                        setShowDayDropdown(false);
                      }}
                    >
                      <Text style={[styles.dayText, selectedDay === day.toString() && styles.selectedText]}>
                        {day}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}
        </View>
        
        <View style={[styles.recordingsList, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Recordings ({filteredContacts.length})
          </Text>
          {filteredContacts.map((contact, index) => (
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
                      {(file.size / 1024).toFixed(1)}KB • {new Date(file.mtime).toLocaleDateString()} • {formatDuration(Math.floor(file.size / 8000))}
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
  filterContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    fontSize: 14,
  },
  filterInputRow: {
    flex: 1,
    marginHorizontal: 3,
    marginBottom: 0,
  },
  filterButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  dropdown: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 8,
    zIndex: 1000,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  contactDropdown: {
    maxHeight: 200,
  },
  dateDropdown: {
    maxHeight: 300,
  },
  dropdownScroll: {
    maxHeight: 180,
  },
  dateScroll: {
    maxHeight: 250,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dropdownText: {
    fontSize: 14,
  },
  monthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  monthButton: {
    backgroundColor: '#007AFF',
    padding: 8,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  monthButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  monthText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  clearButton: {
    backgroundColor: '#FF3B30',
    padding: 8,
    borderRadius: 5,
    marginLeft: 5,
  },
  dateHeader: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  clearDateButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  clearDateText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
  },
  monthItem: {
    width: '25%',
    padding: 8,
    alignItems: 'center',
    borderRadius: 5,
    margin: 2,
  },
  monthText: {
    fontSize: 12,
    color: '#333',
  },
  dayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
  },
  dayItem: {
    width: '14.28%',
    padding: 8,
    alignItems: 'center',
    borderRadius: 5,
    margin: 1,
  },
  dayText: {
    fontSize: 14,
    color: '#333',
  },
  selectedItem: {
    backgroundColor: '#007AFF',
  },
  selectedText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  dropdownText: {
    fontSize: 14,
    color: '#333',
  },
});

export default OfflineScreen;
