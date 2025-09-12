import React, { createContext, useContext, useState } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const lightTheme = {
  background: '#f5f5f5',
  surface: '#fff',
  text: '#333',
  textSecondary: '#666',
  primary: '#007AFF',
  border: '#eee',
  shadow: '#000',
};

export const darkTheme = {
  background: '#121212',
  surface: '#1e1e1e',
  text: '#fff',
  textSecondary: '#aaa',
  primary: '#0a84ff',
  border: '#333',
  shadow: '#000',
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const theme = isDarkMode ? darkTheme : lightTheme;
  
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };
  
  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};