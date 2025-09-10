import { cn } from '@/lib/utils';
import { Bot } from 'lucide-react';

interface AiAvatarProps {
  isThinking?: boolean;
  className?: string;
}

export function AiAvatar({ isThinking, className }: AiAvatarProps) {
  return (
    <div className={cn("relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20 border border-primary/50", className)}>
      <Bot className={cn("h-6 w-6 text-primary transition-transform duration-300", isThinking && "scale-110")} />
      {isThinking && (
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-dashed border-primary/50" style={{ animationDuration: '2s' }}></div>
      )}
    </div>
  );
}
