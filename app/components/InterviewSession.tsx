"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "./Button";
import { InterviewChat } from "./InterviewChat";
import { cn } from "../lib/utils";
import { MicrophoneIcon, PauseIcon, XMarkIcon, ClockIcon, StopIcon } from "@heroicons/react/24/solid";
import { generateInterviewResponse, generateInterviewFeedback } from "../lib/client-ai";
import { transcribeAudio, textToSpeech, stopSpeech, initSpeechSynthesis, cleanupSpeechSynthesis, forceVoiceInit } from "../lib/voice";

type Message = {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
};

type InterviewSessionProps = {
  topic: string;
  sessionType?: "mock" | "topic" | "qa" | "language" | string;
  onEnd: (feedback: { summary: string; strengths: string[]; improvements: string[] }) => void;
  className?: string;
  details?: any;
  notes?: string;
};

export function InterviewSession({ topic, sessionType = "mock", onEnd, className, details = {}, notes = "" }: InterviewSessionProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [audioRecorder, setAudioRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [isEndingInterview, setIsEndingInterview] = useState(false);
  const [interviewTime, setInterviewTime] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [speechRecognition, setSpeechRecognition] = useState<any>(null);
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [typingText, setTypingText] = useState<{id: string, text: string} | null>(null);
  const [typingComplete, setTypingComplete] = useState<boolean>(true);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);
  const typingSpeedRef = useRef<number>(30);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Initialize with welcome message based on session type
  useEffect(() => {
    let welcomeMessage = `Hello! I'll be interviewing you about ${topic} today. Click "Connect" to begin our conversation.`;
    
    if (sessionType === "topic") {
      welcomeMessage = `Welcome to your lecture on ${topic}. Click "Connect" to begin our session. I'll start with an overview and then we'll dive into the details.`;
    } else if (sessionType === "qa") {
      welcomeMessage = `Welcome to your Q&A session on ${topic}. Click "Connect" to begin. I'll be testing your knowledge with a series of questions.`;
    } else if (sessionType === "language") {
      welcomeMessage = `Bonjour! Welcome to your language practice session. Click "Connect" to begin. Today we'll be practicing ${topic}.`;
    }
    
    setMessages([
      {
        id: "welcome",
        content: welcomeMessage,
        role: "assistant",
        timestamp: new Date(),
      }
    ]);
  }, [topic, sessionType]);

  // Initialize speech synthesis when the component loads
  useEffect(() => {
    console.log('Initializing speech synthesis for interview session...');
    if ('speechSynthesis' in window) {
      // Detect browser for special handling
      const ua = navigator.userAgent;
      const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
      const isMacOS = /Mac/.test(ua);
      console.log(`Browser detection: Safari=${isSafari}, macOS=${isMacOS}`);
      
      // Initialize voice capabilities
      initSpeechSynthesis();
      
      // Use the enhanced voice initialization
      setTimeout(async () => {
        try {
          console.log('Trying force voice initialization...');
          const success = await forceVoiceInit();
          console.log('Force voice initialization result:', success);
          
          // Add a short utterance to prime the speech engine
          const testUtterance = new SpeechSynthesisUtterance('Hello');
          testUtterance.volume = 0.01; // Almost silent
          testUtterance.onend = () => console.log('Initial speech primer completed');
          window.speechSynthesis.speak(testUtterance);
        } catch (e) {
          console.error('Voice initialization error:', e);
        }
      }, 500);
      
      // Cleanup on unmount
      return () => {
        console.log('Cleaning up speech synthesis...');
        cleanupSpeechSynthesis();
      };
    } else {
      console.error('Speech synthesis not available in this browser');
    }
  }, []);
  
  // Start the interview timer once connected
  useEffect(() => {
    if (isConnected) {
      timerRef.current = setInterval(() => {
        setInterviewTime(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isConnected]);
  
  // Setup speech recognition
  useEffect(() => {
    // Initialize speech recognition
    const SpeechRecognition = (window as any).SpeechRecognition || 
                              (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        if (finalTranscript) {
          setLiveTranscript(finalTranscript);
        } else if (interimTranscript) {
          setLiveTranscript(interimTranscript);
        }
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
      };
      
      recognitionRef.current = recognition;
      setSpeechRecognition(recognition);
    }
    
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore errors when stopping
        }
      }
    };
  }, []);
  
  // Format timer display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const setupAudioRecording = async () => {
    try {
      if (!navigator.mediaDevices) {
        throw new Error("Media devices not available in this browser or context");
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      
      recorder.addEventListener('dataavailable', handleDataAvailable);
      recorder.addEventListener('stop', handleRecordingStop);
      
      setAudioRecorder(recorder);
      setIsConnected(true);
      
      // Start the interview with an introduction
      setTimeout(() => startInterview(), 1000);
    } catch (error) {
      console.error("Error setting up audio recording:", error);
      alert("Could not access microphone. Voice input will not be available.");
      
      // Still set connected so the interview can proceed without voice
      setIsConnected(true);
      setTimeout(() => startInterview(), 1000);
    }
  };
  
  const startInterview = async () => {
    try {
      setIsLoading(true);
      
      // Find the most appropriate introduction based on session type
      let introMessage = `Great! Let's start our interview about ${topic}. I'll ask you some questions about ${topic} and you can respond either by speaking or typing your answers.`;
      
      // Get the right introduction for the session type
      if (sessionType === "topic") {
        introMessage = `Welcome to your lecture on ${topic}. I'll start with an overview and then we'll dive into the details. Feel free to ask questions at any point.`;
      } else if (sessionType === "qa") {
        introMessage = `Welcome to your Q&A session on ${topic}. I'll be testing your knowledge with a series of questions. Let's see how much you know about ${topic}!`;
      } else if (sessionType === "language") {
        introMessage = `Bonjour! Welcome to your language practice session. Today we'll be practicing ${topic}. I'll speak in the language we're practicing, and you can respond to improve your skills.`;
      } else if (sessionType === "mock") {
        // For mock interviews, use the details to customize the intro
        const role = details.role || topic;
        const company = details.company || "a company";
        
        // Fix experience text formatting
        let experienceText = "this role";
        if (details.experience === "entry") {
          experienceText = "entry-level positions (0-2 years)";
        } else if (details.experience === "mid") {
          experienceText = "mid-level positions (3-5 years)";
        } else if (details.experience === "senior") {
          experienceText = "senior positions (6+ years)";
        }
        
        const specificSkills = details.specificSkills || "";
        
        // Create a mock interview introduction
        introMessage = `Welcome to your mock interview for the ${role} position at ${company}. I'll be your interviewer today. I'll ask you questions related to ${topic} and your experience with ${experienceText}.`;
        
        if (specificSkills) {
          introMessage += ` I'll focus particularly on your skills with ${specificSkills}.`;
        }
        
        introMessage += ` Let's begin!`;
      }
      
      // Save interview session data to sessionStorage for easy access
      const sessionData = {
        id: Date.now().toString(),
        topic,
        type: sessionType,
        startTime: new Date().toISOString(),
      };
      
      sessionStorage.setItem('interviewSession', JSON.stringify(sessionData));
      
      // Add introduction message to the chat
      const introMsg: Message = {
        id: Date.now().toString(),
        content: introMessage,
        role: "assistant",
        timestamp: new Date(),
      };
      
      // Add intro with full content immediately - no typing effect
      setMessages(prev => [...prev, introMsg]);
      
      // Speak the introduction directly
      console.log('Starting to speak introduction...');
      setTimeout(() => {
        safelySpeakText(introMessage);
      }, 500);
      
      // Try to save the session to the database
      try {
        const response = await fetch('/api/create-interview', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            topic,
            type: sessionType,
            notes,
          }),
        });
        
        if (response.ok) {
          const data = await response.json();
          
          // Update the session data with the database ID
          if (data.id) {
            sessionData.id = data.id;
            sessionStorage.setItem('interviewSession', JSON.stringify(sessionData));
          }
        }
      } catch (e) {
        // Silently fail - we don't want to interrupt the interview flow
        console.error('Error saving session:', e);
      }
      
    } catch (error) {
      console.error("Error starting interview:", error);
      alert("There was an error starting the interview. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Safe wrapper for speaking text
  const safelySpeakText = (text: string) => {
    try {
      console.log('Starting safelySpeakText with length:', text.length);
      
      // Make sure speech synthesis is available
      if (!window.speechSynthesis) {
        console.error('Speech synthesis not available');
        return;
      }
      
      // Clean text for speaking - remove markdown formatting
      const cleanedText = text
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markers
        .replace(/\*(.*?)\*/g, '$1')     // Remove italic markers
        .replace(/###\s+(.*?)(\n|$)/g, '$1') // Remove headers
        .replace(/`(.*?)`/g, '$1');    // Remove code markers
      
      // First ensure no other speech is happening
      window.speechSynthesis.cancel();
      
      // Wait for a moment before starting new speech
      setTimeout(() => {
        try {
          // Mark as speaking
          setIsSpeaking(true);
          
          // Prepare text - handle specific patterns that might cause issues
          // Split text into smaller, manageable chunks on natural boundaries
          const sentences = cleanedText.split(/(?<=[.!?])\s+/);
          const chunks: string[] = [];
          let currentChunk = '';
          const maxChunkSize = 150; // Smaller chunks are more reliable
          
          for (const sentence of sentences) {
            // If this sentence would make the chunk too long, start a new chunk
            if (currentChunk.length + sentence.length > maxChunkSize) {
              if (currentChunk) {
                chunks.push(currentChunk);
              }
              
              // If the sentence itself is very long, split it further at commas or other natural pauses
              if (sentence.length > maxChunkSize) {
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
          
          console.log(`Split text into ${chunks.length} chunks for more reliable speech`);
          
          // Find a suitable voice
          const voices = window.speechSynthesis.getVoices();
          const goodVoices = voices.filter(v => 
            (v.lang === 'en-US' || v.lang.startsWith('en')) && 
            !v.name.includes('Zira') // Skip problematic voices
          );
          
          let selectedVoice: SpeechSynthesisVoice | null = null;
          if (goodVoices.length > 0) {
            // Prefer Google voices first, then Microsoft, then any good English voice
            const googleVoice = goodVoices.find(v => v.name.includes('Google'));
            const microsoftVoice = goodVoices.find(v => v.name.includes('Microsoft'));
            selectedVoice = googleVoice || microsoftVoice || goodVoices[0];
          }
          
          // Speak each chunk sequentially
          let currentChunkIndex = 0;
          
          function speakNextChunk() {
            if (currentChunkIndex >= chunks.length) {
              console.log('All chunks spoken, finishing speech');
              setIsSpeaking(false);
              return;
            }
            
            try {
              const utterance = new SpeechSynthesisUtterance(chunks[currentChunkIndex]);
              
              // Configure the utterance
              utterance.rate = speechRate;
              utterance.volume = 1.0;
              
              if (selectedVoice) {
                utterance.voice = selectedVoice;
              }
              
              // Set up the handlers
              utterance.onend = () => {
                console.log(`Chunk ${currentChunkIndex + 1}/${chunks.length} completed`);
                currentChunkIndex++;
                
                // Small delay between chunks for more natural speech
                setTimeout(speakNextChunk, 50);
              };
              
              utterance.onerror = (e) => {
                console.error(`Speech error on chunk ${currentChunkIndex + 1}:`, e);
                
                // Move to next chunk even if there's an error
                currentChunkIndex++;
                setTimeout(speakNextChunk, 50);
              };
              
              // Start speaking this chunk
              window.speechSynthesis.speak(utterance);
              
              // Chrome bug workaround - make sure it's not paused
              window.speechSynthesis.resume();
            } catch (chunkError) {
              console.error(`Error speaking chunk ${currentChunkIndex + 1}:`, chunkError);
              currentChunkIndex++;
              setTimeout(speakNextChunk, 50);
            }
          }
          
          // Start the speech chain
          speakNextChunk();
          
          // Safety timeout to reset speaking state if onend/onerror don't fire
          setTimeout(() => {
            if (isSpeaking) {
              console.log('Speech timeout reached, resetting state');
              setIsSpeaking(false);
            }
          }, 30000); // 30-second timeout
        } catch (innerError) {
          console.error('Error in speech attempt:', innerError);
          setIsSpeaking(false);
        }
      }, 300); // Add delay before starting new speech
      
    } catch (error) {
      console.error('Error in safelySpeakText:', error);
      setIsSpeaking(false);
    }
  };
  
  // New function to test voice
  const testVoice = async () => {
    try {
      console.log('Testing voice functionality...');
      const testPhrase = "Voice system initialized and ready.";
      
      safelySpeakText(testPhrase);
    } catch (error) {
      console.error("Error during voice test:", error);
    }
  };
  
  const handleDataAvailable = (event: BlobEvent) => {
    if (event.data.size > 0) {
      audioChunksRef.current.push(event.data);
    }
  };
  
  const handleRecordingStop = async () => {
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
    audioChunksRef.current = [];
    
    try {
      // Show loading indicator for transcription
      setIsLoading(true);
      setTranscript("Transcribing audio...");
      
      const transcription = await transcribeAudio(audioBlob);
      
      if (transcription) {
        setUserInput(transcription);
        setTranscript(transcription);
        // Automatically send the message after transcription is complete
        handleSendMessage(transcription);
      } else {
        setTranscript(""); // Reset if no transcription
        setIsLoading(false); // Only reset loading if we're not sending a message
      }
    } catch (error) {
      console.error("Error transcribing audio:", error);
      alert("There was an error processing your speech. Please try again or use text input.");
      setIsLoading(false);
      setTranscript("");
    }
  };
  
  const startListening = () => {
    if (!audioRecorder) {
      alert("Microphone is not available. Please try again or use text input.");
      return;
    }
    
    // Don't start listening if AI is speaking
    if (isSpeaking) return;
    
    setIsListening(true);
    setTranscript("");
    setLiveTranscript("");
    
    // Start speech recognition for live transcription
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error('Failed to start recognition:', e);
      }
    }
    
    // Also start audio recording for backup transcription with AssemblyAI
    audioChunksRef.current = [];
    audioRecorder.start();
  };
  
  const stopListening = () => {
    // Stop speech recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error('Failed to stop recognition:', e);
      }
    }
    
    // Stop audio recorder
    if (audioRecorder && audioRecorder.state === 'recording') {
      audioRecorder.stop();
    }
    
    setIsListening(false);
    
    // Don't clear the transcript here - we'll use it for the message
  };
  
  // Speech rate control and speech handling
  const handleSpeechRateChange = (newRate: number) => {
    setSpeechRate(newRate);
    // If currently speaking, update the rate immediately
    if (isSpeaking) {
      setSpeechRate(newRate);
    }
  };
  
  // Replace the playAudioResponse function with a simpler, more reliable approach
  const playAudioResponse = async (text: string) => {
    if (!text || !isConnected) return;
    
    console.log('Starting text-to-speech, length:', text.length);
    
    // Use the safe wrapper function
    safelySpeakText(text);
  };
  
  // Function to stop speaking immediately
  const stopSpeaking = () => {
    if ('speechSynthesis' in window && isSpeaking) {
      stopSpeech();
      setIsSpeaking(false);
    }
  };
  
  const handleSendMessage = async (transcribedText?: string) => {
    let textToSend = '';
    
    // Prioritize the live transcript if it exists
    if (liveTranscript) {
      textToSend = liveTranscript;
    } else if (transcribedText) {
      textToSend = transcribedText;
    } else {
      textToSend = userInput;
    }
    
    if (!textToSend.trim()) return;
    
    // Add user message
    const newUserMessage: Message = {
      id: Date.now().toString(),
      content: textToSend.trim(),
      role: "user",
      timestamp: new Date()
    };
    
    setMessages((prev) => [...prev, newUserMessage]);
    setUserInput("");
    setTranscript("");
    setLiveTranscript("");
    setIsLoading(true);
    
    // Save the user message to session storage
    const sessionData = JSON.parse(sessionStorage.getItem('interviewSession') || '{}');
    if (sessionData?.id) {
      try {
        // Save to session storage
        const historyJson = sessionStorage.getItem('interviewHistory') || '[]';
        const history = JSON.parse(historyJson);
        
        // Find the current session
        const sessionIndex = history.findIndex((item: any) => item.id === sessionData.id);
        if (sessionIndex !== -1) {
          // Add message to history
          if (!history[sessionIndex].messages) {
            history[sessionIndex].messages = [];
          }
          history[sessionIndex].messages.push({
            id: newUserMessage.id,
            content: newUserMessage.content,
            role: 'user',
            timestamp: new Date().toISOString()
          });
          sessionStorage.setItem('interviewHistory', JSON.stringify(history));
        }
      } catch (e) {
        console.error('Error saving message to session storage:', e);
      }
    }
    
    // AI is thinking - explicitly set thinking state for UX
    setIsThinking(true);
    setIsLoading(true);
    
    try {
      // Convert messages for AI format
      const aiMessages = messages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }));
      
      // Add the new user message
      aiMessages.push({
        role: 'user',
        content: newUserMessage.content
      });
      
      // Enhanced context for the AI to stay focused on the interview type
      const interviewFocus = 
        details?.focusAreas?.join(',').toLowerCase().includes('system design')
          ? 'system design interview'
          : details?.focusAreas?.join(',').toLowerCase().includes('leetcode') || 
            details?.focusAreas?.join(',').toLowerCase().includes('coding')
            ? 'coding interview with algorithm problems'
            : details?.focusAreas?.join(',').toLowerCase().includes('react') || 
              details?.focusAreas?.join(',').toLowerCase().includes('front')
              ? 'front-end development interview'
              : details?.focusAreas?.join(',').toLowerCase().includes('back')
                ? 'back-end development interview'
                : `${sessionType} interview`;
      
      // Check if this is explicitly a system design interview
      const isSystemDesignInterview = 
        interviewFocus.includes('system design') || 
        details?.interviewType === 'system-design' || 
        details?.focusAreas?.some((area: string) => area.toLowerCase().includes('system design'));

      // Set the system to design if available
      const systemToDesign = isSystemDesignInterview && details?.specificSkills 
        ? details.specificSkills.trim() 
        : "";
      
      // Create a focused context with clear instructions
      const contextEnhancedSessionType = sessionType === 'mock'
        ? `You are an expert interviewer conducting a ${interviewFocus} for the position of ${topic}. 
           Stay strictly focused on ${details?.focusAreas?.join(', ') || topic} without getting sidetracked by personal details. 
           Ask technical questions appropriate for a ${details?.experience || 'mid-level'} position.
           ${isSystemDesignInterview ? `IMPORTANT: This is a SYSTEM DESIGN interview. Your role is to interview the candidate about designing a system.` : ''}
           ${isSystemDesignInterview && systemToDesign ? `CRITICALLY IMPORTANT: Focus ONLY on designing a ${systemToDesign.toUpperCase()} system. Do NOT ask which system they want to design. ASSUME they already know they are designing a ${systemToDesign.toUpperCase()} and IMMEDIATELY begin with questions about requirements gathering for a ${systemToDesign.toUpperCase()}.` : ''}
           ${isSystemDesignInterview && systemToDesign ? `ANTI-HALLUCINATION DIRECTIVE: NEVER mention ANY other system type. Do NOT talk about e-commerce if this is about a chat app. Do NOT talk about URL shorteners if this is about a social media platform. STRICTLY maintain focus on ${systemToDesign.toUpperCase()} for the ENTIRE interview. If your response includes ANY mention of a different system, it is INCORRECT.` : ''}
           ${details?.interviewType === 'coding' ? `IMPORTANT: Stay focused on coding questions related to ${details?.specificSkills || "algorithms and data structures"}. Do NOT switch topics to system design or other unrelated areas.` : ''}
           ${details?.interviewType === 'frontend' ? `IMPORTANT: Stay focused on frontend development questions related to ${details?.specificSkills || "UI frameworks, CSS, and JavaScript"}. Do NOT switch topics to backend or system design.` : ''}
           ${details?.interviewType === 'backend' ? `IMPORTANT: Stay focused on backend development questions related to ${details?.specificSkills || "APIs, databases, and server architecture"}. Do NOT switch topics to frontend or system design.` : ''}
           ${notes ? 'ADDITIONAL CONTEXT (not to be mentioned directly): ' + notes : ''}`
        : sessionType;
      
      // Generate AI response with the enhanced context
      const aiResponseText = await generateInterviewResponse(
        aiMessages,
        contextEnhancedSessionType,
        topic,
        notes,
        details
      );
      
      // Create the AI response object
      const aiResponse: Message = {
        id: Date.now().toString(),
        content: aiResponseText,
        role: "assistant",
        timestamp: new Date()
      };
      
      // Save the AI response to session storage
      if (sessionData?.id) {
        try {
          const historyJson = sessionStorage.getItem('interviewHistory') || '[]';
          const history = JSON.parse(historyJson);
          
          // Find the current session
          const sessionIndex = history.findIndex((item: any) => item.id === sessionData.id);
          if (sessionIndex !== -1) {
            // Add message to history
            if (!history[sessionIndex].messages) {
              history[sessionIndex].messages = [];
            }
            history[sessionIndex].messages.push({
              id: aiResponse.id,
              content: aiResponseText,
              role: 'assistant',
              timestamp: new Date().toISOString()
            });
            sessionStorage.setItem('interviewHistory', JSON.stringify(history));
          }
        } catch (e) {
          console.error('Error saving AI message to session storage:', e);
        }
      }
      
      // Start typing effect instead of showing the full message
      setTypingComplete(false);
      setTypingText({ id: aiResponse.id, text: "" });
      
      // Add AI response to messages but with empty content initially
      const initialResponse = {
        ...aiResponse,
        content: ""
      };
      setMessages((prev) => [...prev, initialResponse]);
      
      // Start the typing effect
      let charIndex = 0;
      const textToType = aiResponseText;
      
      // Clear any existing typing timer
      if (typingTimerRef.current) {
        clearInterval(typingTimerRef.current);
      }
      
      typingTimerRef.current = setInterval(() => {
        if (charIndex < textToType.length) {
          charIndex++;
          const currentText = textToType.substring(0, charIndex);
          setTypingText({ id: aiResponse.id, text: currentText });
          
          // Update the message with the current text
          setMessages(prev => 
            prev.map(msg => 
              msg.id === aiResponse.id 
                ? { ...msg, content: currentText } 
                : msg
            )
          );
        } else {
          // Typing is complete
          clearInterval(typingTimerRef.current!);
          setTypingComplete(true);
          setTypingText(null);
          
          // Ensure the message has the full content
          setMessages(prev => 
            prev.map(msg => 
              msg.id === aiResponse.id 
                ? { ...msg, content: textToType } 
                : msg
            )
          );
        }
      }, typingSpeedRef.current);
      
      // Play audio feedback for the AI response
      setIsThinking(false);
      setIsLoading(false);
      
      // Use setTimeout to give the UI a chance to update before starting speech
      setTimeout(() => {
        try {
          // Make sure any ongoing speech is stopped
          if (window.speechSynthesis && window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
          }
          
          // Force re-initialize voice capabilities before speaking
          forceVoiceInit().then(() => {
            // Now play the new response with a retry mechanism
            safelySpeakText(aiResponseText);
          });
        } catch (error) {
          console.error('Error in speech preparation:', error);
        }
      }, 800); // Longer delay for UI to fully update
    } catch (error) {
      console.error("Error generating AI response:", error);
      
      // Add error message
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: "I'm sorry, I'm having trouble responding right now. Let's continue our conversation.",
        role: "assistant",
        timestamp: new Date()
      };
      
      setMessages((prev) => [...prev, errorMessage]);
      setIsThinking(false);
      setIsLoading(false);
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const handleEndInterview = async () => {
    // Don't allow multiple clicks on end button
    if (isEndingInterview) return;
    setIsEndingInterview(true);
    
    // Stop any ongoing speech
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    
    // Stop any ongoing recording
    if (audioRecorder && audioRecorder.state === 'recording') {
      audioRecorder.stop();
    }
    
    // Stop the timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    const aiMessages = messages.map(msg => ({
      role: msg.role as 'user' | 'assistant', 
      content: msg.content
    }));
    
    try {
      setIsThinking(true);
      
      // Generate feedback using the API
      const feedback = await generateInterviewFeedback(
        aiMessages,
        sessionType,
        topic
      );
      
      // Save feedback to Convex
      const sessionData = JSON.parse(sessionStorage.getItem('interviewSession') || '{}');
      if (sessionData?.id) {
        try {
          await fetch('/api/save-feedback', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              interviewId: sessionData.id,
              feedback,
            }),
          });
        } catch (e) {
          console.error('Error saving feedback:', e);
        }
      }
      
      onEnd(feedback);
    } catch (error) {
      console.error("Error generating feedback:", error);
      
      // Fallback feedback if there's an error
      const fallbackFeedback = {
        summary: `You participated in this ${sessionType} about ${topic}.`,
        strengths: [
          `Engaged in the ${sessionType}`,
          "Provided responses to questions",
          "Completed the session"
        ],
        improvements: [
          "Technical issues prevented detailed feedback",
          "Try another session with a different connection",
          "Consider trying a different topic"
        ]
      };
      
      // Try to save fallback feedback
      const sessionData = JSON.parse(sessionStorage.getItem('interviewSession') || '{}');
      if (sessionData?.id) {
        try {
          await fetch('/api/save-feedback', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              interviewId: sessionData.id,
              feedback: fallbackFeedback,
            }),
          });
        } catch (e) {
          console.error('Error saving fallback feedback:', e);
        }
      }
      
      onEnd(fallbackFeedback);
    } finally {
      setIsThinking(false);
      setIsEndingInterview(false);
    }
  };
  
  const handleConnect = () => {
    setupAudioRecording();
    // Test voice immediately after connecting
    setTimeout(() => {
      testVoice();
    }, 500);
  };
  
  // Render message with proper markdown formatting
  const renderMessage = (message: Message) => {
    // Function to format text - replace asterisks with proper styling
    const formatText = (text: string) => {
      // Replace markdown-style formatting with HTML
      const formatted = text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
        .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
        .replace(/###\s+(.*?)(\n|$)/g, '<h3 class="text-lg font-semibold mt-2 mb-1">$1</h3>') // H3 headers
        .replace(/\n/g, '<br>'); // Line breaks
        
      return (
        <div 
          className={cn("text-sm", message.role === "assistant" ? "text-gray-800" : "text-white")}
          dangerouslySetInnerHTML={{ __html: formatted }}
        />
      );
    };
      
    return (
      <div
        key={message.id}
        className={cn(
          "flex items-start gap-3 p-4 rounded-lg max-w-[85%] mb-3",
          message.role === "assistant"
            ? "self-start bg-gray-100"
            : "self-end bg-indigo-600 text-white"
        )}
      >
        {message.role === "assistant" && (
          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-xl">
            {sessionType === "topic" ? "👩‍🏫" : "👩‍💼"}
          </div>
        )}
        <div className="flex flex-col">
          {formatText(message.content)}
          <div className={cn("text-xs mt-1", 
            message.role === "assistant" ? "text-gray-500" : "text-indigo-100"
          )}>
            {message.timestamp.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
        {message.role === "user" && (
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-xl">
            👤
          </div>
        )}
      </div>
    );
  };
  
  const getSessionTitle = () => {
    switch (sessionType) {
      case "topic":
        return `Topic Lecture: ${topic}`;
      case "qa":
        return `Q&A Session: ${topic}`;
      case "language":
        return `Language Practice: ${topic}`;
      default:
        return `Interview: ${topic}`;
    }
  };
  
  const sendToAI = async (userMessages: Message[]): Promise<string> => {
    // Only the most recent 15 messages to keep context reasonably sized
    const recentMessages = userMessages.slice(-15);
    
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: recentMessages,
          interviewType: sessionType,
          topic,
          action: 'response',
          notes,
          details,
          // Add explicit request for larger max_tokens to prevent truncation
          max_tokens: 1000
        }),
      });
      
      if (!response.ok) {
        throw new Error(`AI response error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('Error getting AI response:', error);
      return "I apologize, but I'm experiencing technical difficulties. Let's try again.";
    }
  };
  
  // Clean up typing effect on unmount
  useEffect(() => {
    return () => {
      if (typingTimerRef.current) {
        clearInterval(typingTimerRef.current);
      }
    };
  }, []);
  
  return (
    <div className={cn("flex flex-col h-full bg-white rounded-xl shadow-lg overflow-hidden", className)}>
      <div className="p-4 border-b flex justify-between items-center bg-indigo-50">
        <h2 className="text-lg font-medium text-indigo-800">
          {getSessionTitle()}
        </h2>
        <div className="flex items-center gap-3">
          {isConnected && (
            <>
              {/* Speech rate controls - Updated with simpler options */}
              <div className="flex items-center space-x-2">
                <div className="flex items-center">
                  <span className="text-xs text-gray-700 mr-1 font-medium">Speed:</span>
                  <select
                    value={speechRate}
                    onChange={(e) => handleSpeechRateChange(parseFloat(e.target.value))}
                    className="text-xs bg-indigo-100 border border-indigo-200 rounded px-2 py-1 text-gray-800"
                  >
                    <option value="0.8">Slow</option>
                    <option value="1.0">Normal</option>
                    <option value="1.3">Fast</option>
                  </select>
                </div>
              </div>
            
              <div className="flex items-center gap-1 text-indigo-700 font-medium">
                <ClockIcon className="h-4 w-4" />
                <span>{formatTime(interviewTime)}</span>
              </div>
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleEndInterview}
            disabled={isEndingInterview || !isConnected}
            className={cn(
              "text-gray-500 hover:text-gray-700",
              isEndingInterview && "opacity-50 cursor-not-allowed"
            )}
          >
            <XMarkIcon className="w-5 h-5" />
          </Button>
        </div>
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        <div className="w-2/3 border-r flex flex-col">
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex flex-col space-y-1 p-4 h-full overflow-y-auto">
              {messages.map(renderMessage)}
              
              {/* Add thinking indicator that appears at the bottom of the chat */}
              {isThinking && (
                <div className="self-start bg-gray-100 p-3 rounded-lg flex items-center space-x-2 animate-pulse">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-lg">
                    {sessionType === "topic" ? "👩‍🏫" : "👩‍💼"}
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                    <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                    <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                  </div>
                  <span className="text-sm text-gray-500">Thinking...</span>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t">
              {!isConnected ? (
                <div className="w-full h-[600px] flex flex-col items-center justify-center p-6">
                  <h1 className="text-2xl font-bold mb-4">{getSessionTitle()}</h1>
                  <p className="text-lg mb-8">{messages[0]?.content}</p>
                  <div className="flex flex-col space-y-4">
                    <Button 
                      onClick={handleConnect} 
                      className="px-8 py-4"
                    >
                      Connect
                    </Button>
                    <Button 
                      onClick={testVoice} 
                      className="px-8 py-2 bg-gray-700 hover:bg-gray-600"
                      disabled={isSpeaking}
                    >
                      {isSpeaking ? "Testing Voice..." : "Test Voice"}
                    </Button>
                    {isSpeaking && (
                      <div className="flex flex-col items-center space-y-2 mt-2">
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-sm">Speaking now... You should hear audio</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          If you don't hear anything, check your system volume and browser permissions.
                          <br />
                          Speech synthesis works best in Chrome and Safari.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {transcript && (
                    <div className="mb-2 p-2 bg-gray-50 rounded text-sm text-gray-700">
                      <p className="font-semibold text-xs mb-1">Transcript:</p>
                      {transcript}
                    </div>
                  )}
                  {liveTranscript && (
                    <div className="mb-2 p-2 bg-gray-50 border border-indigo-100 rounded text-sm text-gray-700">
                      <p className="font-semibold text-xs mb-1 flex items-center">
                        <span className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse mr-1"></span>
                        Live Transcript:
                      </p>
                      {liveTranscript}
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <textarea
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder={isListening ? "Listening..." : isSpeaking ? "AI is speaking..." : isLoading ? "Processing..." : "Type your response..."}
                      className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      rows={2}
                      disabled={isLoading || isListening || isSpeaking}
                    />
                    <div className="flex flex-col space-y-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={isListening ? "destructive" : "default"}
                        onClick={isListening ? stopListening : startListening}
                        disabled={isLoading || !audioRecorder || isSpeaking}
                        className={cn(
                          "rounded-full w-10 h-10 p-0 flex items-center justify-center",
                          isListening ? "animate-pulse bg-red-500" : "",
                          isSpeaking ? "opacity-50 cursor-not-allowed" : "",
                          isLoading && !isListening ? "opacity-50 cursor-not-allowed bg-yellow-500" : ""
                        )}
                      >
                        {isListening ? (
                          <PauseIcon className="w-5 h-5" />
                        ) : isLoading && !isListening ? (
                          // Show a loading spinner when processing but not listening
                          <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <MicrophoneIcon className="w-5 h-5" />
                        )}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="w-1/3 p-6 flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center text-5xl mb-4">
              {sessionType === "topic" ? "👩‍🏫" : "👩‍💼"}
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              {isThinking ? "Thinking..." : isSpeaking ? "Speaking..." : sessionType === "topic" ? "Joanna" : "Joanna"}
            </h3>
            <p className="text-sm text-gray-700 text-center font-medium">
              {isThinking
                ? "Analyzing your response..."
                : isSpeaking
                ? "Please wait until I finish speaking"
                : isConnected
                ? `I'm here to ${sessionType === "topic" ? "teach" : sessionType === "qa" ? "quiz" : "interview"} you about ${topic}`
                : "Click 'Connect' to start our session"}
            </p>
            
            {(isThinking || isSpeaking) && (
              <div className="mt-4 flex space-x-2">
                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
              </div>
            )}
            
            {isSpeaking && (
              <div className="mt-4 flex flex-col items-center">
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-gray-700 font-medium">Speaking Rate:</span>
                  <select 
                    value={speechRate}
                    onChange={(e) => handleSpeechRateChange(parseFloat(e.target.value))}
                    className="text-xs border border-gray-300 rounded p-1 bg-white text-gray-800"
                  >
                    <option value="0.8">0.8x</option>
                    <option value="1.0">1.0x</option>
                    <option value="1.2">1.2x</option>
                    <option value="1.5">1.5x</option>
                    <option value="2.0">2.0x</option>
                  </select>
                </div>
              </div>
            )}
            
            {isConnected && !isThinking && !isSpeaking && (
              <Button
                onClick={handleEndInterview}
                disabled={isEndingInterview}
                className={cn(
                  "mt-6 bg-indigo-100 hover:bg-indigo-200 text-indigo-800 px-6 py-2 rounded-lg shadow-sm font-medium",
                  isEndingInterview && "opacity-50 cursor-not-allowed"
                )}
              >
                End Session & Get Feedback
              </Button>
            )}
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-20 right-4 flex flex-col items-end space-y-2">
        {isConnected && (
          <>
            {/* Speaking indicator with stop button */}
            {isSpeaking && (
              <div className="bg-white/90 backdrop-blur-md p-2 rounded-lg shadow-md flex items-center space-x-2 border border-gray-200">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium text-gray-800">Speaking</span>
                </div>
                <Button 
                  onClick={stopSpeaking} 
                  size="sm" 
                  variant="ghost" 
                  className="h-6 w-6 p-0 rounded-full"
                >
                  <StopIcon className="h-3 w-3 text-gray-600" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
} 