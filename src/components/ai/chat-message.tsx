import { cn } from '@/lib/utils';
import { User, Sparkles } from 'lucide-react';
import { AiAvatar } from './ai-avatar';
import type { User as FirebaseUser } from 'firebase/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '../ui/button';


export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isError?: boolean;
  user?: FirebaseUser | null;
  isHidden?: boolean;
}

interface ChatMessageProps {
  message: Message;
  isThinking?: boolean;
  onSimplify?: (message: Message) => void;
}

export function ChatMessage({ message, isThinking, onSimplify }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex items-start gap-4', isUser && 'justify-end')}>
      {!isUser && <AiAvatar isThinking={isThinking} />}
      <div
        className={cn(
          'max-w-2xl rounded-lg p-4 text-base shadow-sm group',
          isUser
            ? 'rounded-br-none bg-primary text-primary-foreground'
            : 'rounded-bl-none bg-muted',
            message.isError && 'bg-destructive text-destructive-foreground'
        )}
      >
        {isThinking ? (
          <div className="flex items-center space-x-1.5">
             <span className="text-sm">Thinking</span>
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-current [animation-delay:-0.3s]"></div>
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-current [animation-delay:-0.15s]"></div>
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-current"></div>
          </div>
        ) : (
          <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        )}
         {!isUser && !isThinking && !message.isError && onSimplify && (
            <div className="mt-2 -mb-2 -mr-2 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="sm" onClick={() => onSimplify(message)}>
                    <Sparkles className="mr-2 h-4 w-4"/>
                    Explain this more simply
                </Button>
            </div>
        )}
      </div>
      {isUser && message.user && (
        <Avatar className="h-10 w-10 border-2 border-primary/20">
            <AvatarImage src={message.user.photoURL ?? undefined} alt={message.user.displayName ?? 'User'} />
            <AvatarFallback>{message.user.email?.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
