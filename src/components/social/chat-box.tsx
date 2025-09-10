
'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { type User } from '@/hooks/use-admin';
import { useChat, type Message } from '@/hooks/use-chat';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatRelative } from 'date-fns';
import { useUnreadMessages } from '@/hooks/use-unread';

interface ChatBoxProps {
  friend: User;
  onBack: () => void;
}

export function ChatBox({ friend, onBack }: ChatBoxProps) {
  const { user } = useAuth();
  const { messages, sendMessage } = useChat(friend.uid);
  const [newMessage, setNewMessage] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { markAsRead } = useUnreadMessages();

  useEffect(() => {
    // When the chat box is opened, mark messages as read
    if (friend.uid) {
        markAsRead(friend.uid);
    }
  }, [friend.uid, markAsRead, messages]); // Also run on messages change to mark incoming as read

  useEffect(() => {
    // Scroll to bottom on new message
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && user) {
      sendMessage(newMessage);
      setNewMessage('');
    }
  };

  return (
    <Card className="h-full flex flex-col w-full">
      <CardHeader className="flex flex-row items-center gap-3 p-3 border-b">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onBack}>
          <ArrowLeft />
          <span className="sr-only">Back</span>
        </Button>
        <Avatar>
          <AvatarImage src={friend.photoURL || `https://picsum.photos/150/150?u=${friend.uid}`} alt={friend.displayName} />
          <AvatarFallback>{friend.displayName.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <h3 className="font-semibold">{friend.displayName}</h3>
      </CardHeader>
      
      <ScrollArea className="flex-1 p-4 bg-muted/20" ref={scrollAreaRef}>
        <div className="space-y-6">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} friend={friend} isCurrentUser={msg.senderId === user?.uid} />
          ))}
           {messages.length === 0 && (
                <div className="text-center text-muted-foreground pt-16">
                    <p>No messages yet.</p>
                    <p>Start the conversation!</p>
                </div>
            )}
        </div>
      </ScrollArea>
      
      <CardFooter className="p-2 border-t bg-background">
        <form onSubmit={handleSendMessage} className="flex w-full items-center space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            autoComplete="off"
            className="h-12 text-base"
          />
          <Button type="submit" size="icon" className="h-12 w-12" disabled={!newMessage.trim()}>
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}


function ChatMessage({ message, friend, isCurrentUser }: { message: Message, friend: User, isCurrentUser: boolean }) {
  const { user } = useAuth();
  
  // A Fallback for timestamp if it's not ready from the server yet
  const displayTime = message.timestamp ? formatRelative(message.timestamp, new Date()) : "sending...";

  return (
    <div className={cn("flex items-end gap-2", isCurrentUser ? "justify-end" : "justify-start")}>
      {!isCurrentUser && (
         <Avatar className="h-8 w-8 self-start">
            <AvatarImage src={friend.photoURL || undefined} alt={friend.displayName} />
            <AvatarFallback>{friend.displayName.charAt(0)}</AvatarFallback>
        </Avatar>
      )}
      <div className={cn(
          'group relative max-w-xs md:max-w-md lg:max-w-lg rounded-2xl px-4 py-2 shadow-sm',
          isCurrentUser ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-background rounded-bl-none'
      )}>
        <p className="text-sm whitespace-pre-wrap">{message.text}</p>
         <p className={cn(
            "text-xs mt-1 text-right opacity-0 group-hover:opacity-100 transition-opacity", 
            isCurrentUser ? "text-primary-foreground/70" : "text-muted-foreground/70"
          )}>
            {displayTime}
        </p>
      </div>
       {isCurrentUser && (
         <Avatar className="h-8 w-8 self-start">
            <AvatarImage src={user?.photoURL || undefined} alt={user?.displayName || "Me"} />
            <AvatarFallback>{user?.displayName?.charAt(0)}</AvatarFallback>
        </Avatar>
      )}
    </div>
  )
}
