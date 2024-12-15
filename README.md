# Brand Development Interview Application

## Project Overview

This application facilitates automated brand development interviews using OpenAI's Assistant API. The application guides users through inputting their brand name and participating in a structured conversation with an AI brand development expert. Upon completion, users receive a comprehensive PDF report analyzing their brand's elements, messaging strategy, and audience alignment.

## Technical Architecture

The application is built using modern web technologies:

### Core Technologies
- React 18 with TypeScript for the frontend framework
- Firebase (Firestore) for data persistence
- OpenAI Assistants API for AI interaction
- Tailwind CSS for styling
- Vite for build tooling and development environment

### Key Dependencies
- framer-motion: Animation handling
- jsPDF: PDF report generation
- react-hot-toast: Toast notifications
- lucide-react: Icon components
- react-router-dom: Navigation management

## Development Setup

1. Clone the repository and install dependencies:
```bash
git clone [repository-url]
cd [project-directory]
npm install
```

2. Create a `.env` file in the project root with the following configuration:
```
VITE_OPENAI_API_KEY=your_openai_api_key
VITE_BRAND_ASSISTANT_ID=your_assistant_id
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

3. Start the development server:
```bash
npm run dev
```

## Application Structure

### Core Components

1. **BrandEntry.tsx**
   - Entry point for users
   - Handles brand name collection
   - Initializes interview session

2. **Chat.tsx**
   - Manages interview process
   - Handles OpenAI Assistant interaction
   - Controls message flow and state

3. **MessageBubble.tsx & MessageInput.tsx**
   - UI components for chat interface
   - Handles message display and input

4. **pdfGenerator.ts**
   - Generates branded PDF reports
   - Handles custom formatting and styling

### Data Flow

1. User enters brand name through BrandEntry component
2. Application creates new thread with OpenAI Assistant
3. Chat component manages conversation flow
4. Reports are generated at phase completion points
5. Final PDF report combines all phase insights

## Current Development Status

### Implemented Features
- Brand name entry and session initialization
- Real-time chat interface with OpenAI Assistant
- Progress tracking through interview phases
- Basic report generation functionality

### Known Issues
- Occasional "active run" errors with OpenAI Assistant
- Need for improved error handling in chat initialization
- PDF report styling refinements needed

### Priority Development Areas
1. Resolving OpenAI Assistant run management
2. Enhancing error recovery mechanisms
3. Improving report generation formatting
4. Adding comprehensive testing

## Development Guidelines

### Working with OpenAI Assistant

When modifying assistant interactions, follow these principles:
1. Always check for and handle active runs before creating new ones
2. Implement retry logic for failed operations
3. Maintain proper error handling and user feedback

Example of proper run management:
```typescript
const continueInterview = async (threadId: string, retryCount = 0) => {
  try {
    setIsTyping(true);
    const activeRuns = await openai.beta.threads.runs.list(threadId);
    for (const run of activeRuns.data) {
      if (run.status === 'in_progress') {
        await openai.beta.threads.runs.cancel(threadId, run.id);
      }
    }
    // Continue with interview logic...
  } catch (error) {
    if (retryCount < 3) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      return continueInterview(threadId, retryCount + 1);
    }
    throw error;
  }
};
```

### Firebase Data Structure

The Firestore database uses the following structure:

```typescript
interface Interview {
  brandName: string;
  threadId: string;
  createdAt: Date;
  lastUpdated: Date;
  currentPhase: 'brand-elements' | 'messaging' | 'audience' | 'complete';
  messages: Message[];
  reports: {
    brandElements?: string;
    messaging?: string;
    audience?: string;
  };
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  phase: string;
}
```

## Testing

The application currently lacks comprehensive testing. Priority areas for test implementation:

1. Chat component interaction flows
2. OpenAI Assistant error handling
3. PDF report generation
4. Database operations
5. User input validation

## Deployment

The application is designed to be embedded within an existing webpage container. Key considerations:

1. Ensure all environment variables are properly configured
2. Verify OpenAI Assistant ID and system prompts
3. Configure Firebase security rules appropriately
4. Test PDF generation in production environment

## Support and Documentation

For additional support:
- OpenAI Assistants API: https://platform.openai.com/docs/assistants
- Firebase Documentation: https://firebase.google.com/docs
- Project Technical Contact: [Contact Information]

## Next Steps

1. Review current implementation of Chat.tsx and resolve OpenAI Assistant run management issues
2. Implement comprehensive error handling and recovery mechanisms
3. Enhance PDF report generation with improved styling and formatting
4. Add automated testing suite
5. Implement monitoring and logging solutions

For any questions or clarifications about this documentation, please contact [Contact Information].