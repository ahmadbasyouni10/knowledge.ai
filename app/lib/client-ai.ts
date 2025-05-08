import { Message } from '../api/ai/route';

// Client-side function to generate AI response
export async function generateInterviewResponse(
  messages: Message[],
  interviewType: string,
  topic: string,
  notes: string = '',
  details: Record<string, any> = {},
  options: Record<string, any> = {}
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
        notes,
        details,
        max_tokens: options.max_tokens || 1000, // Increase max tokens to prevent truncation
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to generate response: ${response.status}`);
    }

    const data = await response.json();
    return data.response || "I apologize, but I'm having trouble responding at the moment.";
  } catch (error) {
    console.error('Error generating AI response:', error);
    return "I apologize, but I'm experiencing technical difficulties. Please try again.";
  }
}

// Client-side function to generate interview feedback
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
        max_tokens: 1000, // Ensure feedback isn't truncated
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to generate feedback: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.feedback) {
      throw new Error('No feedback data returned');
    }
    
    return data.feedback;
  } catch (error) {
    console.error('Error generating interview feedback:', error);
    
    // Return basic feedback as a fallback
    return {
      summary: "The session was completed, but we were unable to generate detailed feedback.",
      strengths: ["Participation in the interview"],
      improvements: ["Try another session for more specific feedback"],
    };
  }
} 