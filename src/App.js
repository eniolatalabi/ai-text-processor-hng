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
        setError(`API Support Issues: ${errors.join(', ')}. Some features may not work.`);
      }
    };
    
    checkAPISupport();
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
    
    // Don't reset detected language here
    // Language detection happens during translation
  };

  const handleSummarize = async () => {
    if (!messages.length) {
      setError('No text available to summarize.');
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
    } catch (err) {
      setError('Failed to summarize text: ' + (err.message || 'Unknown error'));
      console.error('Summarization Error:', err);
    }
    setIsLoading(false);
  };

  const handleTranslate = async () => {
    if (!messages.length) {
      setError('No text available to translate.');
      return;
    }
    
    if (!supportedAPIs.includes('Translator')) {
      setError('Translator API not available. Please enable Chrome AI features.');
      return;
    }
    
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
      }
      
      // Step 2: Now translate with explicit source/target
      const translator = await window.ai.translator.create({
        model: 'default',
        sourceLanguage: detectedLang || 'auto', // Use detected language or auto
        targetLanguage: selectedLanguage
      });
      
      console.log(`Translating from ${detectedLang || 'auto'} to ${selectedLanguage}`);
      const result = await translator.translate(lastMessage);
      console.log('Translation Result:', result);

      // Try to extract detected language from result if not already set
      if (!detectedLang && result && result.detectedLanguage) {
        detectedLang = result.detectedLanguage;
        setDetectedLanguage(detectedLang);
      }

      if (typeof result === 'string' && result.trim() !== '') {
        const detectedInfo = detectedLang ? 
          `Detected: ${languageNames[detectedLang] || detectedLang} → ` : '';
          
        setMessages((prevMessages) => [
          ...prevMessages,
          { 
            text: `${detectedInfo}Translated to ${languageNames[selectedLanguage]}: ${result}`, 
            type: 'system' 
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
        if (selectedLanguage === 'en') {
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

        console.log(`Fallback translation from ${sourceLanguage} to ${selectedLanguage}`);
        const fallbackOpts = {
          model: 'default',
          sourceLanguage: sourceLanguage,
          targetLanguage: selectedLanguage,
        };

        const translator = await window.ai.translator.create(fallbackOpts);
        const lastMessage = messages[messages.length - 1].text;
        const result = await translator.translate(lastMessage);
        
        if (typeof result === 'string' && result.trim() !== '') {
          setMessages((prevMessages) => [
            ...prevMessages,
            { 
              text: `${languageNames[sourceLanguage] || sourceLanguage} → Translated to ${languageNames[selectedLanguage]}: ${result}`, 
              type: 'system' 
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

  const handleTextToSpeech = (text) => {
    // First cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);

    // Set language for speech if detected
    if (detectedLanguage && detectedLanguage !== 'auto') {
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

  return (
    <div className={`app ${isDarkMode ? 'dark-mode' : ''}`}>
      <DarkModeToggle isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
      
      {/* API Status Banner */}
      {supportedAPIs.length === 0 && (
        <div className="api-status-warning">
          <p>⚠️ Chrome AI APIs not detected. Please enable AI features in Chrome settings.</p>
        </div>
      )}
      
      <div className="chat-container">
        <div className="chat-window">
          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.type}`}>
              <p>{msg.text}</p>
              <div className="tts-controls">
                <button
                  onClick={() => handleTextToSpeech(msg.text)}
                  aria-label="Play"
                  disabled={!('speechSynthesis' in window)}
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
        <ActionButtons 
          onSummarize={handleSummarize} 
          onTranslate={handleTranslate} 
          supportedAPIs={supportedAPIs}
        />
      </div>
    </div>
  );
};

export default App;