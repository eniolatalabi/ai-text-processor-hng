import React, { useState, useEffect, useRef } from 'react';
import InputArea from './components/InputArea/InputArea';
import DarkModeToggle from './components/DarkModeToggle/DarkModeToggle';
import ActionButtons from './components/ActionButtons/ActionButtons';
import './App.css';

const App = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('en'); // Default language
  const [supportedAPIs, setSupportedAPIs] = useState([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentUtterance, setCurrentUtterance] = useState(null);
  const [detectedLanguage, setDetectedLanguage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const chatWindowRef = useRef(null);
  const maxInputChars = 5000;

  // Reduced language mapping - only the required languages
  const languageNames = {
    'en': 'English',
    'es': 'Spanish',
    'pt': 'Portuguese',
    'fr': 'French',
    'ru': 'Russian',
    'tr': 'Turkish',
    'auto': 'Auto-detect'
  };

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages]);

  // Check API support on component mount with verification
  useEffect(() => {
    const checkAPISupport = async () => {
      const supported = [];
      const errors = [];
      
      if (window.ai) {
        try {
          if (window.ai.summarizer) {
            // Test if we can actually create a summarizer instance
            await window.ai.summarizer.create({model: 'default'});
            console.log('Summarizer API verified');
            supported.push('Summarizer');
          } else {
            errors.push('Summarizer API not available');
          }
        } catch (e) {
          console.error('Summarizer API failed verification:', e);
          errors.push('Summarizer API failed to initialize');
        }
        
        try {
          if (window.ai.translator) {
            // Test if we can create a translator instance
            await window.ai.translator.create({
              model: 'default',
              sourceLanguage: 'en',
              targetLanguage: 'es'
            });
            console.log('Translator API verified');
            supported.push('Translator');
          } else {
            errors.push('Translator API not available');
          }
        } catch (e) {
          console.error('Translator API failed verification:', e);
          errors.push('Translator API failed to initialize');
        }
      } else {
        errors.push('Chrome AI APIs not enabled');
      }
      
      setSupportedAPIs(supported);
      
      // If any errors, show them to the user
      if (errors.length > 0) {
        setError(`Browser API Support Issues: ${errors.join(', ')}. Some features may not work.`);
      }
    };
    
    checkAPISupport();
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Detect language using the native browser language detection API
  const detectLanguage = async (text) => {
    if (!text || text.length < 10) return null;
    
    // Try using the Translator API for detection
    if (supportedAPIs.includes('Translator') && window.ai.translator) {
      try {
        const detector = await window.ai.translator.create({
          model: 'default',
          sourceLanguage: 'auto',
          targetLanguage: 'en'
        });
        
        if (detector.detectLanguage) {
          const detected = await detector.detectLanguage(text);
          if (detected && detected.language) {
            return detected.language;
          }
        }
      } catch (e) {
        console.warn('Language detection API error:', e);
      }
    }

    // Basic heuristic detection as fallback
    // This is very simplistic and just for demonstration
    const patterns = {
      es: /[áéíóúüñ¿¡]/i,
      fr: /[àâçéèêëîïôùûüÿœ]/i,
      pt: /[ãõáéíóúâêôç]/i,
      ru: /[а-яА-Я]/i,
      tr: /[çğıöşü]/i,
    };

    for (const [lang, pattern] of Object.entries(patterns)) {
      if (pattern.test(text)) {
        return lang;
      }
    }

    // Default to English if no pattern matches
    return 'en';
  };

  const formatTimestamp = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  // Format summary by replacing markdown stars with proper paragraphs
  const formatSummary = (text) => {
    if (!text) return '';
    
    // Replace markdown bullet points with proper newlines
    return text.replace(/\*\s+(.+?)(?=\n\*|\n\n|$)/g, '\n• $1')
              .replace(/\*\*(.+?)\*\*/g, '$1')  // Remove bold markers
              .trim();
  };

  const handleSend = async () => {
    if (!inputText.trim()) {
      setError('Please enter some text.');
      return;
    }
    setError('');

    // Detect language
    const langDetected = await detectLanguage(inputText);
    
    const timestamp = formatTimestamp();
    const newMessage = { 
      text: inputText, 
      type: 'user',
      timestamp,
      language: langDetected
    };
    
    setMessages([...messages, newMessage]);
    setInputText('');
    
    // Store the detected language
    if (langDetected) {
      setDetectedLanguage(langDetected);
    }
  };

  const handleSummarize = async () => {
    if (!messages.length) {
      setError('No text available to summarize.');
      return;
    }
    
    const lastMessage = messages[messages.length - 1].text;
    
    if (lastMessage.length < 150) {
      setError('Input must be at least 150 characters for summarization.');
      return;
    }
    
    if (!supportedAPIs.includes('Summarizer')) {
      setError('Summarizer API not available. Please enable Chrome AI features.');
      return;
    }
    
    setIsLoading(true);
    setError('');

    try {
      console.log('Using Summarizer API...');

      const summarizer = await window.ai.summarizer.create({
        model: 'default',
        type: 'key-points',
        format: 'markdown',
        length: 'short',
      });

      console.log('Summarizer API created:', summarizer);

      const result = await summarizer.summarize(lastMessage);
      console.log('Summarization Result:', result);

      if (result && typeof result === 'string') {
        const formattedSummary = formatSummary(result);
        
        setMessages((prevMessages) => [
          ...prevMessages,
          { 
            text: `Summary:\n${formattedSummary}`, 
            type: 'system',
            timestamp: formatTimestamp() 
          },
        ]);
      } else {
        setError('Failed to summarize text.');
        console.warn('Summarizer API did not return a valid summary.');
      }
    } catch (err) {
      setError('Failed to summarize text: ' + (err.message || 'Unknown error'));
      console.error('Summarization Error:', err);
    }
    setIsLoading(false);
  };

  const handleTranslate = async (targetLanguage) => {
    if (!messages.length) {
      setError('No text available to translate.');
      return;
    }
    
    if (!supportedAPIs.includes('Translator')) {
      setError('Translator API not available. Please enable Chrome AI features.');
      return;
    }
    
    // Set the selected language from the dropdown
    setSelectedLanguage(targetLanguage);
    
    setIsLoading(true);
    setError('');

    try {
      console.log('Using Translator API...');
      const lastMessage = messages[messages.length - 1].text;
      let detectedLang = '';
      
      // Step 1: Explicitly detect the language first
      try {
        const detector = await window.ai.translator.create({
          model: 'default',
          sourceLanguage: 'auto',
          targetLanguage: 'en' // Doesn't matter for detection
        });
        
        if (detector.detectLanguage) {
          const detected = await detector.detectLanguage(lastMessage);
          if (detected && detected.language) {
            detectedLang = detected.language;
            setDetectedLanguage(detectedLang);
            console.log('Language detected:', detectedLang);
          }
        }
      } catch (detectErr) {
        console.warn('Detection error:', detectErr);
        // Try our custom detection as fallback
        detectedLang = await detectLanguage(lastMessage) || '';
      }
      
      // Step 2: Now translate with explicit source/target
      const translator = await window.ai.translator.create({
        model: 'default',
        sourceLanguage: detectedLang || 'auto', // Use detected language or auto
        targetLanguage: targetLanguage
      });
      
      console.log(`Translating from ${detectedLang || 'auto'} to ${targetLanguage}`);
      const result = await translator.translate(lastMessage);
      console.log('Translation Result:', result);

      // Try to extract detected language from result if not already set
      if (!detectedLang && result && result.detectedLanguage) {
        detectedLang = result.detectedLanguage;
        setDetectedLanguage(detectedLang);
      }

      if (typeof result === 'string' && result.trim() !== '') {
        const detectedInfo = detectedLang ? 
          `${languageNames[detectedLang] || detectedLang} → ` : '';
          
        setMessages((prevMessages) => [
          ...prevMessages,
          { 
            text: `${detectedInfo}${languageNames[targetLanguage]}: ${result}`, 
            type: 'system',
            timestamp: formatTimestamp(),
            language: targetLanguage
          },
        ]);
        setError(''); // Clear error if translation succeeds
      } else {
        setError('Failed to translate text. Empty result received.');
        console.warn('Translator API did not return a translation.');
      }
    } catch (err) {
      console.error('Translation Error:', err);

      // Fallback approach if the first method fails
      try {
        console.log('Attempting fallback translation approach...');

        // Attempt to detect content language through a different approach
        let sourceLanguage = 'auto';
        if (targetLanguage === 'en') {
          // If target is English, try to detect non-English source
          for (const lang of Object.keys(languageNames)) {
            if (lang !== 'en' && lang !== 'auto') {
              try {
                const testTranslator = await window.ai.translator.create({
                  model: 'default',
                  sourceLanguage: lang,
                  targetLanguage: 'en'
                });
                
                const lastMessage = messages[messages.length - 1].text;
                const testResult = await testTranslator.translate(lastMessage);
                
                if (testResult && testResult.trim() !== lastMessage.trim()) {
                  sourceLanguage = lang;
                  setDetectedLanguage(lang);
                  console.log(`Found likely source language: ${lang}`);
                  break;
                }
              } catch (e) {
                console.log(`Test for ${lang} failed:`, e);
              }
            }
          }
        } else {
          // If target is not English, assume English source
          sourceLanguage = 'en';
          setDetectedLanguage('en');
        }

        console.log(`Fallback translation from ${sourceLanguage} to ${targetLanguage}`);
        const fallbackOpts = {
          model: 'default',
          sourceLanguage: sourceLanguage,
          targetLanguage: targetLanguage,
        };

        const translator = await window.ai.translator.create(fallbackOpts);
        const lastMessage = messages[messages.length - 1].text;
        const result = await translator.translate(lastMessage);
        
        if (typeof result === 'string' && result.trim() !== '') {
          setMessages((prevMessages) => [
            ...prevMessages,
            { 
              text: `${languageNames[sourceLanguage] || sourceLanguage} → ${languageNames[targetLanguage]}: ${result}`, 
              type: 'system',
              timestamp: formatTimestamp(),
              language: targetLanguage
            },
          ]);
          setError(''); // Clear error if fallback succeeds
        } else {
          throw new Error('Empty translation result from fallback');
        }
      } catch (fallbackErr) {
        console.error('Fallback translation also failed:', fallbackErr);
        setError('Translation failed. Please try again with different text or language.');
      }
    }
    setIsLoading(false);
  };

  const handleTextToSpeech = (text, language) => {
    // First cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);

    // Set language for speech if available
    if (language && language !== 'auto') {
      utterance.lang = language;
      console.log(`Setting speech language to: ${language}`);
    } else if (detectedLanguage && detectedLanguage !== 'auto') {
      utterance.lang = detectedLanguage;
      console.log(`Setting speech language to: ${detectedLanguage}`);
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      setCurrentUtterance(utterance);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setCurrentUtterance(null);
    };

    synth.speak(utterance);
  };

  const handleStop = () => {
    const synth = window.speechSynthesis;
    synth.cancel();
    setIsSpeaking(false);
    setCurrentUtterance(null);
  };

  // Speech to text functionality
  const startSpeechToText = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Speech recognition is not supported in your browser.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    
    // Try to set language based on selected or detected language
    if (selectedLanguage && selectedLanguage !== 'auto') {
      recognition.lang = selectedLanguage;
    } else if (detectedLanguage && detectedLanguage !== 'auto') {
      recognition.lang = detectedLanguage;
    }

    recognition.onstart = () => {
      setIsListening(true);
      setError(''); // Clear any errors
    };

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0])
        .map(result => result.transcript)
        .join('');
      
      setInputText(transcript);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      setError(`Speech recognition error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
    window.currentRecognition = recognition; // Save reference to stop later
  };

  const stopSpeechToText = () => {
    if (window.currentRecognition) {
      window.currentRecognition.stop();
      window.currentRecognition = null;
    }
    setIsListening(false);
  };

  const toggleSpeechToText = () => {
    if (isListening) {
      stopSpeechToText();
    } else {
      startSpeechToText();
    }
  };

  return (
    <div className={`app ${isDarkMode ? 'dark-mode' : ''}`}>
      <header className="app-header">
        <h1 className="app-title">Smart Language Assistant</h1>
        <DarkModeToggle isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
      </header>
      
      {/* API Status Banner */}
      {supportedAPIs.length === 0 && (
        <div className="api-status-warning">
          <p>⚠️ AI APIs not detected. Please enable AI features in your browser settings.</p>
        </div>
      )}
      
      <div className="chat-container">
        <div className="chat-window" ref={chatWindowRef}>
          {messages.length === 0 && (
            <div className="welcome-message">
              <h2>Welcome to Smart Language Assistant</h2>
              <p>This app helps you with language-related tasks:</p>
              <ul>
                <li>Translate text between multiple languages</li>
                <li>Summarize long content into key points</li>
                <li>Listen to text being read aloud</li>
                <li>Convert your speech to text</li>
              </ul>
              <p>Get started by typing or speaking your message below!</p>
            </div>
          )}
          
          {messages.map((message, index) => (
            <div key={index} className={`message-container ${message.type}`}>
              <div className="message-header">
                <div className="message-type">
                  {message.type === 'user' ? 'You' : 'Assistant'}
                </div>
                {message.language && (
                  <div className="message-language">
                    {languageNames[message.language] || message.language}
                  </div>
                )}
                <div className="message-timestamp">{message.timestamp}</div>
              </div>
              <div className="message-content">{message.text}</div>
              <div className="message-actions">
                {message.text && (
                  <button
                    className="action-button"
                    onClick={() => handleTextToSpeech(message.text, message.language)}
                    disabled={isSpeaking}
                  >
                    <span>🔊 Listen</span>
                  </button>
                )}
                {isSpeaking && currentUtterance && (
                  <button className="action-button" onClick={handleStop}>
                    <span>⏹️ Stop</span>
                  </button>
                )}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Processing your request...</p>
            </div>
          )}
          
          {error && <div className="error-toast">{error}</div>}
        </div>
        
        <div className="input-section">
          <div className="input-area">
            <div className="textarea-wrapper">
              <textarea
                value={inputText}
                onChange={(e) => {
                  if (e.target.value.length <= maxInputChars) {
                    setInputText(e.target.value);
                  }
                }}
                placeholder="Type your message here..."
                maxLength={maxInputChars}
              />
              <button 
                className={`mic-button ${isListening ? 'active' : ''}`}
                onClick={toggleSpeechToText}
                title={isListening ? "Stop listening" : "Start speech-to-text"}
              >
                {isListening ? '🔴' : '🎤'}
              </button>
              <button 
                className="send-button"
                onClick={handleSend}
                disabled={!inputText.trim()}
                title="Send message"
              >
                ➤
              </button>
            </div>
            <div className="char-counter">
              {inputText.length}/{maxInputChars}
            </div>
          </div>
          
          <div className="action-bar">
            <ActionButtons 
              onSummarize={handleSummarize}
              onTranslate={handleTranslate}
              supportedAPIs={supportedAPIs}
              languageOptions={languageNames}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;