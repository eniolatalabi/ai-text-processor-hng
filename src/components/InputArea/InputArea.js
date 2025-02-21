import React, { useState, useRef, useEffect } from 'react';
import './InputArea.css';

const InputArea = ({ inputText, setInputText, onSend, maxChars }) => {
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef(null);

  // Add effect to handle auto-scrolling when text changes
  useEffect(() => {
    if (textareaRef.current) {
      // Set scroll position to bottom when text changes
      textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
    }
  }, [inputText]);

  const handleTextChange = (e) => {
    if (e.target.value.length <= maxChars) {
      setInputText(e.target.value);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const startSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Speech recognition is not supported in your browser.');
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0])
        .map(result => result.transcript)
        .join('');

      if (event.results[0].isFinal) {
        setInputText(prev => 
          (prev + ' ' + transcript).trim().substring(0, maxChars)
        );
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
  };

  const stopSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window) {
      window.webkitSpeechRecognition.abort();
    }
    setIsRecording(false);
  };

  return (
    <div className="input-area">
      <div className="textarea-container">
        <textarea
          ref={textareaRef}
          value={inputText}
          onChange={handleTextChange}
          onKeyPress={handleKeyPress}
          placeholder="Enter text here..."
          rows={4}
        />

        <div className="input-controls">
          <button 
            className={`mic-button ${isRecording ? 'recording' : ''}`}
            onClick={isRecording ? stopSpeechRecognition : startSpeechRecognition}
            title={isRecording ? "Stop recording" : "Start voice input"}
          >
            {isRecording ? '⏹️' : '🎤'}
          </button>

          <button 
            className="send-button" 
            onClick={onSend}
            disabled={!inputText.trim()}
            title="Send message"
          >
            <span className="send-icon">➤</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default InputArea;