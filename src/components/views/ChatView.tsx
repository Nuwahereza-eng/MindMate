
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, MicOff, Smile, Frown, Meh } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLocalization } from '@/context/LocalizationContext';
import { performSentimentAnalysis } from '@/app/actions';
import type { Message } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';

interface ChatViewProps {
  onTriggerCrisisModal: () => void;
}

const defaultBotResponses = (t: Function) => [
  t('defaultResponse1'), t('defaultResponse2'), t('defaultResponse3'), t('defaultResponse4'), t('defaultResponse5')
];

// Helper component to ensure timestamp is formatted on the client side
const ClientFormattedTime = ({ timestamp }: { timestamp: Date }) => {
  const [formattedTime, setFormattedTime] = useState<string>('...'); // Initial placeholder

  useEffect(() => {
    if (timestamp instanceof Date && !isNaN(timestamp.getTime())) {
      setFormattedTime(timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } else {
      setFormattedTime(''); // Or some error string if needed
    }
  }, [timestamp]);

  return <>{formattedTime}</>;
};


export function ChatView({ onTriggerCrisisModal }: ChatViewProps) {
  const { t, language } = useLocalization(); // language can be used to tailor AI responses if needed
  const [messages, setMessages] = useState<Message[]>([
    { id: Date.now(), type: 'bot', content: t('botGreeting'), timestamp: new Date() }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false); // Placeholder for voice functionality
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);
  
  // Reset greeting if language changes
  useEffect(() => {
    setMessages([{ id: Date.now(), type: 'bot', content: t('botGreeting'), timestamp: new Date() }]);
  }, [t]);


  const generateAIResponse = (userMessageContent: string, sentimentResult: Awaited<ReturnType<typeof performSentimentAnalysis>>) => {
    const lowerMessage = userMessageContent.toLowerCase();

    if (sentimentResult.isCrisis) {
      onTriggerCrisisModal();
      return t('crisisWarning');
    }
    
    // Example responses based on keywords and sentiment (can be expanded)
    if (lowerMessage.includes(t('anxiousKeyword')||'anxious') || lowerMessage.includes(t('anxietyKeyword')||'anxiety')) {
      return t('feelingAnxiousResponse');
    }
    if (lowerMessage.includes(t('sadKeyword')||'sad') || lowerMessage.includes(t('depressedKeyword')||'depressed')) {
      return t('feelingSadResponse');
    }
    if (lowerMessage.includes(t('stressedKeyword')||'stressed') || lowerMessage.includes(t('overwhelmedKeyword')||'overwhelmed')) {
      return t('feelingStressedResponse');
    }
    if (lowerMessage.includes(t('breathingKeyword')||'breathing') || lowerMessage.includes(t('exerciseKeyword')||'exercise')) {
      return t('offerBreathingExerciseResponse');
    }

    // Fallback to random default response
    const responses = defaultBotResponses(t);
    return responses[Math.floor(Math.random() * responses.length)];
  };

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
      const sentimentResult = await performSentimentAnalysis(currentInput);
      
      const botResponseContent = generateAIResponse(currentInput, sentimentResult);
      
      const botMessage: Message = {
        id: Date.now() + 1,
        type: 'bot',
        content: botResponseContent,
        timestamp: new Date(),
        sentiment: `${t('sentimentPrefix')} ${sentimentResult.sentiment} (Score: ${sentimentResult.score.toFixed(2)})`
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
  
  const getSentimentIcon = (score: number) => {
    if (score > 0.3) return <Smile className="h-4 w-4 text-green-500" />;
    if (score < -0.3) return <Frown className="h-4 w-4 text-red-500" />;
    return <Meh className="h-4 w-4 text-yellow-500" />;
  }

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
                  <AvatarImage src="https://placehold.co/40x40/9B59B6/FFFFFF.png?text=A" alt="AfyaSync Bot" data-ai-hint="bot avatar"/>
                  <AvatarFallback>A</AvatarFallback>
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
                {message.type === 'bot' && message.sentiment && (
                   <Badge variant="outline" className="mt-1 text-xs flex items-center gap-1">
                     {getSentimentIcon(parseFloat(message.sentiment.split('Score: ')[1]?.replace(')','')) || 0)}
                     {message.sentiment}
                   </Badge>
                )}
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
                  <AvatarImage src="https://placehold.co/40x40/9B59B6/FFFFFF.png?text=A" alt="AfyaSync Bot" data-ai-hint="bot avatar"/>
                  <AvatarFallback>A</AvatarFallback>
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

    