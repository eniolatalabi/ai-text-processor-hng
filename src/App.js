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
  const [isNewChat, setIsNewChat] = useState(true); // New state for tracking if it's a new chat
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

  // Handle new chat button click
  const handleNewChat = () => {
    setMessages([]);
    setInputText('');
    setError('');
    setIsNewChat(false); // Mark as not a new chat (no welcome message)
  };

  // Improved language detection
  const detectLanguage = async (text) => {
    if (!text || text.length < 10) return 'en'; // Default to English for very short text
    
    // Try using the Translator API for detection first
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
            console.log('API detected language:', detected.language);
            return detected.language;
          }
        }
      } catch (e) {
        console.warn('Language detection API error:', e);
      }
    }

    // More comprehensive heuristic detection using character frequencies and patterns
    const patterns = {
      // Russian (Cyrillic characters) - More specific
      ru: /[а-яА-ЯёЁ]{3,}/,
      
      // Spanish (Spanish-specific characters and common words) - More specific pattern
      es: /(?:[áéíóúüñ¿¡]|(?:\b(?:el|la|los|las|un|una|y|o|que|en|por|para|con|su|sus|mi|tu|esto|esta|aquí|allí|hola|gracias|bueno|como)\b.*){4,})/i,
      
      // French (French-specific characters and common words) - More specific
      fr: /(?:[àâçéèêëîïôùûüÿœ]|(?:\b(?:le|la|les|un|une|et|ou|que|qui|dans|sur|pour|avec|je|tu|il|elle|nous|vous|ils|elles|mais|donc|car|si|très|bien|bon|voilà|bonjour|merci)\b.*){4,})/i,
      
      // Portuguese (Portuguese-specific characters and common words) - More specific
      pt: /(?:[ãõáéíóúâêôç]|(?:\b(?:o|a|os|as|um|uma|e|ou|que|em|por|para|com|seu|sua|seus|suas|meu|teu|isto|esta|aqui|lá|olá|obrigado|bom|como)\b.*){4,})/i,
      
      // Turkish (Turkish-specific characters and common words) - More specific
      tr: /(?:[çğıöşü]|(?:\b(?:bir|ve|ile|için|bu|şu|o|ne|nasıl|kim|nerede|merhaba|teşekkürler|iyi|güzel)\b.*){3,})/i,
    };

    // Count matches for each language
    const scores = {};
    for (const [lang, pattern] of Object.entries(patterns)) {
      const matches = (text.match(pattern) || []).length;
      scores[lang] = matches;
    }

    // Get language with highest score
    let detectedLang = 'en'; // Default to English
    let highestScore = 0;
    
    for (const [lang, score] of Object.entries(scores)) {
      if (score > highestScore) {
        highestScore = score;
        detectedLang = lang;
      }
    }
    
    // If we found matches for a non-English language, return it
    if (highestScore > 0) {
      console.log('Heuristic detected language:', detectedLang, 'with score:', highestScore);
      return detectedLang;
    }
    
    // Default to English if no patterns matched strongly
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

  // Improved translation function
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

    // Special case for English as target language
    if (targetLanguage === 'en') {
      try {
        const lastMessage = messages[messages.length - 1].text;
        const translator = await window.ai.translator.create({
          model: 'default',
          sourceLanguage: 'auto', // Always use auto-detect for English target
          targetLanguage: 'en'
        });
        
        const result = await translator.translate(lastMessage);
        
        if (typeof result === 'string' && result.trim() !== '') {
          setMessages((prevMessages) => [
            ...prevMessages,
            { 
              text: `Auto-detected → English: ${result}`, 
              type: 'system',
              timestamp: formatTimestamp(),
              language: 'en'
            },
          ]);
        }
      } catch (err) {
        console.error('Translation to English failed:', err);
        setError('Translation to English failed. Please try again.');
      }
      setIsLoading(false);
      return;
    }

    // For non-English target languages
    try {
      console.log('Using Translator API...');
      const lastMessage = messages[messages.length - 1].text;
      
      // Get the source language - either from the message if it's already set,
      // or by detecting it
      let sourceLanguage = messages[messages.length - 1].language;
      if (!sourceLanguage || sourceLanguage === 'auto') {
        try {
          // Try to detect language explicitly
          const detector = await window.ai.translator.create({
            model: 'default',
            sourceLanguage: 'auto',
            targetLanguage: 'en'
          });
          
          if (detector.detectLanguage) {
            const detected = await detector.detectLanguage(lastMessage);
            if (detected && detected.language) {
              sourceLanguage = detected.language;
              setDetectedLanguage(sourceLanguage);
              console.log('Translation language detected:', sourceLanguage);
            }
          }
        } catch (e) {
          console.warn('Detection error during translation:', e);
          // Use our custom detection as fallback
          sourceLanguage = await detectLanguage(lastMessage);
        }
      }
      
      // Don't translate if source and target languages are the same
      if (sourceLanguage === targetLanguage) {
        setError('Source and target languages are the same. Please select a different language.');
        setIsLoading(false);
        return;
      }
      
      console.log(`Translating from ${sourceLanguage} to ${targetLanguage}`);
      
      // Create the translator with explicit source and target languages
      const translator = await window.ai.translator.create({
        model: 'default',
        sourceLanguage: sourceLanguage || 'auto',
        targetLanguage: targetLanguage
      });
      
      const result = await translator.translate(lastMessage);
      
      if (typeof result === 'string' && result.trim() !== '') {
        const sourceName = languageNames[sourceLanguage] || sourceLanguage;
        const targetName = languageNames[targetLanguage] || targetLanguage;
        
        setMessages((prevMessages) => [
          ...prevMessages,
          { 
            text: `${sourceName} → ${targetName}: ${result}`, 
            type: 'system',
            timestamp: formatTimestamp(),
            language: targetLanguage
          },
        ]);
      } else {
        throw new Error('Empty translation result');
      }
    } catch (err) {
      console.error('Translation Error:', err);
      
      // Try a simplified approach for problematic language pairs
      try {
        console.log('Attempting simplified translation...');
        const lastMessage = messages[messages.length - 1].text;
        
        // Force explicit language pair configuration
        const translator = await window.ai.translator.create({
          model: 'default',
          // For Russian/French target, assume English source
          sourceLanguage: (targetLanguage === 'ru' || targetLanguage === 'fr') ? 'en' : 'auto',
          targetLanguage: targetLanguage
        });
        
        const result = await translator.translate(lastMessage);
        
        if (typeof result === 'string' && result.trim() !== '') {
          const sourceLabel = (targetLanguage === 'ru' || targetLanguage === 'fr') ? 'English' : 'Auto-detected';
          const targetName = languageNames[targetLanguage];
          
          setMessages((prevMessages) => [
            ...prevMessages,
            { 
              text: `${sourceLabel} → ${targetName}: ${result}`, 
              type: 'system',
              timestamp: formatTimestamp(),
              language: targetLanguage
            },
          ]);
        } else {
          throw new Error('Empty translation result from simplified approach');
        }
      } catch (fallbackErr) {
        console.error('All translation attempts failed:', fallbackErr);
        setError('Translation failed. The language pair may not be supported or there might be an API limitation.');
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
        <div className='app-title'>
        <h1 className="title">Linguastand</h1>
        <DarkModeToggle isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
        </div>
        <div className="header-actions">
          <button 
            className="new-chat-button" 
            onClick={handleNewChat}
            title="Start a new chat"
          >
            New Chat
          </button>
        </div>
      </header>
      
      {/* API Status Banner */}
      {supportedAPIs.length === 0 && (
        <div className="api-status-warning">
          <p>⚠️ AI APIs not detected. Please enable AI features in your browser settings.</p>
        </div>
      )}
      
      <div className="chat-container">
        <div className="chat-window" ref={chatWindowRef}>
          {messages.length === 0 && isNewChat && (
            <div className="welcome-message">
              <h2>Welcome to Linguastand</h2>
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
                  {message.type === 'user' ? 'You' : 'Linguastand'}
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
                {isListening ? '🔴' : '🎙️'}
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