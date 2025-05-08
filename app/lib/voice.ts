import { AssemblyAI } from 'assemblyai';

// Initialize the AssemblyAI client
const assemblyai = new AssemblyAI({
  apiKey: process.env.NEXT_PUBLIC_ASSEMBLYAI_API_KEY || '',
});

// Speech state manager
export const speechState = {
  isSpeaking: false,
  utterances: [] as SpeechSynthesisUtterance[],
  currentRate: 1.0,
  debug: true, // Enable debug mode to help diagnose issues
  watchdogTimer: null as NodeJS.Timeout | null,
  voicesLoaded: false,
  preferredVoice: null as SpeechSynthesisVoice | null,
  voiceInitAttempts: 0, // Track initialization attempts
  isSafari: false, // Will be set during init
  isMacOS: false,  // Will be set during init
};

// Helper to detect browser type
function detectBrowser() {
  if (typeof window === 'undefined') return;
  
  // Check for Safari
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  
  // Check for macOS
  const isMacOS = /Mac/.test(navigator.platform);
  
  speechState.isSafari = isSafari;
  speechState.isMacOS = isMacOS;
  
  if (speechState.debug) {
    console.log(`Browser detection: Safari=${isSafari}, macOS=${isMacOS}`);
  }
}

// Transcribe audio using AssemblyAI
export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  try {
    const transcript = await assemblyai.transcripts.transcribe({
      audio: audioBlob,
    });
    
    if (transcript.status === 'completed') {
      return transcript.text || '';
    } else {
      console.error('Transcription status:', transcript.status);
      return '';
    }
  } catch (error) {
    console.error('Error transcribing audio:', error);
    return '';
  }
}

// Get available voices for text-to-speech
export const getAvailableVoices = (): SpeechSynthesisVoice[] => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.error('Speech synthesis not available in this browser');
    return [];
  }
  
  let voices = window.speechSynthesis.getVoices();
  
  // Log available voices for debugging
  if (speechState.debug) {
    console.log('Available voices:', voices.map(v => `${v.name} (${v.lang})`));
  }
  
  // Force voices to load - Chrome requires this
  if (voices.length === 0) {
    // This is a sync operation to try to get voices immediately 
    window.speechSynthesis.getVoices();
    voices = window.speechSynthesis.getVoices();
    
    if (voices.length === 0 && speechState.debug) {
      console.warn('No voices available immediately, waiting for voiceschanged event');
    }
  } else {
    speechState.voicesLoaded = true;
  }
  
  return voices;
};

// Find the best voice to use - improved with fallback strategies
function findBestVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return null;
  }
  
  // If we already found a preferred voice, use it
  if (speechState.preferredVoice) {
    return speechState.preferredVoice;
  }
  
  const voices = window.speechSynthesis.getVoices();
  
  if (voices.length === 0) {
    // If no voices are available, try a more aggressive approach to trigger voice loading
    if (speechState.voiceInitAttempts < 3) {
      speechState.voiceInitAttempts++;
      
      // Create and immediately cancel a dummy utterance to kickstart voice loading
      if (window.speechSynthesis) {
        const dummy = new SpeechSynthesisUtterance('');
        window.speechSynthesis.speak(dummy);
        window.speechSynthesis.cancel();
      }
      
      if (speechState.debug) {
        console.log(`Voice initialization attempt ${speechState.voiceInitAttempts}`);
      }
    }
    return null;
  }
  
  if (speechState.debug) {
    console.log(`Found ${voices.length} voices available`);
  }
  
  // Try to find a good English voice with priority ordering
  // 1. Google US English or Microsoft voices (best quality)
  // 2. Any en-US voice
  // 3. Any English voice
  // 4. First available voice as fallback
  const googleVoice = voices.find(v => 
    v.name.includes('Google US English') || 
    v.name.includes('Google UK English')
  );
  
  const microsoftVoice = voices.find(v => 
    v.name.includes('Microsoft') && 
    v.lang.startsWith('en')
  );
  
  const macOSVoice = voices.find(v => 
    v.name.includes('Samantha') || // macOS common voice
    v.name.includes('Alex') ||
    (v.name.includes('en-US') && v.localService === true)
  );
  
  const usEnglishVoice = voices.find(v => v.lang === 'en-US');
  const anyEnglishVoice = voices.find(v => v.lang.startsWith('en'));
  
  // Store the best voice we find
  speechState.preferredVoice = googleVoice || microsoftVoice || macOSVoice || usEnglishVoice || anyEnglishVoice || voices[0];
  
  if (speechState.debug && speechState.preferredVoice) {
    console.log(`Selected voice: ${speechState.preferredVoice.name} (${speechState.preferredVoice.lang})`);
  }
  
  return speechState.preferredVoice;
}

// Function to initialize and preload speech synthesis - improved reliability
export function initSpeechSynthesis(): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.error('Speech synthesis not available');
    return;
  }
  
  // Detect browser for special handling
  detectBrowser();
  
  if (speechState.debug) {
    console.log('Initializing speech synthesis...');
  }
  
  // Try to force browser to initialize speech system
  window.speechSynthesis.cancel(); // Cancel any existing speech
  
  // Force load voices to ensure they're ready
  const voices = window.speechSynthesis.getVoices();
  
  if (voices.length === 0) {
    // Set up the voices changed event
    window.speechSynthesis.onvoiceschanged = () => {
      const loadedVoices = window.speechSynthesis.getVoices();
      speechState.voicesLoaded = loadedVoices.length > 0;
      
      if (speechState.debug) {
        console.log(`Voices loaded: ${loadedVoices.length} voices available`);
      }
      
      // Pre-select the best voice
      findBestVoice();
    };
    
    // Try to trigger voices loading with a dummy utterance
    const dummy = new SpeechSynthesisUtterance('');
    window.speechSynthesis.speak(dummy);
    window.speechSynthesis.cancel();
    
    // Also explicitly call getVoices() which may help trigger voice loading in some browsers
    window.speechSynthesis.getVoices();
    
    // For Safari/macOS, try immediately and with a special approach
    if (speechState.isSafari || speechState.isMacOS) {
      // Safari often needs multiple attempts
      const safariVoiceInit = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          speechState.voicesLoaded = true;
          findBestVoice();
          return true;
        }
        return false;
      };
      
      // Try immediately
      if (!safariVoiceInit()) {
        // Try again after short delays
        setTimeout(() => {
          if (!safariVoiceInit()) {
            setTimeout(safariVoiceInit, 300);
          }
        }, 100);
      }
    } else {
      // For other browsers, a single retry is usually sufficient
      setTimeout(() => {
        if (!speechState.voicesLoaded) {
          const voices = window.speechSynthesis.getVoices();
          if (voices.length > 0) {
            speechState.voicesLoaded = true;
            findBestVoice();
          }
        }
      }, 100);
    }
  } else {
    speechState.voicesLoaded = true;
    if (speechState.debug) {
      console.log(`Speech synthesis initialized with ${voices.length} voices`);
    }
    
    // Pre-select the best voice
    findBestVoice();
  }
  
  // Start the Chrome watchdog timer to prevent the browser from stopping speech
  startSpeechWatchdog();
}

// Chrome has a bug where it stops speech synthesis after about 15 seconds
// This watchdog helps prevent that by restarting speech when needed
function startSpeechWatchdog() {
  if (speechState.watchdogTimer) {
    clearInterval(speechState.watchdogTimer);
  }
  
  // Check more frequently (every 3 seconds) to ensure no stuttering
  speechState.watchdogTimer = setInterval(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (speechState.isSpeaking) {
        // Force resume if paused (Chrome bug workaround)
        if (!window.speechSynthesis.speaking && speechState.utterances.length > 0) {
          if (speechState.debug) {
            console.log('Watchdog detected stalled speech, restarting...');
          }
          window.speechSynthesis.resume();
        }
      }
    }
  }, 3000);
}

// Improved version of textToSpeech for better reliability across browsers
export async function textToSpeech(text: string, rate: number = speechState.currentRate): Promise<string> {
  return new Promise((resolve) => {
    // Use the browser's built-in SpeechSynthesis API
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.error('Speech synthesis not available in this browser');
      resolve('speech_not_supported');
      return;
    }
    
    if (speechState.debug) {
      console.log('Starting speech synthesis for text length:', text.length);
    }
    
    // Cancel any ongoing speech and reset state
    stopSpeech();
    
    // Set the speaking state
    speechState.isSpeaking = true;
    
    // Check if we need to initialize voices first
    if (!speechState.voicesLoaded || !speechState.preferredVoice) {
      forceVoiceInit().then(success => {
        if (success) {
          // Now that voices are loaded, try speaking again
          setTimeout(() => textToSpeech(text, rate).then(resolve), 100);
        } else {
          // If we can't load voices, try anyway with default browser behavior
          console.warn('Voices not loaded, attempting to speak with default voice');
          proceedWithSpeech();
        }
      });
      return;
    }
    
    // If voices are loaded, proceed directly
    proceedWithSpeech();
    
    function proceedWithSpeech() {
      // Break into manageable chunks (Chrome has issues with long text)
      const chunks = chunkText(text);
      
      if (speechState.debug) {
        console.log(`Text broken into ${chunks.length} chunks`);
      }
      
      // Try to get a voice - first look for the preferred one, then find best available
      const voice = speechState.preferredVoice || findBestVoice();
      
      // If still no voice available, try with default voice
      if (!voice && speechState.debug) {
        console.warn('No preferred voice found, using default browser voice');
      }
      
      // Safari/macOS specific adjustments
      let chunkSize = 200;  // Default chunk size
      let delayBetweenChunks = 0; // Default delay
      
      if (speechState.isSafari || speechState.isMacOS) {
        // Safari works better with smaller chunks and slight delays
        chunkSize = 150;
        delayBetweenChunks = 50; // ms
      }
      
      // Speak each chunk sequentially
      let currentChunk = 0;
      
      function speakNextChunk() {
        if (currentChunk >= chunks.length) {
          if (speechState.debug) {
            console.log('All chunks spoken, finishing speech');
          }
          
          speechState.isSpeaking = false;
          resolve('speaking_complete');
          return;
        }
        
        try {
          const utterance = new SpeechSynthesisUtterance(chunks[currentChunk]);
          
          // Configure the utterance
          utterance.rate = rate;
          utterance.volume = 1.0;
          
          if (voice) {
            utterance.voice = voice;
          }
          
          // Debug info
          if (speechState.debug) {
            console.log(`Speaking chunk ${currentChunk + 1}/${chunks.length}, rate: ${rate}`);
          }
          
          // Set up the handlers
          utterance.onend = () => {
            currentChunk++;
            
            // For Safari/macOS, add a small delay between chunks
            if (delayBetweenChunks > 0) {
              setTimeout(speakNextChunk, delayBetweenChunks);
            } else {
              speakNextChunk();
            }
          };
          
          utterance.onerror = (e) => {
            // Handle the speech error more gracefully - the error object might be empty
            console.error(`Speech error on chunk ${currentChunk + 1} - continuing to next chunk`);
            
            // Try again with a fallback approach for this chunk
            try {
              // Cancel current speech and try again after a brief pause
              window.speechSynthesis.cancel();
              
              // Move to the next chunk instead of trying to repeat
              currentChunk++;
              
              // For Safari/macOS, add a small delay between chunks even on error
              if (delayBetweenChunks > 0) {
                setTimeout(speakNextChunk, delayBetweenChunks);
              } else {
                // Add a small delay anyway to recover from the error
                setTimeout(speakNextChunk, 50);
              }
            } catch (retryError) {
              // If even the recovery fails, just move to the next chunk
              console.error('Error in error recovery:', retryError);
              currentChunk++;
              speakNextChunk();
            }
          };
          
          // Keep track of this utterance
          speechState.utterances.push(utterance);
          
          // Actually speak
          window.speechSynthesis.speak(utterance);
          
          // Chrome bug workaround - make sure it's not paused
          window.speechSynthesis.resume();
        } catch (e) {
          console.error('Error in speech synthesis:', e);
          currentChunk++;
          speakNextChunk();
        }
      }
      
      // Start the chain
      speakNextChunk();
    }
  });
}

// Helper to chunk text into smaller parts for more reliable speech
function chunkText(text: string): string[] {
  // Get the appropriate chunk size based on browser
  const maxChunkSize = speechState.isSafari || speechState.isMacOS ? 150 : 200;
  
  // Split on sentence boundaries for more natural pauses
  const sentences = text.split(/(?<=[.!?])\s+/);
  const chunks: string[] = [];
  let currentChunk = '';
  
  for (const sentence of sentences) {
    // If this sentence would make the chunk too long, start a new chunk
    if (currentChunk.length + sentence.length > maxChunkSize) {
      if (currentChunk) {
        chunks.push(currentChunk);
      }
      
      // If the sentence itself is very long, split it further
      if (sentence.length > maxChunkSize) {
        // Split long sentences at commas or other natural pause points
        const fragments = sentence.split(/(?<=,|;)\s+/);
        let fragment = '';
        
        for (const piece of fragments) {
          if (fragment.length + piece.length > maxChunkSize) {
            if (fragment) chunks.push(fragment);
            fragment = piece;
          } else {
            fragment += (fragment ? ' ' : '') + piece;
          }
        }
        
        if (fragment) {
          currentChunk = fragment;
        } else {
          currentChunk = '';
        }
      } else {
        currentChunk = sentence;
      }
    } else {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
    }
  }
  
  // Add the last chunk if there is one
  if (currentChunk) {
    chunks.push(currentChunk);
  }
  
  return chunks;
}

// Function to set speech rate
export function setSpeechRate(rate: number): void {
  speechState.currentRate = rate;
  
  // Update any active utterances
  speechState.utterances.forEach(utterance => {
    utterance.rate = rate;
  });
}

// Function to stop any ongoing speech
export const stopSpeech = (): void => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    if (speechState.debug) {
      console.log('Stopping all speech');
    }
    
    window.speechSynthesis.cancel();
    speechState.isSpeaking = false;
    speechState.utterances = [];
  }
};

// Cleanup speech synthesis resources
export function cleanupSpeechSynthesis(): void {
  if (speechState.watchdogTimer) {
    clearInterval(speechState.watchdogTimer);
    speechState.watchdogTimer = null;
  }
  
  stopSpeech();
}

// Additional function to force voice initialization
export function forceVoiceInit(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.error('Speech synthesis not available');
      resolve(false);
      return;
    }
    
    // If voices are already loaded and we have a preferred voice, we're good
    if (speechState.voicesLoaded && speechState.preferredVoice) {
      resolve(true);
      return;
    }
    
    console.log('Force initializing voices...');
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    // Create and speak a silent utterance to kickstart the voice system
    const utterance = new SpeechSynthesisUtterance('');
    utterance.volume = 0; // Silent
    utterance.onend = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        speechState.voicesLoaded = true;
        findBestVoice();
        console.log('Voices initialized by force speak');
        resolve(true);
      } else {
        console.warn('Force speak completed but no voices loaded');
        resolve(false);
      }
    };
    
    utterance.onerror = () => {
      console.warn('Error during force voice initialization');
      // Still try to get voices
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        speechState.voicesLoaded = true;
        findBestVoice();
        resolve(true);
      } else {
        resolve(false);
      }
    };
    
    // Try multiple approaches to load voices
    try {
      // Approach 1: Direct getVoices call
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        speechState.voicesLoaded = true;
        findBestVoice();
        console.log('Voices loaded immediately');
        resolve(true);
        return;
      }
      
      // Approach 2: Speak a silent utterance
      window.speechSynthesis.speak(utterance);
      
      // Approach 3: Set a timeout as fallback
      setTimeout(() => {
        if (!speechState.voicesLoaded) {
          const lastTryVoices = window.speechSynthesis.getVoices();
          if (lastTryVoices.length > 0) {
            speechState.voicesLoaded = true;
            findBestVoice();
            console.log('Voices loaded via timeout');
            resolve(true);
          } else {
            console.warn('Failed to load voices after multiple attempts');
            resolve(false);
          }
        }
      }, 1000);
    } catch (e) {
      console.error('Error in force voice initialization:', e);
      resolve(false);
    }
  });
} 