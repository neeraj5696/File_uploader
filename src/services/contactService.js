import { PermissionsAndroid, Platform } from 'react-native';
import Contacts from 'react-native-contacts';

class ContactService {
  constructor() {
    this.contacts = [];
    this.contactMap = new Map();
  }

  async requestContactPermission() {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
        {
          title: 'Contacts Permission',
          message: 'This app needs access to your contacts to identify callers',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  }

  async loadContacts() {
    try {
      const hasPermission = await this.requestContactPermission();
      if (!hasPermission) {
        console.log('Contact permission denied');
        return false;
      }

      const contacts = await Contacts.getAll();
      this.contacts = contacts;
      
      // Create phone number to contact mapping
      this.contactMap.clear();
      contacts.forEach(contact => {
        contact.phoneNumbers.forEach(phone => {
          const cleanNumber = this.cleanPhoneNumber(phone.number);
          this.contactMap.set(cleanNumber, contact);
        });
      });
      
      console.log(`Loaded ${contacts.length} contacts`);
      return true;
    } catch (error) {
      console.error('Error loading contacts:', error);
      return false;
    }
  }

  cleanPhoneNumber(number) {
    // Remove all non-digit characters and get last 10 digits
    const digits = number.replace(/\D/g, '');
    return digits.slice(-10);
  }

  extractPhoneFromFilename(filename) {
    // Extract phone number from filename like "00911244999799(00911244999799)_20250821152845.mp3"
    const match = filename.match(/\((\d{10,})\)/);
    return match ? this.cleanPhoneNumber(match[1]) : null;
  }

  extractContactNameFromFilename(filename) {
    // Extract contact name from filename like "Sonu Pantry(00919971696793)_20250821182137.mp3"
    const match = filename.match(/^([^(]+)\(/);
    return match ? match[1].trim() : null;
  }

  getContactByPhone(phoneNumber) {
    const cleanNumber = this.cleanPhoneNumber(phoneNumber);
    return this.contactMap.get(cleanNumber) || null;
  }

  getContactNameByFilename(filename) {
    // First try to get name from filename
    const filenameContact = this.extractContactNameFromFilename(filename);
    if (filenameContact && filenameContact !== filename) {
      return filenameContact;
    }
    
    // Fallback to phone book lookup
    const phone = this.extractPhoneFromFilename(filename);
    if (!phone) return 'Unknown';
    
    const contact = this.getContactByPhone(phone);
    return contact ? contact.displayName || contact.givenName || 'Unknown Contact' : phone;
  }

  groupFilesByContact(files) {
    const grouped = new Map();
    
    files.forEach(file => {
      const phone = this.extractPhoneFromFilename(file.name);
      const contactName = this.getContactNameByFilename(file.name);
      const key = phone || 'unknown';
      
      if (!grouped.has(key)) {
        grouped.set(key, {
          contactName,
          phone,
          files: []
        });
      }
      
      grouped.get(key).files.push(file);
    });
    
    return Array.from(grouped.values()).sort((a, b) => 
      a.contactName.localeCompare(b.contactName)
    );
  }
}

export default new ContactService();