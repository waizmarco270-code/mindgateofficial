
'use client';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from './use-auth';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, Timestamp, where, limit, doc, setDoc, writeBatch } from 'firebase/firestore';
import { useUsers } from './use-admin';

export interface Message {
  id: string;
  text: string;
  senderId: string;
  receiverId: string;
  timestamp: Date;
}

const getChatId = (uid1: string, uid2: string) => {
  return [uid1, uid2].sort().join('_');
};

export const useChat = (friendId: string) => {
  const { user } = useAuth();
  const { users } = useUsers();
  const [messages, setMessages] = useState<Message[]>([]);
  const lastMessageRef = useRef<Message | null>(null);

  const friend = useMemo(() => users.find(u => u.uid === friendId), [users, friendId]);

  const chatId = useMemo(() => {
    if (!user) return null;
    return getChatId(user.uid, friendId);
  }, [user, friendId]);

  const showNotification = useCallback((message: Message) => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted' && friend) {
      new Notification(`New message from ${friend.displayName}`, {
        body: message.text,
        icon: friend.photoURL || '/logo.svg',
      });
    }
  }, [friend]);


  useEffect(() => {
    if (!chatId || !user) return;

    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMessages = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: (data.timestamp as Timestamp)?.toDate() || new Date(),
        } as Message;
      });
      
      const newMessages = fetchedMessages.filter(
        msg => !lastMessageRef.current || msg.timestamp > lastMessageRef.current.timestamp
      );

      // Check for new incoming messages to show notification
      if (document.visibilityState === 'hidden' && newMessages.length > 0) {
         const incomingMessage = newMessages.find(m => m.senderId === friendId);
         if(incomingMessage){
            showNotification(incomingMessage);
         }
      }
      
      if (fetchedMessages.length > 0) {
        lastMessageRef.current = fetchedMessages[fetchedMessages.length - 1];
      }
      
      setMessages(fetchedMessages);
    });

    return () => unsubscribe();
  }, [chatId, user, friendId, showNotification]);

  const sendMessage = useCallback(async (text: string) => {
    if (!user || !chatId) return;

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
    
    const batch = writeBatch(db);
    
    const chatDocRef = doc(db, 'chats', chatId);
    const messageDocRef = doc(collection(chatDocRef, 'messages'));

    // Set/update the main chat document
    batch.set(chatDocRef, {
        users: [user.uid, friendId],
        lastMessage: {
            text,
            senderId: user.uid,
            timestamp: serverTimestamp()
        }
    }, { merge: true });

    // Add the new message to the subcollection
    batch.set(messageDocRef, {
      text,
      senderId: user.uid,
      receiverId: friendId,
      timestamp: serverTimestamp(),
    });

    await batch.commit();

  }, [user, chatId, friendId]);

  return { messages, sendMessage };
};
