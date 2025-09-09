import React, { createContext, useContext, useState } from 'react';

const StorageContext = createContext();

export const StorageProvider = ({ children }) => {
  const [storageLocation, setStorageLocation] = useState('/storage/emulated/0/Recordings');

  return (
    <StorageContext.Provider value={{ storageLocation, setStorageLocation }}>
      {children}
    </StorageContext.Provider>
  );
};

export const useStorage = () => {
  const context = useContext(StorageContext);
  if (!context) {
    throw new Error('useStorage must be used within StorageProvider');
  }
  return context;
};