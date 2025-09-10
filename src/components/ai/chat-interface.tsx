
'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Mic, Square, BrainCircuit, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage, type Message } from './chat-message';
import { answerStudyQuestion } from '@/ai/flows/answer-study-questions';
import { explainSimply } from '@/ai/flows/explain-simply';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { AiAvatar } from './ai-avatar';
import { useUsers } from '@/hooks/use-admin';

const CHAT_COST = 1;

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { currentUserData, addCreditsToUser } = useUsers();

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.interimResults = false;
      recognitionRef.current.maxAlternatives = 1;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        handleSubmit(new Event('submit'), transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        toast({
          variant: 'destructive',
          title: 'Voice Recognition Error',
          description: event.error,
        });
        setIsListening(false);
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

    }
  }, [toast]);
  
  const handleMicClick = () => {
    if (!recognitionRef.current) {
      toast({
          variant: 'destructive',
          title: 'Unsupported Browser',
          description: 'Your browser does not support voice recognition.',
        });
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
    setIsListening(!isListening);
  };
  
  const callAiAndHandleResponse = async (
      aiFunction: (input: any) => Promise<any>, 
      input: any, 
      creditCost: number, 
      responseHandler: (response: any) => string
    ) => {
        if (!user) return;

        if ((currentUserData?.credits ?? 0) < creditCost) {
            toast({
                variant: 'destructive',
                title: 'Insufficient Credits',
                description: `You need ${creditCost} credit for this action.`
            });
            return;
        }

        setIsThinking(true);
        try {
            if (creditCost > 0) {
              addCreditsToUser(user.uid, -creditCost);
              toast({ title: "Credit Used", description: `You have been charged ${creditCost} credit.`});
            }

            const response = await aiFunction(input);
            const responseText = responseHandler(response);
            
            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: responseText,
            };
            setMessages((prev) => [...prev, aiMessage]);

        } catch (error) {
            console.error(error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "Sorry, I couldn't process your request. The AI model may be temporarily unavailable.",
                isError: true,
            };
            setMessages((prev) => [...prev, errorMessage]);
            // Refund credits if there was an error
            if (creditCost > 0) {
              addCreditsToUser(user.uid, creditCost);
              toast({
                  variant: 'destructive',
                  title: 'AI Error - Credits Refunded',
                  description: `We failed to get a response from the AI. Your credit has been returned.`
              });
            }
        } finally {
            setIsThinking(false);
        }
  }


  const handleSubmit = async (e: React.FormEvent | Event, voiceInput?: string) => {
    e.preventDefault();
    const currentInput = voiceInput || input;
    if (!currentInput.trim() || !user) return;
    
    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: currentInput, user };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    
    const studyMaterial = messages.map(m => `${m.role}: ${m.content}`).join('\n');
    
    await callAiAndHandleResponse(
      answerStudyQuestion,
      {
        question: currentInput,
        studyMaterial: studyMaterial || 'General knowledge',
      },
      CHAT_COST,
      (response) => response.explanation
    );
  };
  
  const handleExplainSimply = async (messageToSimplify: Message) => {
      const originalQuestion = messages.slice().reverse().find(m => m.role === 'user')?.content || "the previous topic";

      const userMessage: Message = { id: Date.now().toString(), role: 'user', content: "Can you explain that more simply?", user, isHidden: true };
      setMessages((prev) => [...prev, userMessage]);

      await callAiAndHandleResponse(
        explainSimply,
        {
          textToSimplify: messageToSimplify.content,
          originalQuestion: originalQuestion
        },
        CHAT_COST,
        (response) => response.simpleExplanation
      );
  }
  
  return (
    <div className="flex h-full flex-col bg-background rounded-xl">
      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        <div className="p-4 sm:p-6 md:p-8 space-y-8">
          {messages.length === 0 && (
             <div className="flex flex-col items-center justify-center h-full pt-16 text-center">
                <AiAvatar isThinking={false} className="h-20 w-20 mb-4" />
                <h1 className="text-3xl font-bold">How can I help you today?</h1>
                <p className="text-muted-foreground max-w-md mt-2">
                    Ask me anything from complex science concepts to simple definitions.
                </p>
                <div className="grid grid-cols-2 gap-3 mt-8 text-left text-sm">
                    <button className="p-4 border rounded-lg hover:bg-muted transition-colors">
                        <h4 className="font-semibold">Explain photosynthesis</h4>
                        <p className="text-muted-foreground text-xs">in a way a 10th grader can understand.</p>
                    </button>
                     <button className="p-4 border rounded-lg hover:bg-muted transition-colors">
                        <h4 className="font-semibold">Summarize the plot of Hamlet</h4>
                        <p className="text-muted-foreground text-xs">focusing on the main characters.</p>
                    </button>
                </div>
            </div>
          )}
          {messages.filter(m => !m.isHidden).map((message) => (
            <ChatMessage 
                key={message.id} 
                message={message} 
                isThinking={false}
                onSimplify={handleExplainSimply}
             />
          ))}
          {isThinking && <ChatMessage message={{ id: 'thinking', role: 'assistant', content: '' }} isThinking={true} />}
        </div>
      </ScrollArea>
      <div className="border-t p-4 bg-background/50 sticky bottom-0">
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/50 bg-amber-500/10 p-2 text-amber-700 dark:text-amber-300 mb-4">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <p className="text-xs font-semibold">
                Cost: {CHAT_COST} Credit per message.
            </p>
        </div>
        <form onSubmit={handleSubmit} className="flex w-full items-center space-x-2">
          <Input
            type="text"
            placeholder="Ask Marco AI anything..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isThinking}
            className="flex-1 bg-muted border-0 focus-visible:ring-primary focus-visible:ring-2 h-12 text-base"
          />
          <Button type="button" size="icon" variant={isListening ? 'destructive' : 'outline'} onClick={handleMicClick} disabled={isThinking} className="h-12 w-12 shrink-0">
            {isListening ? <Square className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </Button>
          <Button type="submit" size="icon" disabled={isThinking || !input.trim()} className="h-12 w-12 shrink-0">
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </div>
  );
}
