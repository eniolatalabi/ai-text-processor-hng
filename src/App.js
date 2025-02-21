import React, { useState, useEffect } from 'react';
import InputArea from './components/InputArea/InputArea';
import DarkModeToggle from './components/DarkModeToggle/DarkModeToggle';
import ActionButtons from './components/ActionButtons/ActionButtons';
import LanguageSelector from './components/LanguageSelector/LanguageSelector';
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

  // Language mapping for display
  const languageNames = {
    'en': 'English',
    'es': 'Spanish',
    'pt': 'Portuguese',
    'fr': 'French',
    'ru': 'Russian',
    'tr': 'Turkish',
    'auto': 'Auto-detected'
  };

  // Check API support on component mount
  useEffect(() => {
    const supported = [];
    if (window.ai) {
      if (window.ai.summarizer) {
        console.log('Summarizer API found:', window.ai.summarizer);
        supported.push('Summarizer');
      } else {
        console.warn('Summarizer API NOT found.');
      }

      if (window.ai.translator) {
        console.log('Translator API found:', window.ai.translator);
        supported.push('Translator');
      } else {
        console.warn('Translator API NOT found.');
      }
    } else {
      console.error('window.ai not found. Ensure Chrome AI APIs are enabled.');
    }

    setSupportedAPIs(supported);
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleSend = async () => {
    if (!inputText.trim()) {
      setError('Please enter some text.');
      return;
    }
    setError('');

    const newMessage = { text: inputText, type: 'user' };
    setMessages([...messages, newMessage]);
    setInputText('');
    
    // Reset detected language when new message is sent
    setDetectedLanguage('');
  };

  const handleSummarize = async () => {
    if (!messages.length) {
      setError('No text available to summarize.');
      return;
    }
    setIsLoading(true);
    setError('');

    try {
      if (supportedAPIs.includes('Summarizer')) {
        console.log('Attempting to use Summarizer API...');

        const summarizer = await window.ai.summarizer.create({
          model: 'default',
          type: 'key-points',
          format: 'markdown',
          length: 'short',
        });

        console.log('Summarizer API created:', summarizer);

        const lastMessage = messages[messages.length - 1].text;
        const result = await summarizer.summarize(lastMessage);
        console.log('Summarization Result:', result);

        if (result && typeof result === 'string') {
          setMessages((prevMessages) => [
            ...prevMessages,
            { text: `Summary:\n${result}`, type: 'system' },
          ]);
        } else {
          setError('Failed to summarize text.');
          console.warn('Summarizer API did not return a valid summary.');
        }
      } else {
        setError('Summarizer API not supported.');
      }
    } catch (err) {
      setError('Failed to summarize text.');
      console.error('Summarization Error:', err);
    }
    setIsLoading(false);
  };

  const handleTranslate = async () => {
    if (!messages.length) {
      setError('No text available to translate.');
      return;
    }
    setIsLoading(true);
    setError('');

    try {
      if (supportedAPIs.includes('Translator')) {
        console.log('Attempting to use Translator API...');

        // Define translation options with required sourceLanguage
        const translateOpts = {
          model: 'default',
          sourceLanguage: 'auto', // Automatically detect the source language
          targetLanguage: selectedLanguage, // Target language from the selector
        };

        console.log('Translator options:', translateOpts);

        // Create the translator instance
        const translator = await window.ai.translator.create(translateOpts);
        console.log('Translator API created:', translator);

        // Translate the last message
        const lastMessage = messages[messages.length - 1].text;
        
        // Attempt to detect language first
        try {
          // If the API supports language detection
          if (translator.detectLanguage) {
            const detected = await translator.detectLanguage(lastMessage);
            if (detected && detected.language) {
              setDetectedLanguage(detected.language);
              console.log('Detected language:', detected.language);
            }
          }
        } catch (detectErr) {
          console.warn('Language detection unavailable:', detectErr);
          // Continue with translation even if detection fails
        }
        
        const result = await translator.translate(lastMessage);
        console.log('Translation Result:', result);

        // Try to extract detected language from result if not already set
        if (!detectedLanguage && result && result.detectedLanguage) {
          setDetectedLanguage(result.detectedLanguage);
        }

        if (typeof result === 'string' && result.trim() !== '') {
          const detectedInfo = detectedLanguage ? 
            `Detected: ${languageNames[detectedLanguage] || detectedLanguage} → ` : '';
            
          setMessages((prevMessages) => [
            ...prevMessages,
            { 
              text: `${detectedInfo}Translated to ${languageNames[selectedLanguage]}: ${result}`, 
              type: 'system' 
            },
          ]);
          setError(''); // Clear error if translation succeeds
        } else {
          setError('Failed to translate text.');
          console.warn('Translator API did not return a translation.');
        }
      } else {
        setError('Translator API not supported.');
      }
    } catch (err) {
      console.error('Translation Error:', err);

      // Fallback approach if the first method fails
      try {
        if (supportedAPIs.includes('Translator')) {
          console.log('Attempting fallback translation approach...');

          // Fallback: Use a fixed source language (e.g., 'en')
          const fallbackOpts = {
            model: 'default',
            sourceLanguage: 'en', // Fixed source language
            targetLanguage: selectedLanguage,
          };

          const translator = await window.ai.translator.create(fallbackOpts);
          console.log('Fallback translator created:', translator);

          const lastMessage = messages[messages.length - 1].text;
          const result = await translator.translate(lastMessage);
          console.log('Fallback translation result:', result);

          if (typeof result === 'string' && result.trim() !== '') {
            setMessages((prevMessages) => [
              ...prevMessages,
              { 
                text: `Assuming English source → Translated to ${languageNames[selectedLanguage]}: ${result}`, 
                type: 'system' 
              },
            ]);
            // Set detected language to English for fallback
            setDetectedLanguage('en');
            setError(''); // Clear error if fallback succeeds
          } else {
            throw new Error('Empty translation result');
          }
        }
      } catch (fallbackErr) {
        console.error('Fallback translation also failed:', fallbackErr);
        setError('Translation failed. Please try again.');
      }
    }
    setIsLoading(false);
  };

  const handleTextToSpeech = (text) => {
    // First cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);

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

  return (
    <div className={`app ${isDarkMode ? 'dark-mode' : ''}`}>
      <DarkModeToggle isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
      <div className="chat-container">
        <div className="chat-window">
          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.type}`}>
              <p>{msg.text}</p>
              <div className="tts-controls">
                <button
                  onClick={() => handleTextToSpeech(msg.text)}
                  aria-label="Play"
                >
                  🔊
                </button>
                {isSpeaking && (
                  <button onClick={handleStop} aria-label="Stop">
                    ⏹️
                  </button>
                )}
              </div>
            </div>
          ))}
          {isLoading && <div className="loading-spinner">Loading...</div>}
          {error && <div className="error-toast">{error}</div>}
          {detectedLanguage && (
            <div className="language-info">
              <p>Detected Language: {languageNames[detectedLanguage] || detectedLanguage}</p>
            </div>
          )}
        </div>
        <InputArea inputText={inputText} setInputText={setInputText} onSend={handleSend} />
        <LanguageSelector selectedLanguage={selectedLanguage} setSelectedLanguage={setSelectedLanguage} />
        <ActionButtons onSummarize={handleSummarize} onTranslate={handleTranslate} />
      </div>
    </div>
  );
};

export default App;