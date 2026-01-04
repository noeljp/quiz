import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { IconButton, Tooltip, CircularProgress } from '@mui/material';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import StopIcon from '@mui/icons-material/Stop';

/**
 * TextToSpeech Component
 * Provides text-to-speech functionality using the Web Speech API
 * Supports French language with fallback to browser default
 */
function TextToSpeech({ text, lang = 'fr-FR', rate = 1.0, pitch = 1.0 }) {
  const [speaking, setSpeaking] = useState(false);
  const [supported] = useState(() => 'speechSynthesis' in window);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Log warning if not supported
    if (!supported) {
      console.warn('Web Speech API is not supported in this browser');
    }

    // Cleanup: stop speaking when component unmounts
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [supported]);

  const handleSpeak = () => {
    if (!supported || !text) return;

    // If already speaking, stop
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    setLoading(true);

    // Create speech synthesis utterance
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = rate;
    utterance.pitch = pitch;

    // Try to find a French voice
    // Note: getVoices() may return empty array on first load
    // Voices are loaded asynchronously, but speechSynthesis will use default if none specified
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      const frenchVoice = voices.find(voice => 
        voice.lang.startsWith('fr') || voice.lang === lang
      );
      
      if (frenchVoice) {
        utterance.voice = frenchVoice;
      }
    }

    // Event handlers
    utterance.onstart = () => {
      setSpeaking(true);
      setLoading(false);
    };

    utterance.onend = () => {
      setSpeaking(false);
      setLoading(false);
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setSpeaking(false);
      setLoading(false);
    };

    // Speak
    window.speechSynthesis.speak(utterance);
  };

  if (!supported) {
    return null; // Don't render if not supported
  }

  return (
    <Tooltip 
      title={speaking ? "Arrêter la lecture" : "Écouter le texte"}
      arrow
    >
      <IconButton
        onClick={handleSpeak}
        color={speaking ? "secondary" : "primary"}
        size="small"
        disabled={loading || !text}
        aria-label={speaking ? "Arrêter la lecture" : "Écouter"}
      >
        {loading ? (
          <CircularProgress size={24} />
        ) : speaking ? (
          <StopIcon />
        ) : (
          <VolumeUpIcon />
        )}
      </IconButton>
    </Tooltip>
  );
}

TextToSpeech.propTypes = {
  text: PropTypes.string.isRequired,
  lang: PropTypes.string,
  rate: PropTypes.number,
  pitch: PropTypes.number,
};

export default TextToSpeech;
