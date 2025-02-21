import React from 'react';
import './OutputArea.css';

const OutputArea = ({ outputText, detectedLanguage, onSummarize, onTranslate, translatedText, summary }) => {
  
  const handleTextToSpeech = () => {
    if (outputText) {
      const synth = window.speechSynthesis;
      const utterance = new SpeechSynthesisUtterance(outputText);
      synth.speak(utterance);
    }
  };

  return (
    <div className="output-area">
      <p>{outputText}</p>
      
      {detectedLanguage && <p className="language">Detected Language: {detectedLanguage}</p>}

      {outputText.length > 150 && (
        <button onClick={onSummarize} aria-label="Summarize text">
          Summarize
        </button>
      )}

      {summary && <p className="summary">Summary: {summary}</p>}

      <button onClick={handleTextToSpeech} aria-label="Read text aloud">
        🔊 Read Aloud
      </button>

      <div className="translate-section">
        <select onChange={(e) => onTranslate(e.target.value)} aria-label="Select language for translation">
          <option value="en">English</option>
          <option value="pt">Portuguese</option>
          <option value="es">Spanish</option>
          <option value="ru">Russian</option>
          <option value="tr">Turkish</option>
          <option value="fr">French</option>
        </select>
        <button onClick={() => onTranslate()} aria-label="Translate text">
          Translate
        </button>
      </div>

      {translatedText && <p className="translated-text">Translated: {translatedText}</p>}
    </div>
  );
};

export default OutputArea;
