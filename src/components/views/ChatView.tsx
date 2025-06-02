
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLocalization } from '@/context/LocalizationContext';
import { getAIChatResponse } from '@/app/actions';
import type { Message, UserProfile } from '@/lib/constants';
import { CRISIS_KEYWORDS } from '@/lib/constants';

interface ChatViewProps {
  user: UserProfile | null;
  onTriggerCrisisModal: () => void;
}

// Helper component to ensure timestamp is formatted on the client side
const ClientFormattedTime = ({ timestamp }: { timestamp: Date }) => {
  const [formattedTime, setFormattedTime] = useState<string>('...');

  useEffect(() => {
    if (timestamp instanceof Date && !isNaN(timestamp.getTime())) {
      setFormattedTime(timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } else {
      const d = new Date(timestamp);
      if (d instanceof Date && !isNaN(d.getTime())) {
        setFormattedTime(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      } else {
        setFormattedTime('');
      }
    }
  }, [timestamp]);

  return <>{formattedTime}</>;
};

const INITIAL_GREETING_ID = -1; 
const CHAT_MESSAGES_STORAGE_KEY_PREFIX = 'afyasync-chatMessages-';
const MAX_CHAT_MESSAGES_STORAGE = 50;
const CHAT_HISTORY_FOR_AI_LENGTH = 10;

export function ChatView({ user, onTriggerCrisisModal }: ChatViewProps) {
  const { t, language } = useLocalization();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const getStorageKey = (uid: string | undefined): string | null => {
    return uid ? `${CHAT_MESSAGES_STORAGE_KEY_PREFIX}${uid}` : null;
  };

  // Load messages effect
  useEffect(() => {
    const currentUserId = user?.uid;
    const storageKey = getStorageKey(currentUserId);

    if (storageKey) {
      const storedMessagesRaw = localStorage.getItem(storageKey);
      if (storedMessagesRaw) {
        try {
          const parsedMessages: Message[] = JSON.parse(storedMessagesRaw).map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }));
          setMessages(parsedMessages);
        } catch (e) {
          console.error("Error parsing stored chat messages:", e);
          setMessages([{ id: INITIAL_GREETING_ID, type: 'bot', content: t('botGreeting'), timestamp: new Date() }]);
        }
      } else {
        setMessages([{ id: INITIAL_GREETING_ID, type: 'bot', content: t('botGreeting'), timestamp: new Date() }]);
      }
    } else {
      // No user (e.g. initial load before auth, or anonymous user if that was enabled)
      // If user is null, it means AuthModal should be shown.
      // We still give a greeting for the UI layout before AuthModal potentially overlays.
      setMessages([{ id: INITIAL_GREETING_ID, type: 'bot', content: t('botGreeting'), timestamp: new Date() }]);
    }
  }, [user?.uid, t]);


  // Update initial greeting if language changes and it's the only message
  useEffect(() => {
    setMessages(prevMessages => {
      if (prevMessages.length === 1 && prevMessages[0].id === INITIAL_GREETING_ID && prevMessages[0].type === 'bot') {
        return [{ ...prevMessages[0], content: t('botGreeting') }];
      }
      return prevMessages;
    });
  }, [t]);

  // Save messages effect
  useEffect(() => {
    const currentUserId = user?.uid;
    const storageKey = getStorageKey(currentUserId);

    if (storageKey && messages.length > 0) {
      if (messages.length === 1 && messages[0].id === INITIAL_GREETING_ID && messages[0].type === 'bot') {
        return;
      }
      const limitedMessages = messages.slice(-MAX_CHAT_MESSAGES_STORAGE);
      localStorage.setItem(storageKey, JSON.stringify(limitedMessages));
    }
  }, [messages, user?.uid]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isTyping]);


  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !user) return; 

    const userMessage: Message = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };
    
    const currentInput = inputMessage;
    setInputMessage('');
    
    const historyToPass = messages
      .filter(msg => msg.id !== INITIAL_GREETING_ID) 
      .slice(-CHAT_HISTORY_FOR_AI_LENGTH)
      .map(msg => ({
        role: msg.type === 'user' ? ('user' as const) : ('model' as const),
        content: msg.content,
      }));

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    const userLastName = user && typeof user.lastName === 'string' && user.lastName.length > 0 ? user.lastName : undefined;

    try {
      const aiChatResult = await getAIChatResponse(currentInput, language, historyToPass, userLastName);
      let botResponseContent = aiChatResult.botResponse;
      
      const lowerMessage = currentInput.toLowerCase();
      const isCrisisFromKeywords = CRISIS_KEYWORDS.some(keyword => lowerMessage.includes(keyword));
      const isCrisis = aiChatResult.isCrisisFromAI || isCrisisFromKeywords;

      if (isCrisis) {
        onTriggerCrisisModal();
        if (!aiChatResult.isCrisisFromAI && isCrisisFromKeywords) {
           botResponseContent = t('crisisWarning');
        }
      }
      
      const botMessage: Message = {
        id: Date.now() + 1,
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
          {messages.map((message) => {
            let userAvatarInitials = 'U';
            let userAvatarAlt = t('user');

            if (message.type === 'user' && user) {
              const firstInitial = (user.firstName && typeof user.firstName === 'string' && user.firstName.length > 0 && user.firstName !== t('user')) ? user.firstName[0].toUpperCase() : '';
              const lastInitial = (user.lastName && typeof user.lastName === 'string' && user.lastName.length > 0) ? user.lastName[0].toUpperCase() : '';
              userAvatarInitials = `${firstInitial}${lastInitial}`.trim() || 'U';
              if (user.firstName && typeof user.firstName === 'string' && user.firstName.trim().length > 0 && user.firstName !== t('user')) {
                userAvatarAlt = user.firstName;
              }
            }

            return (
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
                {message.type === 'user' && user && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={`https://placehold.co/40x40/5DADE2/FFFFFF.png?text=${userAvatarInitials}`} alt={userAvatarAlt} data-ai-hint="user avatar"/>
                    <AvatarFallback>{userAvatarInitials}</AvatarFallback>
                  </Avatar>
                )}
                {message.type === 'user' && !user && ( // Should not happen if chat input is disabled for !user
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="https://placehold.co/40x40/5DADE2/FFFFFF.png?text=U" alt="User" data-ai-hint="user avatar"/>
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                )}
              </div>
            );
          })}
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
          placeholder={user ? t('chatPlaceholder') : t('signInToChat')}
          className="flex-1"
          disabled={isTyping || !user} 
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setVoiceMode(!voiceMode)}
          disabled={isTyping || !user}
          className={voiceMode ? 'text-destructive' : ''}
          aria-label={voiceMode ? "Turn off voice mode" : "Turn on voice mode"}
        >
          {voiceMode ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </Button>
        <Button onClick={handleSendMessage} disabled={isTyping || !inputMessage.trim() || !user} aria-label="Send message">
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
