# KnowledgeAI

KnowledgeAI is an AI-powered platform for mock interviews, topic-based lectures, and more.

## Getting Started

Follow these instructions to set up the project locally.

### Prerequisites

- Node.js 16+ and npm
- OpenAI API key
- AssemblyAI API key (for speech recognition)
- Clerk account (for authentication)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/knowledgeAI.git
cd knowledgeAI
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
   - Create a `.env.local` file in the root directory with the following content:
```
# App settings
OPENAI_API_KEY=your-openai-api-key
NEXT_PUBLIC_ASSEMBLYAI_API_KEY=your-assemblyai-api-key

# Clerk authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key
CLERK_SECRET_KEY=your-clerk-secret-key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

4. Get a Clerk account:
   - Go to [clerk.com](https://clerk.com/) and sign up for a free account
   - Create a new application in Clerk
   - Get your API keys from the Clerk dashboard
   - Add them to your `.env.local` file

5. Get an OpenAI API key:
   - Go to [platform.openai.com](https://platform.openai.com/) and sign up
   - Create an API key and add it to your `.env.local` file

6. Get an AssemblyAI API key:
   - Go to [assemblyai.com](https://www.assemblyai.com/) and sign up
   - Create an API key and add it to your `.env.local` file

7. Start the development server:
```bash
npm run dev
```

8. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features

- **Mock Interviews**: Practice job interviews with AI
- **Topic Lectures**: Learn new subjects with AI-powered lessons
- **Voice Interaction**: Speak naturally with the AI interviewer
- **Feedback**: Get detailed feedback on your interview performance
- **Session History**: Review past sessions and track improvement

## Authentication

This application uses Clerk for authentication. Users need to create an account to:
- Save their interview history
- Access personalized features
- Track their progress over time

## FAQ

### The AI stops speaking after a few sentences

This is a known issue with the Web Speech API in some browsers. Try:
- Using a different browser (Chrome works best)
- Refreshing the page
- Using text input instead of voice

### How do I create a specialized interview?

In the mock interview form:
1. Select the job category and experience level
2. Enter specific skills or keywords in the "Specific Algorithms/Problems" field
3. Add detailed notes for the interviewer in the "Interviewer Notes" section
4. For coding interviews, you can specify "graph algorithms" to focus on that topic
5. Check "DO NOT ask to code" in the notes section for theory discussions only

## Key Components

- **Mock Interview**: Practice job interviews with AI focusing on specific roles or technologies
- **Topic Lecture**: Learn about any subject through AI-powered lectures
- **Voice Interaction**: Natural voice-based conversations
- **Interview Feedback**: Get detailed feedback on your performance after each session

## Technical Stack

- **Framework**: Next.js 15
- **UI**: Tailwind CSS
- **Authentication**: Clerk
- **Voice**: Web Speech API, AssemblyAI
- **AI**: OpenAI GPT-4 Turbo

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
