export type Message = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

// Client-side version of the AI functions

// Generate an AI response (client-side function that calls the API)
export async function generateInterviewResponse(
  messages: Message[],
  interviewType: string,
  topic: string
): Promise<string> {
  try {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        interviewType,
        topic,
        action: 'response',
      }),
    });

    if (!response.ok) {
      throw new Error(`AI response error: ${response.status}`);
    }

    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error('Error generating AI response:', error);
    return "I apologize, but I'm experiencing technical difficulties. Let's try again in a moment.";
  }
}

// Generate interview feedback (client-side function that calls the API)
export async function generateInterviewFeedback(
  messages: Message[],
  interviewType: string,
  topic: string
): Promise<{ summary: string; strengths: string[]; improvements: string[] }> {
  try {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        interviewType,
        topic,
        action: 'feedback',
      }),
      // Add timeout to prevent hanging requests
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    if (!response.ok) {
      throw new Error(`AI feedback error: ${response.status}`);
    }

    const data = await response.json();
    return data.feedback;
  } catch (error) {
    console.error('Error generating feedback:', error);
    
    // Return fallback feedback
    return {
      summary: "Session completed. There was an issue generating detailed feedback.",
      strengths: ["Completed the interview session"],
      improvements: ["Try another session"],
    };
  }
} 