import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import 'dotenv/config';

// Initialize the OpenAI client on the server side
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export type Message = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export async function POST(request: NextRequest) {
  try {
    const { messages, interviewType, topic, action, notes: _ = '', details: __ = {} } = await request.json();
    
    if (action === 'response') {
      const response = await generateInterviewResponse(messages, interviewType, topic, '', {});
      return NextResponse.json({ response });
    } else if (action === 'feedback') {
      const feedback = await generateInterviewFeedback(messages, interviewType, topic);
      return NextResponse.json({ feedback });
    } else {
      return NextResponse.json({ error: 'Invalid action specified' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in AI API:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

// Generate an AI response
async function generateInterviewResponse(
  messages: Message[],
  interviewType: string,
  topic: string,
  notes: string,
  details: Record<string, string>
): Promise<string> {
  try {
    // Determine system prompt based on interview type
    let systemPrompt = "";
    
    // Extract additional notes from the interviewType string
    let additionalNotes = "";
    if (interviewType.includes('ADDITIONAL CONTEXT')) {
      const match = interviewType.match(/ADDITIONAL CONTEXT \(not to be mentioned directly\): (.*)/);
      if (match && match[1]) {
        additionalNotes = match[1].trim();
        // Remove the additional context from the interview type
        interviewType = interviewType.replace(/ADDITIONAL CONTEXT \(not to be mentioned directly\): .*/, '').trim();
      }
    }
    
    // User-specific focus areas from the additionalNotes
    const hasFocusOnGraphs = additionalNotes.toLowerCase().includes('graph') || 
                             additionalNotes.toLowerCase().includes('trees') ||
                             additionalNotes.toLowerCase().includes('data structures');
                             
    const hasFocusOnSystemDesign = additionalNotes.toLowerCase().includes('system design') || 
                                  additionalNotes.toLowerCase().includes('architecture') ||
                                  additionalNotes.toLowerCase().includes('scaling');
                                  
    const hasFocusOnCoding = additionalNotes.toLowerCase().includes('coding') || 
                             additionalNotes.toLowerCase().includes('algorithm') ||
                             additionalNotes.toLowerCase().includes('leetcode');
                             
    const hasFocusOnFrontend = additionalNotes.toLowerCase().includes('frontend') || 
                               additionalNotes.toLowerCase().includes('react') ||
                               additionalNotes.toLowerCase().includes('ui');
                               
    const hasFocusOnBackend = additionalNotes.toLowerCase().includes('backend') || 
                              additionalNotes.toLowerCase().includes('api') ||
                              additionalNotes.toLowerCase().includes('database');
                              
    const shouldAvoidCoding = additionalNotes.toLowerCase().includes('avoid coding') || 
                              additionalNotes.toLowerCase().includes('no code') ||
                              additionalNotes.toLowerCase().includes('don\'t ask to code');
    
    if (interviewType.includes('system design') || hasFocusOnSystemDesign) {
      systemPrompt = `You are an expert technical interviewer specializing in system design interviews for ${topic} positions.
      
      IMPORTANT INSTRUCTIONS:
      1. Focus ONLY on system design questions and concepts. Do not get distracted by personal topics.
      2. Ask challenging but fair system design questions that assess the candidate's ability to design scalable systems.
      3. Start with a specific system design problem (like designing a URL shortener, social media platform, etc.)
      4. Ask follow-up questions on scalability, database choice, caching strategies, load balancing, etc.
      5. Provide constructive feedback on design decisions.
      6. Keep your responses concise and professional. Maintain focus on technical system design assessment.
      7. Ignore personal details unless directly relevant to technical experience.
      8. If the candidate tries to discuss unrelated topics, gently steer the conversation back to system design.
      9. Evaluate their thought process, not just their final answers.
      10. Be direct and to the point in your responses. Avoid unnecessary explanations.
      11. Stay in interview mode - maintain professionalism throughout.
      12. DO NOT ask them to code or write code. Focus only on design discussions.
      `;
    } else if (interviewType.includes('coding') || hasFocusOnCoding) {
      systemPrompt = `You are an expert technical interviewer specializing in coding and algorithm interviews for ${topic} positions.
      
      IMPORTANT INSTRUCTIONS:
      1. Focus ONLY on coding problems, algorithms, and data structures. Do not get distracted by personal topics.
      2. Ask challenging but fair coding questions that assess problem-solving skills.
      3. Pose algorithmic problems similar to those on LeetCode or in technical interviews.
      4. Ask for time and space complexity analysis.
      5. Ask follow-up questions about optimization approaches.
      6. Keep your responses concise and professional. Maintain focus on technical assessment.
      7. Ignore personal details unless directly relevant to technical experience.
      8. If the candidate tries to discuss unrelated topics, gently steer the conversation back to algorithms and code.
      9. Evaluate their thought process, not just their final answers.
      10. Be direct and to the point in your responses. Avoid unnecessary explanations.
      11. Stay in interview mode - maintain professionalism throughout.
      ${shouldAvoidCoding ? "12. DO NOT ask them to write actual code. Focus on verbal descriptions of algorithms and approaches instead." : ""}
      ${hasFocusOnGraphs ? "13. Focus primarily on graph algorithms, tree traversals, and related data structures." : ""}
      `;
    } else if (interviewType.includes('front-end') || hasFocusOnFrontend) {
      systemPrompt = `You are an expert technical interviewer specializing in front-end development for ${topic} positions.
      
      IMPORTANT INSTRUCTIONS:
      1. Focus ONLY on front-end technologies and concepts like React, Angular, Vue, CSS, HTML, JavaScript, etc.
      2. Ask challenging but fair questions about UI/UX, component design, state management, and front-end best practices.
      3. Ask specific questions about how they would implement certain UI features.
      4. Ask about performance optimization for front-end applications.
      5. Keep your responses concise and professional. Maintain focus on technical assessment.
      6. Ignore personal details unless directly relevant to technical experience.
      7. If the candidate tries to discuss unrelated topics, gently steer the conversation back to front-end development.
      8. Evaluate their thought process, not just their final answers.
      9. Be direct and to the point in your responses. Avoid unnecessary explanations.
      10. Stay in interview mode - maintain professionalism throughout.
      ${shouldAvoidCoding ? "11. DO NOT ask them to write actual code. Focus on concepts and approaches instead." : ""}
      `;
    } else if (interviewType.includes('back-end') || hasFocusOnBackend) {
      systemPrompt = `You are an expert technical interviewer specializing in back-end development for ${topic} positions.
      
      IMPORTANT INSTRUCTIONS:
      1. Focus ONLY on back-end technologies and concepts like APIs, databases, server architecture, etc.
      2. Ask challenging but fair questions about database design, API architecture, and back-end best practices.
      3. Ask specific questions about how they would implement certain server-side features.
      4. Ask about performance optimization and scaling strategies.
      5. Keep your responses concise and professional. Maintain focus on technical assessment.
      6. Ignore personal details unless directly relevant to technical experience.
      7. If the candidate tries to discuss unrelated topics, gently steer the conversation back to back-end development.
      8. Evaluate their thought process, not just their final answers.
      9. Be direct and to the point in your responses. Avoid unnecessary explanations.
      10. Stay in interview mode - maintain professionalism throughout.
      ${shouldAvoidCoding ? "11. DO NOT ask them to write actual code. Focus on concepts and approaches instead." : ""}
      `;
    } else if (interviewType.includes('mock')) {
      systemPrompt = `You are an expert interviewer for the position of ${topic}. 
      
      IMPORTANT INSTRUCTIONS:
      1. Ask challenging but relevant technical questions related to ${topic}.
      2. Focus on technical skills and experience, not personal interests.
      3. Dive deeper with follow-up questions related to their technical answers.
      4. If the candidate mentions personal details, acknowledge briefly but return to technical assessment.
      5. Keep responses concise and professional.
      6. Ask questions that require specific technical knowledge, not general conversation.
      7. Evaluate critical thinking and problem-solving skills.
      8. Maintain a professional tone throughout the interview.
      9. Be direct and to the point in your responses. Avoid unnecessary explanations.
      10. Stay in interview mode - maintain professionalism throughout.
      ${shouldAvoidCoding ? "11. DO NOT ask them to write actual code. Focus on verbal descriptions of approaches instead." : ""}
      ${hasFocusOnGraphs ? "12. Focus primarily on graph algorithms, tree traversals, and related data structures." : ""}
      `;
    } else if (interviewType === "topic") {
      systemPrompt = `You are an expert educator on ${topic}. 
      Provide clear explanations, examples, and ask questions to check understanding.
      Structure your teaching in a logical progression from basic to advanced concepts.
      Keep explanations concise and accessible.`;
    } else if (interviewType === "qa") {
      systemPrompt = `You are an expert testing knowledge on ${topic}. 
      Ask questions that test both factual recall and deeper understanding.
      Provide brief feedback on answers, correct misconceptions, and build on what the user knows.
      Keep your questions focused and precise.`;
    } else {
      systemPrompt = `You are an expert conversationalist on ${topic}.
      Engage in thoughtful discussion, ask probing questions, and share insights.
      Keep your responses concise and on-topic.`;
    }
    
    // Add the additional notes to the system prompt if they exist
    if (additionalNotes) {
      systemPrompt += `\n\nADDITIONAL CONTEXT (DO NOT MENTION DIRECTLY): ${additionalNotes}\n`;
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
async function generateInterviewFeedback(
  messages: Message[],
  interviewType: string,
  topic: string
): Promise<{ summary: string; strengths: string[]; improvements: string[] }> {
  try {
    let systemPrompt = "";
    
    if (interviewType.includes('system design')) {
      systemPrompt = `You are an expert at providing feedback on system design interviews about ${topic}. 
      Analyze the conversation and provide constructive technical feedback focused on system design skills.
      Address their approach to scalability, database choices, caching strategies, and overall architecture.`;
    } else if (interviewType.includes('coding')) {
      systemPrompt = `You are an expert at providing feedback on coding interviews about ${topic}. 
      Analyze the conversation and provide constructive technical feedback focused on algorithm and problem-solving skills.
      Address their approach to time/space complexity, code organization, and optimization strategies.`;
    } else if (interviewType.includes('front-end')) {
      systemPrompt = `You are an expert at providing feedback on front-end development interviews about ${topic}. 
      Analyze the conversation and provide constructive technical feedback focused on UI/UX, component design, and front-end best practices.`;
    } else if (interviewType.includes('back-end')) {
      systemPrompt = `You are an expert at providing feedback on back-end development interviews about ${topic}. 
      Analyze the conversation and provide constructive technical feedback focused on API design, database modeling, and server architecture.`;
    } else {
      systemPrompt = `You are an expert at providing feedback on ${interviewType} sessions about ${topic}. 
      Analyze the conversation and provide constructive feedback with specific examples.
      Focus on strengths and areas for improvement.`;
    }
    
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