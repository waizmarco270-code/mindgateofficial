
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './use-auth';
import { db, rtdb } from '@/lib/firebase';
import { ref, onValue, set, onDisconnect, serverTimestamp } from 'firebase/database';
import { doc, getDoc, onSnapshot, collection } from 'firebase/firestore';
import { User } from './use-admin';

export type OnlineUser = Pick<User, 'uid' | 'displayName' | 'photoURL'>;

export const usePresence = () => {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
        setOnlineUsers([]);
        return;
    };

    // Reference to the user's status in Realtime Database
    const myStatusRef = ref(rtdb, 'status/' + user.uid);

    // Firestore document reference for the current user to get their profile info
    const userDocRef = doc(db, 'users', user.uid);

    const setupPresence = async () => {
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) return;
        const userData = userDoc.data() as User;

        const isOfflineForRTDB = {
            state: 'offline',
            last_changed: serverTimestamp(),
        };

        const isOnlineForRTDB = {
            state: 'online',
            last_changed: serverTimestamp(),
        };
        
        const connRef = ref(rtdb, '.info/connected');
        onValue(connRef, (snapshot) => {
            if (snapshot.val() === false) return;
            
            onDisconnect(myStatusRef).set(isOfflineForRTDB).then(() => {
                set(myStatusRef, isOnlineForRTDB);
            });
        });

        // Listen for changes to the 'status' node in RTDB
        const statusRef = ref(rtdb, 'status');
        onValue(statusRef, (snapshot) => {
            const statuses = snapshot.val() || {};
            const onlineUIDs = Object.keys(statuses).filter(uid => statuses[uid].state === 'online');

            // Now, we listen to Firestore for the profiles of online users
            if (onlineUIDs.length > 0) {
                 const usersRef = collection(db, 'users');
                 onSnapshot(usersRef, (usersSnapshot) => {
                     const usersData: OnlineUser[] = [];
                     usersSnapshot.forEach(doc => {
                         if (onlineUIDs.includes(doc.id)) {
                             const u = doc.data() as User;
                             usersData.push({
                                 uid: u.uid,
                                 displayName: u.displayName,
                                 photoURL: u.photoURL,
                             });
                         }
                     });
                     setOnlineUsers(usersData);
                     setLoading(false);
                 });
            } else {
                setOnlineUsers([]);
                setLoading(false);
            }
        });
    }

    setupPresence();

  }, [user]);

  return { onlineUsers, loading };
};
