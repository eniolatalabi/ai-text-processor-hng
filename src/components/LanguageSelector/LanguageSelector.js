import React from 'react';
import './LanguageSelector.css';

const LanguageSelector = ({ selectedLanguage, setSelectedLanguage }) => {
  return (
    <select
      value={selectedLanguage}
      onChange={(e) => setSelectedLanguage(e.target.value)}
      aria-label="Select language for translation"
    >
      <option value="en">English</option>
      <option value="pt">Portuguese</option>
      <option value="es">Spanish</option>
      <option value="ru">Russian</option>
      <option value="tr">Turkish</option>
      <option value="fr">French</option>
    </select>
  );
};

export default LanguageSelector;