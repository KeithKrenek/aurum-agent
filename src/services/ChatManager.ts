import { OpenAI } from 'openai';
import { Interview, Message } from '../types/interview';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { config } from '../config/environment';

export class ChatManager {
  private openai: OpenAI;
  private threadId: string;
  private interviewId: string;

  constructor(openai: OpenAI, threadId: string, interviewId: string) {
    this.openai = openai;
    this.threadId = threadId;
    this.interviewId = interviewId;
  }

  private async waitForRun(runId: string): Promise<void> {
    let attempts = 0;
    const maxAttempts = 30;

    while (attempts < maxAttempts) {
      const runStatus = await this.openai.beta.threads.runs.retrieve(this.threadId, runId);
      
      if (runStatus.status === 'completed') {
        return;
      }
      
      if (runStatus.status === 'failed' || runStatus.status === 'expired') {
        throw new Error(`Run ${runStatus.status}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }

    throw new Error('Run timed out');
  }

  private async checkAndHandleActiveRun(): Promise<void> {
    try {
      const runs = await this.openai.beta.threads.runs.list(this.threadId);
      const activeRun = runs.data.find(run => 
        ['in_progress', 'queued'].includes(run.status)
      );

      if (activeRun) {
        // Cancel the active run
        try {
          await this.openai.beta.threads.runs.cancel(this.threadId, activeRun.id);
          // Wait a moment for the cancellation to take effect
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          // If the run is already completed or cancelled, that's fine
          console.log('Run already completed or cancelled');
        }
      }
    } catch (error) {
      console.error('Error checking active runs:', error);
      throw error;
    }
  }

  private formatAssistantMessage(content: string): string {
    if (content.includes('# Brand')) {
      const reportStart = content.indexOf('# Brand');
      content = content.substring(0, reportStart).trim();
      if (!content) return '';
    }

    content = content.replace(/([^.!?]+\?)/g, '**$1**');
    content = content.replace(/\n\n/g, '\n').trim();

    return content;
  }

  public async startNewConversation(): Promise<Message | null> {
    try {
      await this.checkAndHandleActiveRun();
      
      const brandName = sessionStorage.getItem('brandName');
      await this.openai.beta.threads.messages.create(this.threadId, {
        role: 'user',
        content: `Hello, I'm ready to begin the brand development process for ${brandName}.`
      });

      const run = await this.openai.beta.threads.runs.create(this.threadId, {
        assistant_id: config.openai.assistantId
      });

      await this.waitForRun(run.id);
      
      const messages = await this.openai.beta.threads.messages.list(this.threadId);
      const lastMessage = messages.data[0];

      if (lastMessage.role === 'assistant' && lastMessage.content[0].type === 'text') {
        const formattedContent = this.formatAssistantMessage(lastMessage.content[0].text.value);
        
        if (formattedContent) {
          const newMessage: Message = {
            role: 'assistant',
            content: formattedContent,
            timestamp: new Date(),
            phase: 'brand-elements'
          };

          await updateDoc(doc(db, 'interviews', this.interviewId), {
            messages: [newMessage],
            lastUpdated: new Date()
          });

          return newMessage;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error starting conversation:', error);
      throw error;
    }
  }

  public async sendMessage(userMessage: Message, currentPhase: string): Promise<Message | null> {
    try {
      await this.checkAndHandleActiveRun();

      await this.openai.beta.threads.messages.create(this.threadId, {
        role: 'user',
        content: userMessage.content
      });

      const run = await this.openai.beta.threads.runs.create(this.threadId, {
        assistant_id: config.openai.assistantId
      });

      await this.waitForRun(run.id);

      const messages = await this.openai.beta.threads.messages.list(this.threadId);
      const lastMessage = messages.data[0];

      if (lastMessage.role === 'assistant' && lastMessage.content[0].type === 'text') {
        const formattedContent = this.formatAssistantMessage(lastMessage.content[0].text.value);
        
        if (!formattedContent) return null;

        const newMessage: Message = {
          role: 'assistant',
          content: lastMessage.content[0].text.value,
          timestamp: new Date(),
          phase: currentPhase
        };

        const interviewDoc = await getDoc(doc(db, 'interviews', this.interviewId));
        const interviewData = interviewDoc.data() as Interview;
        const updatedMessages = [...interviewData.messages, userMessage, newMessage];

        await updateDoc(doc(db, 'interviews', this.interviewId), {
          messages: updatedMessages,
          lastUpdated: new Date()
        });

        return newMessage;
      }

      return null;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }
}