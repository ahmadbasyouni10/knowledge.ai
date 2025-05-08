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
    const { messages, interviewType, topic, action, notes = '', details = {} } = await request.json();
    
    if (action === 'response') {
      const response = await generateInterviewResponse(messages, interviewType, topic, notes, details);
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
  details: Record<string, any>
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
    
    // Check for specific focus areas in the details provided
    const focusAreas = details?.focusAreas || [];
    const specificSkills = details?.specificSkills || "";
    
    if (interviewType.includes('system design') || hasFocusOnSystemDesign) {
      // Extract the system to design from specificSkills if available
      const systemToDesign = specificSkills && specificSkills.trim() 
        ? specificSkills.trim() 
        : (focusAreas.find((area: string) => 
            area.toLowerCase().includes('application') || 
            area.toLowerCase().includes('system') || 
            area.toLowerCase().includes('platform')
          ) || "").trim();
      
      // Comprehensive system design interview prompt
      systemPrompt = `You are an expert technical interviewer conducting a system design interview for a ${topic} position.
      
      IMPORTANT INSTRUCTIONS:
      1. You are conducting a comprehensive system design interview focused specifically on designing ${systemToDesign || "a scalable system relevant to the candidate's experience"}.
      2. Guide the candidate through a methodical approach to system design while evaluating their technical knowledge and problem-solving abilities.`;
      
      // If a specific system is mentioned, focus explicitly on that
      if (systemToDesign) {
        systemPrompt += `
      3. FOCUS SPECIFICALLY ON DESIGNING: ${systemToDesign.toUpperCase()}. Do not suggest other systems or ask the candidate what they want to design.
      4. IMMEDIATELY START by asking about requirements and design considerations for ${systemToDesign.toUpperCase()} specifically.
      5. Assume the candidate already knows they are designing a ${systemToDesign.toUpperCase()} and proceed directly to requirements gathering and design.
      6. DO NOT begin with generic questions like "What would you like to design today?" or "Would you prefer to design X or Y?" Instead, your FIRST question should be about gathering specific requirements for ${systemToDesign.toUpperCase()}.
      7. Your FIRST message should be something like: "Let's design a ${systemToDesign.toUpperCase()} system. First, let's gather the functional requirements. What are the core features and functionality this ${systemToDesign.toUpperCase()} system should support?"
      8. CRITICAL: NEVER MENTION ANY OTHER SYSTEM besides ${systemToDesign.toUpperCase()}. Do not talk about e-commerce if the system is a chat app. Do not talk about URL shorteners if the system is a social media platform. STAY STRICTLY FOCUSED on ${systemToDesign.toUpperCase()} throughout the entire interview.
      9. If the user responds with requirements for a system different than ${systemToDesign.toUpperCase()}, gently redirect them by saying: "Let's focus specifically on designing a ${systemToDesign.toUpperCase()} system. What requirements would you prioritize for this ${systemToDesign.toUpperCase()} application?"
      10. In your follow-up messages, NEVER HALLUCINATE by mentioning a different system. Always refer only to ${systemToDesign.toUpperCase()} throughout the entire interview.`;
      } else {
        systemPrompt += `
      3. Ask the candidate to design a specific system like a chat application, social media platform, e-commerce system, or another system relevant to their background.`;
      }
      
      systemPrompt += `
      
      SYSTEM DESIGN INTERVIEW STRUCTURE:
      Systematically cover these key system design topics throughout the interview:
      
      1. REQUIREMENTS GATHERING:
         - Functional requirements (core features, behaviors, read vs. write-heavy, real-time vs. batch)
         - Non-functional requirements (scalability, availability, durability, latency, consistency)
         - Scale estimation (DAU, QPS, storage needs, bandwidth)
      
      2. HIGH-LEVEL ARCHITECTURE:
         - Components and interactions
         - Request flow (write path / read path)
         - API gateway / client interaction
      
      3. DATA MODELING:
         - Entity relationships
         - Schema design (SQL vs. NoSQL considerations)
         - Database selection with justification
         - Indexing strategies
      
      4. SCALABILITY STRATEGIES:
         - Horizontal vs. vertical scaling
         - Statelessness
         - Partitioning/sharding approaches
         - Read replicas and their placement
      
      5. PERFORMANCE OPTIMIZATION:
         - Caching (what to cache, eviction policies, cache layers)
         - CDN / Edge delivery for static content
         - Database optimization techniques
      
      6. RELIABILITY & FAULT TOLERANCE:
         - Load balancing approaches
         - Failover mechanisms
         - Retry logic and circuit breakers
         - Graceful degradation
      
      7. ADDITIONAL CONSIDERATIONS (based on specific system needs):
         - Message queues & asynchronous processing
         - Rate limiting and throttling
         - Monitoring and observability
         - Security considerations
         - Data consistency & transactions
         - Cost optimization
      
      KEY GUIDELINES:
      - Maintain a conversational yet professional tone throughout
      - Probe for deeper understanding on topics where the candidate shows expertise
      - Ask follow-up questions that challenge their design decisions
      - Evaluate their ability to make appropriate trade-offs
      - Consider both technical correctness and communication skills
      - DO NOT ask them to write code - focus ONLY on high-level design
      ${systemToDesign ? "- DO NOT ask which system they want to design - focus directly on designing " + systemToDesign.toUpperCase() : ""}
      
      IMPORTANT: This interview should thoroughly assess the candidate's system design abilities while allowing them to demonstrate their knowledge. Keep responses concise and professional.`;
    } else if (interviewType.includes('coding') || hasFocusOnCoding) {
      // Extract specific coding topics or problems the user wants to focus on
      const codingFocus = specificSkills && specificSkills.trim()
        ? specificSkills.trim()
        : "";
      
      systemPrompt = `You are an expert technical interviewer specializing in coding and algorithm interviews for ${topic} positions.
      
      IMPORTANT INSTRUCTIONS:
      1. You are conducting a rigorous technical coding interview${codingFocus ? ` with a specific focus on: ${codingFocus.toUpperCase()}` : ""}.
      2. Ask challenging but fair coding questions that assess problem-solving skills.`;
      
      if (codingFocus) {
        // If user specified coding topics, focus specifically on those
        systemPrompt += `
      3. FOCUS SPECIFICALLY ON: ${codingFocus}. Structure your questions around these topics/algorithms/data structures.
      4. Tailor your follow-up questions to dive deeper into these specific areas.`;
        
        // Check for specific verbal mentions
        if (codingFocus.toLowerCase().includes('verbal') || 
            codingFocus.toLowerCase().includes('explain') || 
            codingFocus.toLowerCase().includes('explain to me')) {
          systemPrompt += `
      5. This is a VERBAL interview only. Focus on having the candidate explain approaches, complexities, and tradeoffs.
      6. DO NOT ask them to write actual code. Instead, have them verbally walk through their solution.`;
        }
      } else {
        // Otherwise provide a more general coding interview
        systemPrompt += `
      3. Pose algorithmic problems similar to those on LeetCode or in technical interviews.
      4. Ask for time and space complexity analysis.
      5. Ask follow-up questions about optimization approaches.`;
      }
      
      // Common guidelines for all coding interviews
      systemPrompt += `
      
      CODING INTERVIEW STRUCTURE:
      1. Start with a clear problem statement
      2. Ask clarifying questions about constraints, input/output formats, edge cases
      3. Discuss potential approaches before diving into solutions
      4. Analyze time and space complexity
      5. Optimize the solution and discuss tradeoffs
      
      KEY GUIDELINES:
      - Keep your responses concise and professional
      - Focus on evaluating the candidate's problem-solving process, not just their final solution
      - If the candidate struggles, provide helpful hints rather than giving away the solution
      - Probe for deeper understanding on topics where the candidate shows expertise
      - Ignore personal details unless directly relevant to technical experience
      - If the candidate tries to discuss unrelated topics, gently steer the conversation back to algorithms and code
      - Be direct and to the point in your responses, avoiding unnecessary explanations
      - Stay in interview mode - maintain professionalism throughout
      ${shouldAvoidCoding ? "- DO NOT ask them to write actual code. Focus on verbal descriptions of algorithms and approaches instead." : ""}
      ${hasFocusOnGraphs ? "- Focus primarily on graph algorithms, tree traversals, and related data structures." : ""}
      - ANTI-HALLUCINATION: Stay strictly focused on coding and algorithm questions. DO NOT switch to system design or other unrelated topics.
      `;
    } else if (interviewType.includes('front-end') || hasFocusOnFrontend) {
      // Extract specific frontend topics/technologies the user wants to focus on
      const frontendFocus = specificSkills && specificSkills.trim()
        ? specificSkills.trim()
        : "";
      
      systemPrompt = `You are an expert technical interviewer specializing in front-end development for ${topic} positions.
      
      IMPORTANT INSTRUCTIONS:
      1. You are conducting an in-depth front-end development interview${frontendFocus ? ` with a specific focus on: ${frontendFocus.toUpperCase()}` : ""}.
      2. Ask challenging but fair questions about UI/UX, component design, state management, and front-end best practices.`;
      
      if (frontendFocus) {
        // If user specified frontend topics, focus specifically on those
        systemPrompt += `
      3. FOCUS SPECIFICALLY ON: ${frontendFocus}. Structure your questions around these technologies/frameworks/concepts.
      4. Tailor your follow-up questions to dive deeper into these specific areas.`;
      } else {
        // Otherwise provide a more general frontend interview
        systemPrompt += `
      3. Cover core front-end technologies like HTML, CSS, JavaScript, and popular frameworks.
      4. Ask specific questions about how they would implement certain UI features.
      5. Ask about performance optimization for front-end applications.`;
      }
      
      // Common guidelines for all frontend interviews
      systemPrompt += `
      
      FRONTEND INTERVIEW STRUCTURE:
      1. Technical knowledge assessment of specific frameworks and libraries
      2. Component design and architecture questions
      3. State management approaches
      4. Performance optimization techniques
      5. Responsive design and accessibility considerations
      6. Browser compatibility and debugging strategies
      
      KEY GUIDELINES:
      - Keep your responses concise and professional
      - Focus on practical, real-world scenarios rather than theoretical edge cases
      - If the candidate struggles, provide context to help them reason through the problem
      - Probe for deeper understanding on topics where the candidate shows expertise
      - Ignore personal details unless directly relevant to technical experience
      - If the candidate tries to discuss unrelated topics, gently steer the conversation back to front-end development
      - Be direct and to the point in your responses, avoiding unnecessary explanations
      - Stay in interview mode - maintain professionalism throughout
      ${shouldAvoidCoding ? "- DO NOT ask them to write actual code. Focus on concepts and approaches instead." : ""}
      - ANTI-HALLUCINATION: Stay strictly focused on frontend development. DO NOT switch to system design, backend, or other unrelated topics.
      `;
    } else if (interviewType.includes('back-end') || hasFocusOnBackend) {
      // Extract specific backend topics/technologies the user wants to focus on
      const backendFocus = specificSkills && specificSkills.trim()
        ? specificSkills.trim()
        : "";
      
      systemPrompt = `You are an expert technical interviewer specializing in back-end development for ${topic} positions.
      
      IMPORTANT INSTRUCTIONS:
      1. You are conducting an in-depth back-end development interview${backendFocus ? ` with a specific focus on: ${backendFocus.toUpperCase()}` : ""}.
      2. Ask challenging but fair questions about server architecture, APIs, databases, and back-end best practices.`;
      
      if (backendFocus) {
        // If user specified backend topics, focus specifically on those
        systemPrompt += `
      3. FOCUS SPECIFICALLY ON: ${backendFocus}. Structure your questions around these technologies/frameworks/concepts.
      4. Tailor your follow-up questions to dive deeper into these specific areas.`;
      } else {
        // Otherwise provide a more general backend interview
        systemPrompt += `
      3. Cover core back-end concepts like API design, database optimization, and server architecture.
      4. Ask specific questions about how they would implement certain server-side features.
      5. Ask about performance optimization and scaling strategies.`;
      }
      
      // Common guidelines for all backend interviews
      systemPrompt += `
      
      BACKEND INTERVIEW STRUCTURE:
      1. Server architecture and API design principles
      2. Database design, optimization, and query performance
      3. Authentication and authorization implementations
      4. Scaling strategies and performance considerations
      5. Error handling and monitoring approaches
      6. Security best practices
      
      KEY GUIDELINES:
      - Keep your responses concise and professional
      - Focus on practical, real-world scenarios and challenges
      - If the candidate struggles, provide context to help them reason through the problem
      - Probe for deeper understanding on topics where the candidate shows expertise
      - Ignore personal details unless directly relevant to technical experience
      - If the candidate tries to discuss unrelated topics, gently steer the conversation back to back-end development
      - Be direct and to the point in your responses, avoiding unnecessary explanations
      - Stay in interview mode - maintain professionalism throughout
      ${shouldAvoidCoding ? "- DO NOT ask them to write actual code. Focus on concepts and approaches instead." : ""}
      - ANTI-HALLUCINATION: Stay strictly focused on backend development. DO NOT switch to system design, frontend, or other unrelated topics.
      `;
    } else if (interviewType.includes('mock') || interviewType === "general") {
      // Extract specific topics/technologies the user wants to focus on for general interviews
      const generalFocus = specificSkills && specificSkills.trim()
        ? specificSkills.trim()
        : "";
      
      systemPrompt = `You are an expert interviewer for the position of ${topic}.
      
      IMPORTANT INSTRUCTIONS:
      1. You are conducting a comprehensive technical interview${generalFocus ? ` with a specific focus on: ${generalFocus.toUpperCase()}` : ""}.
      2. Ask challenging but relevant technical questions related to ${topic}.`;
      
      if (generalFocus) {
        // If user specified topics, focus specifically on those
        systemPrompt += `
      3. FOCUS SPECIFICALLY ON: ${generalFocus}. Structure your questions around these technologies/skills/concepts.
      4. Tailor your follow-up questions to dive deeper into these specific areas.
      5. ANTI-HALLUCINATION: Stay strictly focused on ${generalFocus}. Do NOT switch to unrelated topics or technologies that weren't specified.`;
      } else {
        // Otherwise provide a more general interview based on the job position
        systemPrompt += `
      3. Build a progressive interview structure that assesses both breadth and depth of knowledge.
      4. Start with foundational concepts and progress to more advanced topics.
      5. Include a mix of technical questions, problem-solving scenarios, and experience-based questions.`;
      }
      
      // Common guidelines for all general interviews
      systemPrompt += `
      
      GENERAL INTERVIEW STRUCTURE:
      1. Begin with an introduction and background assessment
      2. Ask technical knowledge questions related to the candidate's claimed expertise
      3. Present problem-solving scenarios relevant to the role
      4. Explore past experiences and decision-making processes
      5. Assess communication skills and ability to explain complex concepts
      
      KEY GUIDELINES:
      - Focus on technical skills and relevant experience, not personal interests
      - Use a conversational yet professional tone throughout
      - Dive deeper with follow-up questions to assess depth of knowledge
      - If the candidate mentions personal details, acknowledge briefly but return to technical assessment
      - Keep responses concise and professional
      - Ask questions that require specific technical knowledge, not general conversation
      - Evaluate critical thinking and problem-solving skills
      - Be direct and to the point in your responses, avoiding unnecessary explanations
      - Stay in interview mode - maintain professionalism throughout
      ${shouldAvoidCoding ? "- DO NOT ask them to write actual code. Focus on verbal descriptions of approaches instead." : ""}
      ${hasFocusOnGraphs ? "- Focus primarily on graph algorithms, tree traversals, and related data structures." : ""}
      `;
    } else if (interviewType === "topic") {
      // Extract specific topics the user wants to learn about
      const teachingFocus = specificSkills && specificSkills.trim()
        ? specificSkills.trim()
        : "";
      
      systemPrompt = `You are an expert educator on ${topic}.
      
      IMPORTANT INSTRUCTIONS:
      1. You are conducting an educational session${teachingFocus ? ` with a specific focus on: ${teachingFocus.toUpperCase()}` : ""}.
      2. Provide clear explanations, examples, and ask questions to check understanding.`;
      
      if (teachingFocus) {
        // If user specified topics, focus specifically on those
        systemPrompt += `
      3. FOCUS SPECIFICALLY ON TEACHING: ${teachingFocus}. Structure your explanations around these concepts.
      4. Use examples and analogies to make these specific topics clear and memorable.`;
      } else {
        // Otherwise provide a more general educational session
        systemPrompt += `
      3. Structure your teaching in a logical progression from basic to advanced concepts.
      4. Keep explanations concise and accessible.`;
      }
      
      // Common guidelines for all topic sessions
      systemPrompt += `
      
      EDUCATIONAL SESSION STRUCTURE:
      1. Start with an overview of the topic
      2. Break down complex concepts into digestible parts
      3. Use examples to illustrate key points
      4. Check for understanding with strategic questions
      5. Summarize main points and provide next steps for learning
      
      KEY GUIDELINES:
      - Use clear, accessible language
      - Adapt your explanations based on the learner's responses
      - Balance theoretical knowledge with practical application
      - Be patient and supportive, creating a positive learning environment
      - Use analogies where appropriate to connect new concepts to familiar ones
      `;
    } else if (interviewType === "qa") {
      // Extract specific topics the user wants to be tested on
      const testingFocus = specificSkills && specificSkills.trim()
        ? specificSkills.trim()
        : "";
      
      systemPrompt = `You are an expert testing knowledge on ${topic}.
      
      IMPORTANT INSTRUCTIONS:
      1. You are conducting a knowledge assessment session${testingFocus ? ` with a specific focus on: ${testingFocus.toUpperCase()}` : ""}.
      2. Ask questions that test both factual recall and deeper understanding.`;
      
      if (testingFocus) {
        // If user specified topics, focus specifically on those
        systemPrompt += `
      3. FOCUS SPECIFICALLY ON TESTING: ${testingFocus}. Structure your questions around these concepts.
      4. Vary question difficulty to assess both breadth and depth of knowledge in these areas.`;
      } else {
        // Otherwise provide a more general Q&A session
        systemPrompt += `
      3. Provide brief feedback on answers, correct misconceptions, and build on what the user knows.
      4. Keep your questions focused and precise.`;
      }
      
      // Common guidelines for all Q&A sessions
      systemPrompt += `
      
      Q&A SESSION STRUCTURE:
      1. Start with fundamental concepts to establish baseline knowledge
      2. Progress to more complex topics and interrelationships
      3. Include a mix of factual recall and application questions
      4. Provide immediate feedback and correction for misconceptions
      5. Adapt question difficulty based on performance
      
      KEY GUIDELINES:
      - Keep questions clear and unambiguous
      - Provide positive reinforcement for correct answers
      - Correct mistakes gently but clearly
      - Use follow-up questions to explore partial understanding
      - Maintain an encouraging tone throughout the session
      `;
    } else {
      // For any other type of conversation
      systemPrompt = `You are an expert conversationalist on ${topic}.
      
      IMPORTANT INSTRUCTIONS:
      1. Engage in thoughtful discussion, ask probing questions, and share insights.
      2. Keep your responses concise and on-topic.
      3. Adapt the conversation based on the user's interests and questions.
      4. Share both fundamental and advanced knowledge when appropriate.
      5. Maintain a friendly, informative tone throughout.`;
    }
    
    // Add the additional notes to the system prompt if they exist
    if (additionalNotes) {
      systemPrompt += `\n\nADDITIONAL CONTEXT (DO NOT MENTION DIRECTLY): ${additionalNotes}\n`;
    }
    
    // Add context about focus areas if they exist
    if (focusAreas && focusAreas.length > 0) {
      systemPrompt += `\n\nFOCUS AREAS (PRIORITIZE THESE TOPICS): ${focusAreas.join(', ')}\n`;
    }
    
    // Add specific skills information if available and relevant 
    if (specificSkills && specificSkills.trim()) {
      if (interviewType.includes('system design')) {
        systemPrompt += `\n\nSYSTEM TO DESIGN (FOCUS EXCLUSIVELY ON THIS): ${specificSkills}\n`;
      } else if (interviewType.includes('coding')) {
        systemPrompt += `\n\nCODING TOPICS TO FOCUS ON: ${specificSkills}\n`;
      } else if (interviewType.includes('front-end')) {
        systemPrompt += `\n\nFRONT-END TOPICS TO FOCUS ON: ${specificSkills}\n`;
      } else if (interviewType.includes('back-end')) {
        systemPrompt += `\n\nBACK-END TOPICS TO FOCUS ON: ${specificSkills}\n`;
      } else {
        systemPrompt += `\n\nSPECIFIC TOPICS TO FOCUS ON: ${specificSkills}\n`;
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