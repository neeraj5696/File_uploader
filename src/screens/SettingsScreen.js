import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  TextInput,
  FlatList,
  NativeModules,
} from 'react-native';
import RNFS from 'react-native-fs';

const { PermissionModule } = NativeModules;

const SettingsScreen = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [storageLocation, setStorageLocation] = useState('/storage/emulated/0/Recordings');
  const [modalVisible, setModalVisible] = useState(false);
  const [currentPath, setCurrentPath] = useState('/storage/emulated/0');
  const [folders, setFolders] = useState([]);
  const [customPath, setCustomPath] = useState('');
  const [detectedFiles, setDetectedFiles] = useState([]);
  const [allFiles, setAllFiles] = useState([]);
  const [showFileList, setShowFileList] = useState(false);

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    try {
      const storageResult = await PermissionModule.requestStoragePermission();
      console.log('Storage permission result:', storageResult);
      
      if (storageResult === 'granted') {
        detectFiles(storageLocation);
        Alert.alert('Success', 'Full storage access granted');
      } else if (storageResult === 'requested') {
        Alert.alert(
          'Permission Required',
          'Please enable "All files access" for this app in the settings that just opened',
          [
            { text: 'OK', onPress: () => {
              setTimeout(async () => {
                const isGranted = await PermissionModule.checkStoragePermission();
                if (isGranted) {
                  detectFiles(storageLocation);
                  Alert.alert('Success', 'Full storage access enabled');
                }
              }, 2000);
            }}
          ]
        );
      }
      
      const phoneResult = await PermissionModule.requestPhonePermission();
      if (phoneResult !== 'granted') {
        Alert.alert('Phone Permission', 'Phone permission needed for call recording');
      }
    } catch (error) {
      console.log('Permission error:', error);
      Alert.alert('Error', `Permission error: ${error.message}`);
    }
  };

  const loadFolders = async (path) => {
    try {
      const items = await RNFS.readDir(path);
      const folderItems = items.filter(item => item.isDirectory());
      setFolders(folderItems);
      setCurrentPath(path);
    } catch (error) {
      Alert.alert('Error', 'Cannot access this folder');
    }
  };

  const selectStorageFolder = () => {
    setCustomPath(storageLocation);
    loadFolders('/storage/emulated/0');
    setModalVisible(true);
  };

  const detectFiles = async (folderPath) => {
    try {
      console.log('Checking folder:', folderPath);
      const exists = await RNFS.exists(folderPath);
      if (!exists) {
        console.log('Folder does not exist');
        setDetectedFiles([]);
        return [];
      }
      
      const items = await RNFS.readDir(folderPath);
      console.log('Total items found:', items.length);
      
      const allFiles = items.filter(item => !item.isDirectory());
      console.log('All files:', allFiles.map(f => f.name));
      
      const audioFiles = allFiles.filter(item => {
        const name = item.name.toLowerCase();
        return name.endsWith('.mp3') || 
               name.endsWith('.wav') || 
               name.endsWith('.m4a') || 
               name.endsWith('.aac') ||
               name.endsWith('.3gp') ||
               name.endsWith('.amr');
      });
      
      console.log('Audio files found:', audioFiles.length);
      setDetectedFiles(audioFiles);
      setAllFiles(allFiles);
      return audioFiles;
    } catch (error) {
      console.log('Error detecting files:', error.message);
      Alert.alert('Error', `Cannot read folder: ${error.message}`);
      setDetectedFiles([]);
      return [];
    }
  };

  const selectFolder = async (folderPath) => {
    setStorageLocation(folderPath);
    const files = await detectFiles(folderPath);
    setModalVisible(false);
    Alert.alert(
      'Success', 
      `Storage location updated\nFound ${files.length} audio files`
    );
  };

  const refreshFiles = () => {
    detectFiles(storageLocation);
  };

  const navigateToFolder = (folder) => {
    loadFolders(folder.path);
  };

  const goBack = () => {
    const parentPath = currentPath.substring(0, currentPath.lastIndexOf('/'));
    if (parentPath) {
      loadFolders(parentPath);
    }
  };

  const useCustomPath = () => {
    if (customPath.trim()) {
      setStorageLocation(customPath.trim());
      setModalVisible(false);
      Alert.alert('Success', 'Custom path set successfully');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      
      <ScrollView style={styles.content}>
        {/* User Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            <View style={styles.profileImage}>
              <Text style={styles.profileInitial}>JD</Text>
            </View>
          </View>
          <Text style={styles.userName}>John Doe</Text>
          <Text style={styles.userEmail}>john.doe@example.com</Text>
          <TouchableOpacity style={styles.editProfileButton}>
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* App Settings */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>App Settings</Text>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Dark Mode</Text>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={darkMode ? '#f5dd4b' : '#f4f3f4'}
            />
          </View>
          
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingLabel}>Notifications</Text>
            <Text style={styles.settingValue}>Enabled</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingLabel}>Audio Quality</Text>
            <Text style={styles.settingValue}>High</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingLabel}>Auto Sync</Text>
            <Text style={styles.settingValue}>WiFi Only</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem} onPress={selectStorageFolder}>
            <View style={styles.storageSettingContent}>
              <Text style={styles.settingLabel}>Storage Location</Text>
              <Text style={styles.storageLocationText} numberOfLines={1}>{storageLocation}</Text>
              <Text style={styles.changeText}>Click here to change</Text>
              <Text style={styles.filesCountText}>
                {detectedFiles.length} audio files detected
              </Text>
              <TouchableOpacity onPress={refreshFiles}>
                <Text style={styles.refreshText}>Tap to refresh</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={requestPermissions}>
                <Text style={styles.permissionText}>Request permissions</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowFileList(!showFileList)}>
                <Text style={styles.permissionText}>Show all files ({allFiles.length})</Text>
              </TouchableOpacity>
              {showFileList && (
                <View style={styles.fileListContainer}>
                  {allFiles.map((file, index) => (
                    <Text key={index} style={styles.fileItem}>
                      📄 {file.name} ({(file.size / 1024).toFixed(1)}KB)
                    </Text>
                  ))}
                </View>
              )}
            </View>
          </TouchableOpacity>

           
        </View>

        {/* Account Settings */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingLabel}>Change Password</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingLabel}>Privacy Settings</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingLabel}>Storage Management</Text>
          </TouchableOpacity>
        </View>

        {/* Support */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingLabel}>Help & FAQ</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingLabel}>Contact Support</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingLabel}>About</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Folder</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.currentPathText}>{currentPath}</Text>
          
          <View style={styles.navigationButtons}>
            <TouchableOpacity style={styles.navButton} onPress={goBack}>
              <Text style={styles.navButtonText}>← Back</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navButton} onPress={() => selectFolder(currentPath)}>
              <Text style={styles.navButtonText}>Select This Folder</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={folders}
            keyExtractor={(item) => item.path}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.folderItem} 
                onPress={() => navigateToFolder(item)}
              >
                <Text style={styles.folderName}>📁 {item.name}</Text>
              </TouchableOpacity>
            )}
          />

          <View style={styles.customPathSection}>
            <Text style={styles.customPathLabel}>Or enter custom path:</Text>
            <TextInput
              style={styles.customPathInput}
              value={customPath}
              onChangeText={setCustomPath}
              placeholder="/storage/emulated/0/YourFolder"
            />
            <TouchableOpacity style={styles.useCustomButton} onPress={useCustomPath}>
              <Text style={styles.useCustomButtonText}>Use This Path</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  profileSection: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileImageContainer: {
    marginBottom: 15,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  editProfileButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  editProfileText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  settingsSection: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
  },
  settingValue: {
    fontSize: 14,
    color: '#666',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 20,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  storageSettingContent: {
    flex: 1,
  },
  storageLocationText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  changeText: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    fontSize: 20,
    color: '#666',
  },
  currentPathText: {
    padding: 15,
    backgroundColor: '#f5f5f5',
    fontSize: 12,
    color: '#666',
  },
  navigationButtons: {
    flexDirection: 'row',
    padding: 10,
  },
  navButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  navButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  folderItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  folderName: {
    fontSize: 16,
  },
  customPathSection: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  customPathLabel: {
    fontSize: 14,
    marginBottom: 10,
    color: '#333',
  },
  customPathInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    fontSize: 14,
  },
  useCustomButton: {
    backgroundColor: '#34C759',
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
  },
  useCustomButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  filesCountText: {
    fontSize: 11,
    color: '#34C759',
    marginTop: 2,
  },
  refreshText: {
    fontSize: 10,
    color: '#007AFF',
    marginTop: 2,
  },
  permissionText: {
    fontSize: 10,
    color: '#FF3B30',
    marginTop: 2,
  },
  fileListContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
    padding: 10,
    marginTop: 5,
    maxHeight: 200,
  },
  fileItem: {
    fontSize: 10,
    color: '#333',
    paddingVertical: 2,
  },
});

export default SettingsScreen;