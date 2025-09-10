
'use client';

import { useState, useEffect, createContext, useContext, ReactNode, useCallback, useMemo } from 'react';
import { useAuth } from './use-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, limit, Timestamp } from 'firebase/firestore';
import { useLocalStorage } from './use-local-storage';

// Private chat interfaces
interface Chat {
  id: string;
  lastMessage: {
    text: string;
    timestamp: Date;
    senderId: string;
  } | null;
}

// Global chat interfaces
interface GlobalChat {
    lastMessage: {
        text: string;
        timestamp: Date;
        senderId: string;
    } | null;
}

interface LastReadTimestamps {
    [chatId: string]: number; // Store timestamp as number for private chats
    global_chat?: number; // Store timestamp for the global chat
}

interface UnreadMessagesContextType {
  unreadChats: Set<string>;
  hasUnread: boolean;
  hasUnreadFrom: (friendId: string) => boolean;
  markAsRead: (friendId: string) => void;
  hasGlobalUnread: boolean;
  markGlobalAsRead: () => void;
}

const UnreadMessagesContext = createContext<UnreadMessagesContextType | undefined>(undefined);

const getChatId = (uid1: string, uid2: string) => {
  return [uid1, uid2].sort().join('_');
};

export const UnreadMessagesProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [globalChat, setGlobalChat] = useState<GlobalChat>({ lastMessage: null });
  const [lastReadTimestamps, setLastReadTimestamps] = useLocalStorage<LastReadTimestamps>('lastReadTimestamps', {});

  // Listen to all private chats the current user is part of
  useEffect(() => {
    if (!user) {
      setChats([]);
      return;
    }
    const chatsRef = collection(db, 'chats');
    const q = query(chatsRef, where('users', 'array-contains', user.uid));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
       const userChats: Chat[] = [];
       snapshot.forEach(doc => {
           const data = doc.data();
           userChats.push({
               id: doc.id,
               lastMessage: data.lastMessage ? {
                   ...data.lastMessage,
                   timestamp: (data.lastMessage.timestamp as Timestamp)?.toDate()
               } : null
           });
       });
       setChats(userChats);
    });

    return () => unsubscribe();
  }, [user]);
  
  // Listen to the latest message in the global chat
  useEffect(() => {
      const globalChatRef = collection(db, 'global_chat');
      const q = query(globalChatRef, orderBy('timestamp', 'desc'), limit(1));

      const unsubscribe = onSnapshot(q, (snapshot) => {
          if(!snapshot.empty) {
              const lastMessageDoc = snapshot.docs[0];
              const data = lastMessageDoc.data();
              setGlobalChat({
                  lastMessage: {
                      ...data,
                      timestamp: (data.timestamp as Timestamp).toDate(),
                  } as any,
              });
          }
      });
      return () => unsubscribe();
  }, []);

  const unreadChats = useMemo(() => {
      const unread = new Set<string>();
      if (!user) return unread;

      chats.forEach(chat => {
          if(chat.lastMessage && chat.lastMessage.senderId !== user.uid) {
              const lastReadTime = lastReadTimestamps[chat.id] || 0;
              if(chat.lastMessage.timestamp.getTime() > lastReadTime) {
                  unread.add(chat.id);
              }
          }
      });
      return unread;
  }, [chats, user, lastReadTimestamps]);

  const hasGlobalUnread = useMemo(() => {
    if (!user || !globalChat.lastMessage) return false;
    // Don't show unread for your own messages
    if (globalChat.lastMessage.senderId === user.uid) return false;

    const lastReadTime = lastReadTimestamps['global_chat'] || 0;
    return globalChat.lastMessage.timestamp.getTime() > lastReadTime;

  }, [globalChat, user, lastReadTimestamps]);


  const markAsRead = useCallback((friendId: string) => {
    if (!user) return;
    const chatId = getChatId(user.uid, friendId);
    setLastReadTimestamps(prev => ({
        ...prev,
        [chatId]: Date.now()
    }));
  }, [user, setLastReadTimestamps]);
  
  const markGlobalAsRead = useCallback(() => {
      setLastReadTimestamps(prev => ({
          ...prev,
          global_chat: Date.now()
      }));
  }, [setLastReadTimestamps]);

  const hasUnreadFrom = useCallback((friendId: string) => {
       if (!user) return false;
       const chatId = getChatId(user.uid, friendId);
       return unreadChats.has(chatId);
  }, [user, unreadChats]);


  const value = {
    unreadChats,
    hasUnread: unreadChats.size > 0,
    hasUnreadFrom,
    markAsRead,
    hasGlobalUnread,
    markGlobalAsRead,
  };

  return (
    <UnreadMessagesContext.Provider value={value}>
      {children}
    </UnreadMessagesContext.Provider>
  );
};


export const useUnreadMessages = () => {
  const context = useContext(UnreadMessagesContext);
  if (context === undefined) {
    throw new Error('useUnreadMessages must be used within an UnreadMessagesProvider');
  }
  return context;
};
