import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import TextToSpeech from '../TextToSpeech';

// Mock the Web Speech API
const mockSpeak = vi.fn();
const mockCancel = vi.fn();

// Mock SpeechSynthesisUtterance constructor
class MockSpeechSynthesisUtterance {
  constructor(text) {
    this.text = text;
    this.lang = '';
    this.rate = 1.0;
    this.pitch = 1.0;
    this.voice = null;
    this.onstart = null;
    this.onend = null;
    this.onerror = null;
  }
}

beforeEach(() => {
  // Setup Web Speech API mock
  global.window.speechSynthesis = {
    speak: mockSpeak,
    cancel: mockCancel,
    getVoices: () => [
      { lang: 'fr-FR', name: 'French Voice' },
      { lang: 'en-US', name: 'English Voice' }
    ],
  };
  
  global.SpeechSynthesisUtterance = MockSpeechSynthesisUtterance;
  
  mockSpeak.mockClear();
  mockCancel.mockClear();
});

describe('TextToSpeech', () => {
  it('renders the speaker icon button', () => {
    render(<TextToSpeech text="Bonjour le monde" />);
    const button = screen.getByRole('button', { name: /écouter/i });
    expect(button).toBeInTheDocument();
  });

  it('calls speechSynthesis.speak when clicked', async () => {
    const user = userEvent.setup();
    render(<TextToSpeech text="Test texte" />);
    
    const button = screen.getByRole('button', { name: /écouter/i });
    await user.click(button);
    
    expect(mockSpeak).toHaveBeenCalled();
  });

  it('does not render when Web Speech API is not supported', () => {
    // Remove Web Speech API
    delete global.window.speechSynthesis;
    
    const { container } = render(<TextToSpeech text="Test" />);
    expect(container.firstChild).toBeNull();
  });

  it('disables button when text is empty', () => {
    render(<TextToSpeech text="" />);
    const button = screen.getByRole('button', { name: /écouter/i });
    expect(button).toBeDisabled();
  });

  it('uses French language by default', async () => {
    const user = userEvent.setup();
    render(<TextToSpeech text="Bonjour" />);
    
    const button = screen.getByRole('button', { name: /écouter/i });
    await user.click(button);
    
    expect(mockSpeak).toHaveBeenCalled();
    const utterance = mockSpeak.mock.calls[0][0];
    expect(utterance.lang).toBe('fr-FR');
  });
});
