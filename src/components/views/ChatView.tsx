
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLocalization } from '@/context/LocalizationContext';
import { getAIChatResponse } from '@/app/actions';
import type { Message } from '@/lib/constants';
import { CRISIS_KEYWORDS } from '@/lib/constants';

interface ChatViewProps {
  onTriggerCrisisModal: () => void;
}

// Helper component to ensure timestamp is formatted on the client side
const ClientFormattedTime = ({ timestamp }: { timestamp: Date }) => {
  const [formattedTime, setFormattedTime] = useState<string>('...'); 

  useEffect(() => {
    if (timestamp instanceof Date && !isNaN(timestamp.getTime())) {
      setFormattedTime(timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } else {
      setFormattedTime(''); 
    }
  }, [timestamp]);

  return <>{formattedTime}</>;
};

const INITIAL_GREETING_ID = -1; // Stable ID for the initial greeting message

export function ChatView({ onTriggerCrisisModal }: ChatViewProps) {
  const { t } = useLocalization();
  
  // Initialize messages with the bot greeting using an initializer function for useState
  const [messages, setMessages] = useState<Message[]>(() => [
    { id: INITIAL_GREETING_ID, type: 'bot', content: t('botGreeting'), timestamp: new Date() }
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);
  
  // This useEffect updates the initial greeting message if the language changes AND it's the only message.
  useEffect(() => {
    setMessages(prevMessages => {
      if (prevMessages.length === 1 && prevMessages[0].id === INITIAL_GREETING_ID && prevMessages[0].type === 'bot') {
        // Only the initial greeting is present, update its content with the current translation
        return [{ ...prevMessages[0], content: t('botGreeting') }];
      }
      // If other messages are present, or it's not the initial greeting, do not modify the chat history
      return prevMessages;
    });
  }, [t]); // Re-run this effect if the translation function 't' changes


  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputMessage;
    setInputMessage('');
    setIsTyping(true);

    try {
      // Get AI response
      const aiChatResult = await getAIChatResponse(currentInput);
      let botResponseContent = aiChatResult.botResponse;
      
      // Determine crisis status
      const lowerMessage = currentInput.toLowerCase();
      const isCrisisFromKeywords = CRISIS_KEYWORDS.some(keyword => lowerMessage.includes(keyword));
      const isCrisis = aiChatResult.isCrisisFromAI || isCrisisFromKeywords;

      if (isCrisis) {
        onTriggerCrisisModal();
        // If AI didn't provide a crisis-specific message but keywords triggered, use a default one.
        if (!aiChatResult.isCrisisFromAI && isCrisisFromKeywords) {
          botResponseContent = t('crisisWarning');
        }
      }
      
      const botMessage: Message = {
        id: Date.now() + 1, // Ensure unique ID, different from user message and initial greeting
        type: 'bot',
        content: botResponseContent,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMessage]);

    } catch (error) {
      console.error("Error processing message:", error);
      const errorMessage: Message = {
        id: Date.now() + 1,
        type: 'bot',
        content: t('error'),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };
  

  return (
    <div className="flex flex-col h-full p-4">
      <ScrollArea className="flex-1 mb-4 pr-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-end gap-2 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.type === 'bot' && (
                <Avatar className="h-8 w-8">
                  <AvatarImage src="https://placehold.co/40x40/9B59B6/FFFFFF.png?text=M" alt="MindMate Bot" data-ai-hint="bot avatar"/>
                  <AvatarFallback>M</AvatarFallback>
                </Avatar>
              )}
              <div
                className={`max-w-[70%] rounded-lg px-4 py-3 shadow-sm ${
                  message.type === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card text-card-foreground'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p className="text-xs text-muted-foreground mt-1 text-right">
                  <ClientFormattedTime timestamp={message.timestamp} />
                </p>
              </div>
               {message.type === 'user' && (
                <Avatar className="h-8 w-8">
                  <AvatarImage src="https://placehold.co/40x40/5DADE2/FFFFFF.png?text=U" alt="User" data-ai-hint="user avatar"/>
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          {isTyping && (
            <div className="flex items-end gap-2 justify-start">
               <Avatar className="h-8 w-8">
                  <AvatarImage src="https://placehold.co/40x40/9B59B6/FFFFFF.png?text=M" alt="MindMate Bot" data-ai-hint="bot avatar"/>
                  <AvatarFallback>M</AvatarFallback>
                </Avatar>
              <div className="max-w-[70%] rounded-lg px-4 py-3 shadow-sm bg-card text-card-foreground">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      <div className="flex items-center gap-2 pt-2 border-t">
        <Input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && !isTyping && handleSendMessage()}
          placeholder={t('chatPlaceholder')}
          className="flex-1"
          disabled={isTyping}
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setVoiceMode(!voiceMode)}
          disabled={isTyping}
          className={voiceMode ? 'text-destructive' : ''}
          aria-label={voiceMode ? "Turn off voice mode" : "Turn on voice mode"}
        >
          {voiceMode ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </Button>
        <Button onClick={handleSendMessage} disabled={isTyping || !inputMessage.trim()} aria-label="Send message">
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
