# Aurum Agent - Brand Development Interview Application

## Project Overview

Aurum Agent is a web application that conducts automated brand development interviews using artificial intelligence. The application guides users through a structured interview process consisting of three phases: Core Brand Discovery, Messaging Consistency, and Audience Alignment. After completing the interview, users receive a comprehensive brand development report.

## Technical Architecture

The application is built on a modern web stack with the following core technologies:

- Frontend: React with TypeScript
- State Management: React Hooks
- UI Framework: Tailwind CSS
- Backend: Firebase (Firestore)
- AI Integration: OpenAI Assistants API
- Build System: Vite

## Key Features

The application provides a seamless user experience through several core functionalities:

- Email-based user registration without authentication requirements
- Three-phase brand development interview process
- Automatic progress tracking and phase transitions
- Real-time interaction with an AI brand development expert
- PDF report generation with professional formatting
- Google Analytics integration for usage tracking

## Environment Setup

The application requires several environment variables to be configured. Create a `.env` file in the project root with the following structure:

```
# OpenAI Configuration
VITE_OPENAI_API_KEY=your_openai_api_key
VITE_BRAND_ASSISTANT_ID=your_assistant_id

# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

## Database Configuration

The application uses Firestore with the following security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userEmail} {
      allow get: if true;
      allow create: if request.resource.data.email == userEmail &&
                   request.resource.data.email is string &&
                   request.resource.data.name is string;
    }
    
    match /interviews/{interviewId} {
      allow read, write: if resource.data.userEmail == request.resource.data.userEmail;
      allow create: if request.resource.data.userEmail is string &&
                   request.resource.data.userName is string;
    }
  }
}
```

## Project Structure

The application follows a modular architecture with these key components:

- `src/Auth.tsx`: Handles user registration and session management
- `src/Chat.tsx`: Manages the interview process and AI interaction
- `src/pdfGenerator.ts`: Handles PDF report generation with custom formatting
- `src/types/interview.ts`: Contains TypeScript interfaces for data structures
- `src/firebase.ts`: Configures Firebase integration

## Development Setup

To begin development:

1. Clone the repository
2. Install dependencies: `npm install`
3. Configure environment variables
4. Set up Firebase project and Firestore database
5. Configure OpenAI Assistant using the provided system instructions
6. Start development server: `npm run dev`

## Key Development Considerations

Several aspects require particular attention during development:

1. Phase Management: The interview process transitions through three distinct phases, each requiring specific handling of user responses and AI interaction.

2. Report Generation: The application combines reports from each phase into a final PDF document with specific formatting requirements and custom fonts.

3. Session Management: User sessions are managed through browser session storage rather than persistent authentication.

4. Error Handling: Comprehensive error handling is implemented throughout the application, with user-friendly error messages delivered via toast notifications.

## Current Development Status

The application has these areas ready for continued development:

- User registration and session management are implemented
- Interview phase management is functional
- Basic report generation is in place
- Initial styling and UI components are configured

Areas that may require attention:

- Enhanced error recovery during interview process
- Expanded report formatting options
- Additional analytics tracking
- Performance optimization for longer interviews
- Automated testing implementation

## Contact Information

For questions about the current implementation or development requirements, please contact [Project Lead Contact Information].