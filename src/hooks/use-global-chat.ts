
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './use-auth';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, Timestamp, limit } from 'firebase/firestore';

export interface GlobalMessage {
  id: string;
  text: string;
  senderId: string;
  timestamp: Date;
}

const GLOBAL_CHAT_COLLECTION = 'global_chat';

export const useGlobalChat = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<GlobalMessage[]>([]);
  const [loading, setLoading] = useState(true);

  // Listen to global chat messages
  useEffect(() => {
    setLoading(true);
    const messagesRef = collection(db, GLOBAL_CHAT_COLLECTION);
    const q = query(messagesRef, orderBy('timestamp', 'desc'), limit(50));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMessages = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: (data.timestamp as Timestamp)?.toDate() || new Date(),
        } as GlobalMessage;
      }).reverse(); // Reverse to show newest messages at the bottom
      setMessages(fetchedMessages);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching global chat:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!user) return;

    const messagesRef = collection(db, GLOBAL_CHAT_COLLECTION);
    await addDoc(messagesRef, {
      text,
      senderId: user.uid,
      timestamp: serverTimestamp(),
    });
  }, [user]);

  return { messages, sendMessage, loading };
};
