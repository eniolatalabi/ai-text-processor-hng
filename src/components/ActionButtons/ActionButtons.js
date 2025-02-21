import React, { useState, useRef } from 'react';
import './ActionButtons.css';

const ActionButtons = ({ onSummarize, onTranslate, supportedAPIs, languageOptions }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleTranslateClick = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleLanguageSelect = (langCode) => {
    onTranslate(langCode);
    setIsDropdownOpen(false);
  };

  // Close dropdown when clicking outside
  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setIsDropdownOpen(false);
    }
  };

  // Add event listener to handle outside clicks
  React.useEffect(() => {
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Filter only the specified languages
  const supportedLanguages = {
    'en': 'English', 
    'fr': 'French', 
    'pt': 'Portuguese', 
    'ru': 'Russian', 
    'es': 'Spanish', 
    'tr': 'Turkish'
  };

  return (
    <div className="action-buttons">
      <button
        className={`action-button summarize-button ${!supportedAPIs.includes('Summarizer') ? 'disabled' : ''}`}
        onClick={onSummarize}
        disabled={!supportedAPIs.includes('Summarizer')}
      >
        <span className="button-text">Summarize</span>
      </button>
      
      <div className="translate-dropdown-container" ref={dropdownRef}>
        <button
          className={`action-button translate-button ${!supportedAPIs.includes('Translator') ? 'disabled' : ''}`}
          onClick={handleTranslateClick}
          disabled={!supportedAPIs.includes('Translator')}
        >
          <span className="button-text">Translate to</span>
          <span className="dropdown-arrow">{isDropdownOpen ? '▲' : '▼'}</span>
        </button>
        
        {isDropdownOpen && (
          <div className="language-dropdown">
            {Object.entries(supportedLanguages).map(([code, name]) => (
              <button
                key={code}
                className="language-option"
                onClick={() => handleLanguageSelect(code)}
              >
                {name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActionButtons;