import OpenAI from 'openai';
import 'dotenv/config';

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export type Message = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

// Generate an AI response
export async function generateInterviewResponse(
  messages: Message[],
  interviewType: string,
  topic: string,
  notes: string = '',
  details: any = {}
): Promise<string> {
  try {
    // Determine system prompt based on interview type
    let systemPrompt = "";
    
    if (interviewType === "mock") {
      // Extract useful information from details
      const interviewFocus = details?.focusAreas?.length > 0 ? details.focusAreas[0] : '';
      const specificSkills = details?.specificSkills || '';
      const experienceLevel = details?.experience || '';
      
      // Base prompt for mock interviews
      systemPrompt = `You are an expert interviewer for the position of ${topic}. 
      Ask challenging but fair questions, follow up on answers, and provide a realistic interview experience.
      Keep responses concise and focused. Dive deeper when the user gives shallow responses.`;
      
      // Add specific focus if available
      if (interviewFocus.includes('system design')) {
        systemPrompt += `\nThis is specifically a system design interview. Ask about architecture, scalability, tradeoffs, and database design. 
        Make the candidate do calculations about system requirements, storage, and throughput.`;
      } else if (interviewFocus.includes('coding') || interviewFocus.includes('algorithm')) {
        systemPrompt += `\nThis is specifically a coding algorithm interview. Focus on algorithm complexity, efficiency, and problem-solving approach.
        DO NOT ask the candidate to actually code during this interview, as they don't have an IDE available. Instead, discuss approaches, time complexity, and trade-offs.`;
      } else if (interviewFocus.includes('graph')) {
        systemPrompt += `\nThis is specifically a graph algorithms interview. Focus on graph theory concepts, different graph algorithms, time/space complexity, and applications.
        Ask about BFS, DFS, Dijkstra, topological sort, minimum spanning trees, etc. Challenge them on optimizations and edge cases.`;
      }
      
      // Add any interviewer notes as context without directly mentioning them to the interviewee
      if (notes) {
        systemPrompt += `\n\nINTERVIEWER NOTES (Private context for you, DO NOT mention these directly to the candidate): ${notes}`;
      }
    } else if (interviewType === "topic") {
      systemPrompt = `You are an expert educator on ${topic}. 
      Provide clear explanations, examples, and ask questions to check understanding.
      Structure your teaching in a logical progression from basic to advanced concepts.`;
      
      if (notes) {
        systemPrompt += `\n\nADDITIONAL CONTEXT (Use this to enhance your teaching, but don't directly reference it): ${notes}`;
      }
    } else if (interviewType === "qa") {
      systemPrompt = `You are an expert testing knowledge on ${topic}. 
      Ask questions that test both factual recall and deeper understanding.
      Provide feedback on answers, correct misconceptions, and build on what the user knows.`;
      
      if (notes) {
        systemPrompt += `\n\nQUESTION FOCUS (Use this to guide your questions, without directly referencing): ${notes}`;
      }
    } else {
      systemPrompt = `You are an expert conversationalist on ${topic}.
      Engage in thoughtful discussion, ask probing questions, and share insights.`;
      
      if (notes) {
        systemPrompt += `\n\nCONVERSATION GUIDANCE (Use this for context, but don't reference directly): ${notes}`;
      }
    }
    
    // Add system message to the beginning if not already present
    const fullMessages: Message[] = messages[0]?.role === 'system' 
      ? messages 
      : [{ role: 'system', content: systemPrompt }, ...messages];
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: fullMessages,
      temperature: 0.7,
      max_tokens: 500,
    });
    
    return completion.choices[0].message.content || "I'm sorry, I couldn't generate a response.";
  } catch (error) {
    console.error('Error generating AI response:', error);
    return "I apologize, but I'm experiencing technical difficulties. Let's try again in a moment.";
  }
}

// Generate interview feedback
export async function generateInterviewFeedback(
  messages: Message[],
  interviewType: string,
  topic: string
): Promise<{ summary: string; strengths: string[]; improvements: string[] }> {
  try {
    const systemPrompt = `You are an expert at providing feedback on ${interviewType} interviews about ${topic}. 
    Analyze the conversation and provide constructive feedback with specific examples.
    Focus on strengths and areas for improvement.`;
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
        { 
          role: 'user', 
          content: `Please provide feedback on this ${interviewType} session about ${topic}. 
          Format your response as JSON with the following structure:
          {
            "summary": "Overall session summary",
            "strengths": ["strength 1", "strength 2", "strength 3"],
            "improvements": ["area for improvement 1", "area for improvement 2", "area for improvement 3"]
          }`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });
    
    const feedbackText = completion.choices[0].message.content || "";
    
    try {
      const feedback = JSON.parse(feedbackText);
      return {
        summary: feedback.summary || "Session completed successfully.",
        strengths: feedback.strengths || ["Good engagement"],
        improvements: feedback.improvements || ["Continue practicing"],
      };
    } catch (error) {
      console.error('Error parsing feedback JSON:', error);
      return {
        summary: "Session completed successfully. The AI was unable to structure detailed feedback.",
        strengths: ["Participation in the full session"],
        improvements: ["Try another session for more specific feedback"],
      };
    }
  } catch (error) {
    console.error('Error generating AI feedback:', error);
    return {
      summary: "Session completed. There was an issue generating detailed feedback.",
      strengths: ["Completed the interview session"],
      improvements: ["Try another session"],
    };
  }
} 