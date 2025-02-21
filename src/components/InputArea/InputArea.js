import React, { useState, useEffect, useRef } from 'react';
import './InputArea.css';

const InputArea = ({ inputText, setInputText, onSend }) => {
  const maxLength = 1000; // Set max character limit
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null); // Persistent reference to avoid re-creating it

  useEffect(() => {
    // Initialize SpeechRecognition only once
    if (!recognitionRef.current) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognizer = new SpeechRecognition();
      recognizer.lang = 'en-US';
      recognizer.interimResults = false;
      recognizer.maxAlternatives = 1;
      recognizer.continuous = false; // Avoid multiple starts

      recognizer.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputText((prev) => prev + ' ' + transcript); // Append new speech to existing text
      };

      recognizer.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognizer.onend = () => {
        setIsListening(false); // Reset state when stopped
      };

      recognitionRef.current = recognizer;
    }
  }, [setInputText]);

  const handleSpeechToText = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  return (
    <div className="input-area">
      <textarea
        placeholder="Type your text here..."
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        aria-label="Text input field"
        maxLength={maxLength}
      />
      <div className="character-count">
        {inputText.length}/{maxLength}
      </div>
      <div className="actions">
        <button onClick={handleSpeechToText} aria-label="Convert speech to text">
          {isListening ? '⏹️ Stop' : '🎤 Speak'}
        </button>
        <button onClick={onSend} aria-label="Send text">
          Send
        </button>
      </div>
    </div>
  );
};

export default InputArea;
