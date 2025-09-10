
'use client';
import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { useAuth } from './use-auth';
import { db } from '@/lib/firebase';
import { collection, doc, onSnapshot, updateDoc, query, where, arrayUnion, arrayRemove, writeBatch } from 'firebase/firestore';
import { User } from './use-admin';
import { useToast } from './use-toast';

interface FriendContextType {
    users: User[];
}

const FriendContext = createContext<FriendContextType | undefined>(undefined);


export const FriendProvider = ({ children }: { children: ReactNode }) => {
    const { user: authUser } = useAuth();
    const { toast } = useToast();
    const [users, setUsers] = useState<User[]>([]);

    useEffect(() => {
        if (!authUser) {
            setUsers([]);
            return;
        }
        // Query for all users EXCEPT the current one
        const usersCol = collection(db, 'users');
        const q = query(usersCol, where('uid', '!=', authUser.uid));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const usersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
            setUsers(usersList);
        });
        return () => unsubscribe();
    }, [authUser]);

    const value: FriendContextType = {
        users,
    };

    return (
        <FriendContext.Provider value={value}>
            {children}
        </FriendContext.Provider>
    );
};


export const useFriends = () => {
    const context = useContext(FriendContext);
    if (!context) {
        throw new Error('useFriends must be used within a FriendProvider');
    }
    return context;
};
