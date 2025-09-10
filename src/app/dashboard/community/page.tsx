
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Globe, MessageSquare, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatRelative } from 'date-fns';
import { useGlobalChat, type GlobalMessage } from '@/hooks/use-global-chat';
import { useUsers, ADMIN_UIDS, User } from '@/hooks/use-admin';
import { Skeleton } from '@/components/ui/skeleton';
import { useUnreadMessages } from '@/hooks/use-unread';

export default function CommunityHubPage() {
    const { messages, sendMessage, loading: chatLoading } = useGlobalChat();
    const [newMessage, setNewMessage] = useState('');
    const { user: currentUser } = useAuth();
    const { users: allUsers } = useUsers();
    const { markGlobalAsRead } = useUnreadMessages();
   
    useEffect(() => {
      markGlobalAsRead();
    }, []);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim() && currentUser) {
            sendMessage(newMessage);
            setNewMessage('');
        }
    };
    
    if (!currentUser) {
        return <div className="flex h-full items-center justify-center">Loading...</div>
    }

    return (
        <div className="h-full pb-16 md:pb-0">
            <Card className="h-full flex flex-col">
                <CardHeader className="flex flex-row items-center gap-3 p-4 border-b">
                    <Globe className="h-6 w-6 text-primary" />
                    <div>
                        <h2 className="text-xl font-bold">Global Chat</h2>
                        <p className="text-sm text-muted-foreground">
                            Public chat for all members.
                        </p>
                    </div>
                </CardHeader>

                <ScrollArea className="flex-1 bg-muted/20">
                    <div className="p-4 space-y-6">
                         {chatLoading && Array.from({length: 5}).map((_, i) => (
                             <div key={i} className="flex items-start gap-3">
                                 <Skeleton className="h-10 w-10 rounded-full" />
                                 <div className="space-y-1">
                                     <Skeleton className="h-4 w-24" />
                                     <Skeleton className="h-8 w-48" />
                                 </div>
                             </div>
                         ))}
                        {!chatLoading && messages.map((msg) => {
                            const sender = allUsers.find(u => u.uid === msg.senderId);
                            const isCurrentUser = msg.senderId === currentUser?.uid;
                            return (
                                <ChatMessage
                                    key={msg.id}
                                    message={msg}
                                    sender={sender}
                                    isCurrentUser={isCurrentUser}
                                />
                            );
                        })}
                        {!chatLoading && messages.length === 0 && (
                            <div className="text-center text-muted-foreground pt-16 flex flex-col items-center">
                                <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4"/>
                                <h3 className="font-semibold">Welcome to the Global Chat!</h3>
                                <p>Be the first to say something.</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>

                <CardFooter className="p-2 border-t bg-background">
                    <form onSubmit={handleSendMessage} className="flex w-full items-center space-x-2">
                        <Avatar className="h-9 w-9">
                            <AvatarImage src={currentUser.photoURL ?? undefined} />
                            <AvatarFallback>{currentUser.displayName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <Input
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type your message..."
                            autoComplete="off"
                            className="h-12 text-base"
                        />
                        <Button type="submit" size="icon" className="h-12 w-12" disabled={!newMessage.trim()}>
                            <Send className="h-5 w-5" />
                        </Button>
                    </form>
                </CardFooter>
            </Card>
        </div>
    );
}

interface ChatMessageProps {
    message: GlobalMessage;
    sender: User | undefined;
    isCurrentUser: boolean;
}

function ChatMessage({ message, sender, isCurrentUser }: ChatMessageProps) {
    const displayTime = message.timestamp ? formatRelative(message.timestamp, new Date()) : "sending...";
    const isVip = sender ? ADMIN_UIDS.includes(sender.uid) : false;

    return (
        <div className={cn("flex items-start gap-3", isCurrentUser && "justify-end")}>
             {!isCurrentUser && (
                <Avatar className="h-10 w-10">
                    <AvatarImage src={sender?.photoURL ?? undefined} alt={sender?.displayName} />
                    <AvatarFallback>{sender?.displayName.charAt(0) ?? '?'}</AvatarFallback>
                </Avatar>
            )}
            <div className="flex flex-col gap-1 max-w-md">
                 {!isCurrentUser && (
                    <p className="text-xs text-muted-foreground font-semibold px-1 flex items-center gap-1.5">
                        {sender?.displayName ?? 'Unknown User'}
                        {isVip && (
                            <span className="vip-badge">
                                <Crown className="h-3 w-3" /> VIP
                            </span>
                        )}
                    </p>
                 )}
                <div className={cn(
                    'group relative rounded-2xl px-4 py-2 shadow-sm',
                    isCurrentUser 
                        ? 'bg-primary text-primary-foreground rounded-br-none' 
                        : 'bg-background rounded-bl-none'
                )}>
                    <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                    <p className={cn(
                        "text-xs mt-1 text-right opacity-0 group-hover:opacity-100 transition-opacity absolute -bottom-5 right-2", 
                        isCurrentUser ? "text-muted-foreground" : "text-muted-foreground"
                    )}>
                        {displayTime}
                    </p>
                </div>
            </div>
             {isCurrentUser && (
                <Avatar className="h-10 w-10">
                    <AvatarImage src={sender?.photoURL ?? undefined} alt={sender?.displayName} />
                    <AvatarFallback>{sender?.displayName.charAt(0) ?? '?'}</AvatarFallback>
                </Avatar>
            )}
        </div>
    );
}
