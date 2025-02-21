import React from 'react';
import './DarkModeToggle.css';

const DarkModeToggle = ({ isDarkMode, toggleDarkMode }) => {
  return (
    <button onClick={toggleDarkMode} aria-label="Toggle dark mode" className="dark-mode-toggle">
      {isDarkMode ? '🌞' : '🌙'}
    </button>
  );
};

export default DarkModeToggle;