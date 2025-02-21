import React from 'react';
import './ActionButtons.css';

const ActionButtons = ({ onSummarize, onTranslate }) => {
  return (
    <div className="action-buttons">
      <button onClick={onSummarize} aria-label="Summarize text">
        Summarize
      </button>
      <button onClick={onTranslate} aria-label="Translate text">
        Translate
      </button>
    </div>
  );
};

export default ActionButtons;