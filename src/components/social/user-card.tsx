
'use client';

import { User, ADMIN_UIDS } from '@/hooks/use-admin';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { useUnreadMessages } from '@/hooks/use-unread';

interface UserCardProps {
    user: User;
    onSelectChat?: () => void;
    isSelected?: boolean;
}

export function UserCard({ 
    user,
    onSelectChat, 
    isSelected 
}: UserCardProps) {
    const isCurrentUserAdmin = ADMIN_UIDS.includes(user.uid);
    const { hasUnreadFrom } = useUnreadMessages();
    const hasUnread = hasUnreadFrom(user.uid);

    return (
        <Button
            variant="ghost"
            className={cn(
                "w-full h-auto justify-start p-2 relative",
                isSelected && "bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary"
            )}
            onClick={onSelectChat}
        >
            <div className="flex items-center gap-3 overflow-hidden w-full">
                <Avatar className="h-10 w-10 border-2 border-muted flex-shrink-0">
                    <AvatarImage src={user.photoURL || `https://picsum.photos/150/150?u=${user.uid}`} alt={user.displayName} />
                    <AvatarFallback>{user.displayName?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="truncate">
                    <h3 className="font-semibold text-sm flex items-center gap-2 truncate">
                        <span className="truncate">{user.displayName}</span>
                        {isCurrentUserAdmin && (
                            <span className="vip-badge flex-shrink-0">
                                <Crown className="h-3 w-3" /> VIP
                            </span>
                        )}
                    </h3>
                </div>
            </div>
            {hasUnread && <div className="absolute right-3 top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-destructive" />}
        </Button>
    )
}
