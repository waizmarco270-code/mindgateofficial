
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { useUsers } from '@/hooks/use-admin';
import { useFriends } from '@/hooks/use-friends';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Users, Sparkles, MessageSquare, ArrowLeft } from 'lucide-react';
import { UserCard } from '@/components/social/user-card';
import { ChatBox } from '@/components/social/chat-box';
import { type User } from '@/hooks/use-admin';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { UnreadMessagesProvider } from '@/hooks/use-unread';


const UNLOCK_CREDITS = 20;

function SocialPageContent() {
    const { user } = useAuth();
    const { currentUserData, unlockSocialFeature } = useUsers();
    const { users } = useFriends();
    const { toast } = useToast();
    
    const [isUnlockDialogOpen, setIsUnlockDialogOpen] = useState(false);
    const [selectedChatUser, setSelectedChatUser] = useState<User | null>(null);


    const isSocialUnlocked = currentUserData?.socialUnlocked ?? false;
    const currentCredits = currentUserData?.credits ?? 0;

    const handleUnlockWithCredits = () => {
        if (user && currentCredits >= UNLOCK_CREDITS) {
            unlockSocialFeature(user.uid);
            setIsUnlockDialogOpen(false);
            toast({
                title: `Social Feature Unlocked!`,
                description: `You can now connect with friends. ${UNLOCK_CREDITS} credits were used.`,
            });
        } else {
            toast({
                variant: 'destructive',
                title: 'Insufficient Credits',
                description: `You need at least ${UNLOCK_CREDITS} credits to unlock this feature.`,
            });
        }
    };
    
    if (!isSocialUnlocked) {
        return (
            <>
                <div className="flex flex-col items-center justify-center h-full text-center p-8 rounded-xl bg-muted/40 border-2 border-dashed">
                    <div className="p-5 rounded-full bg-primary/10 mb-4">
                        <Sparkles className="h-12 w-12 text-primary" />
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight">Connect & Collaborate</h1>
                    <p className="text-muted-foreground mt-2 max-w-lg">Unlock the Social Hub to add friends, start conversations, and study together. This is a one-time unlock.</p>
                    <Button size="lg" className="mt-6 text-lg py-7" onClick={() => setIsUnlockDialogOpen(true)}>
                        Unlock Social Hub for {UNLOCK_CREDITS} Credits
                    </Button>
                </div>
                
                <Dialog open={isUnlockDialogOpen} onOpenChange={setIsUnlockDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="text-2xl">Unlock Social Hub</DialogTitle>
                            <DialogDescription>
                                Are you sure? This is a one-time purchase for permanent access to the friend and chat system.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="my-6 space-y-4">
                            <div className="flex items-center justify-around text-center p-4 bg-muted rounded-lg">
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Your Balance</p>
                                    <p className="text-2xl font-bold">{currentCredits}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Unlock Cost</p>
                                    <p className="text-2xl font-bold text-destructive">-{UNLOCK_CREDITS}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">New Balance</p>
                                    <p className="text-2xl font-bold text-green-500">{Math.max(0, currentCredits - UNLOCK_CREDITS)}</p>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline">Cancel</Button>
                            </DialogClose>
                            <Button onClick={handleUnlockWithCredits} disabled={currentCredits < UNLOCK_CREDITS}>
                                {currentCredits < UNLOCK_CREDITS ? "Not Enough Credits" : "Confirm & Unlock"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </>
        );
    }
    
    // UI for when the feature is unlocked
    return (
       <div className={cn(
         "h-full grid grid-cols-1 md:grid-cols-[350px_1fr] lg:grid-cols-[400px_1fr] gap-4 md:pb-0",
         "transition-all duration-300 ease-in-out"
       )}>
            {/* User List Panel */}
            <div className={cn(
                "h-full flex-col col-span-1 border rounded-lg",
                "md:flex", // Always visible on desktop
                selectedChatUser ? "hidden" : "flex" // Hide on mobile when chat is open
            )}>
                <div className="flex-shrink-0 p-4 border-b">
                    <h2 className="text-xl font-bold flex items-center gap-2"><Users /> All Users</h2>
                </div>
                <ScrollArea className="flex-grow">
                    <div className="flex flex-col gap-1 p-1">
                        {users.map(u => (
                            <UserCard 
                                key={u.id}
                                user={u}
                                onSelectChat={() => setSelectedChatUser(u)}
                                isSelected={selectedChatUser?.uid === u.uid}
                            />
                        ))}
                         {users.length === 0 && (
                            <p className="text-center text-muted-foreground p-4">No other users found.</p>
                         )}
                    </div>
                </ScrollArea>
            </div>

             {/* Chat Box Panel */}
             <div className={cn(
                "h-full",
                "md:flex", // Always flex on desktop
                selectedChatUser ? "flex flex-col" : "hidden" // Show on mobile when chat is open
             )}>
                {selectedChatUser ? (
                    <ChatBox 
                        friend={selectedChatUser} 
                        onBack={() => setSelectedChatUser(null)}
                    />
                ) : (
                    <div className="hidden h-full flex-col items-center justify-center rounded-lg border-2 border-dashed bg-muted/40 md:flex">
                         <div className="p-5 rounded-full bg-primary/10 mb-4">
                            <MessageSquare className="h-12 w-12 text-primary" />
                        </div>
                        <h2 className="text-2xl font-bold">Select a user to chat</h2>
                        <p className="text-muted-foreground">Your conversations will appear here.</p>
                    </div>
                )}
            </div>
       </div>
    );
}

export default function SocialPage() {
    return (
        <SocialPageContent />
    )
}
