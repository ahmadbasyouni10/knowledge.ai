"use client";

import { useEffect } from 'react';

interface SessionHistoryManagerProps {
  interviewId?: string;
  type?: string;
  topic?: string;
}

export function SessionHistoryManager({ interviewId, type, topic }: SessionHistoryManagerProps) {
  useEffect(() => {
    // Only run this if all required data is provided
    if (interviewId && type && topic) {
      try {
        // Add a new interview to the history
        const historyRecord = {
          id: interviewId,
          type: type,
          topic: topic,
          date: new Date().toISOString(),
        };
        
        // Get existing history
        const historyJson = sessionStorage.getItem('interviewHistory') || '[]';
        const history = JSON.parse(historyJson);
        
        // Check if the interview already exists
        const existingIndex = history.findIndex((item: any) => item.id === interviewId);
        
        if (existingIndex === -1) {
          // Add to the beginning
          history.unshift(historyRecord);
          
          // Keep only the most recent 10 sessions
          const limitedHistory = history.slice(0, 10);
          
          // Save back to session storage
          sessionStorage.setItem('interviewHistory', JSON.stringify(limitedHistory));
          
          console.log('Added interview to history:', interviewId);
        } else {
          console.log('Interview already exists in history:', interviewId);
        }
      } catch (error) {
        console.error('Error saving to session history:', error);
      }
    }
  }, [interviewId, type, topic]);

  // This component doesn't render anything
  return null;
} 