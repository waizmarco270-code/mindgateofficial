
'use client';
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useAuth } from './use-auth';
import { db } from '@/lib/firebase';
import { collection, doc, onSnapshot, updateDoc, getDoc, query, setDoc, where, getDocs, increment, writeBatch, orderBy, addDoc, serverTimestamp, deleteDoc, arrayUnion } from 'firebase/firestore';


// ============================================================================
//  TYPES & INITIAL DATA
// ============================================================================

export const ADMIN_UIDS = ['23j2N4p0ZgUnCqTBrrppkYtD2fI3', 'ZOMxxdfjCTR3Be1K8YV8a5AWRQP2', 'frRmURwVLifOacZj855JezyECWX2', 'oY64QlJ6v5ZOJC7eoYQ3L6wXLhW2' , 'Lkyn95mVyVNTiNnn1YsGeiHWlib2'];

export interface User {
  id: string; // Document ID from Firestore
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  isBlocked: boolean;
  credits: number;
  votedPolls?: Record<string, string>; // { pollId: 'chosen_option' }
  socialUnlocked?: boolean; 
  perfectedQuizzes?: string[]; // Array of quiz IDs the user got a perfect score on
  quizAttempts?: Record<string, number>; // { quizId: attemptCount }
}

export interface Announcement {
    id: string;
    title: string;
    description: string;
    createdAt: string;
}

export interface Resource {
    id: string;
    title: string;
    description: string;
    url: string;
    createdAt: string;
}

export interface Poll {
    id: string;
    question: string;
    options: string[];
    results: Record<string, number>;
    isActive: boolean;
    createdAt: string;
}


// ============================================================================
//  CONTEXT DEFINITIONS
// ============================================================================

interface AppDataContextType {
    isAdmin: boolean;
    users: User[];
    currentUserData: User | null;
    toggleUserBlock: (uid: string, isBlocked: boolean) => Promise<void>;
    addCreditsToUser: (uid: string, amount: number) => Promise<void>;
    giftCreditsToUser: (uid: string, amount: number) => Promise<void>;
    resetUserCredits: (uid: string) => Promise<void>;
    unlockSocialFeature: (uid: string) => Promise<void>;
    addPerfectedQuiz: (uid: string, quizId: string) => Promise<void>;
    incrementQuizAttempt: (uid: string, quizId: string) => Promise<void>;
    
    announcements: Announcement[];
    addAnnouncement: (announcement: Omit<Announcement, 'id' | 'createdAt'>) => Promise<void>;
    deleteAnnouncement: (id: string) => Promise<void>;
    
    resources: Resource[];
    addResource: (resource: Omit<Resource, 'id' | 'createdAt'>) => Promise<void>;
    updateResource: (id: string, data: Partial<Resource>) => Promise<void>;
    deleteResource: (id: string) => Promise<void>;
    
    premiumResources: Resource[];
    addPremiumResource: (resource: Omit<Resource, 'id' | 'createdAt'>) => Promise<void>;
    updatePremiumResource: (id: string, data: Partial<Resource>) => Promise<void>;
    deletePremiumResource: (id: string) => Promise<void>;

    jeeResources: Resource[];
    addJeeResource: (resource: Omit<Resource, 'id' | 'createdAt'>) => Promise<void>;
    updateJeeResource: (id: string, data: Partial<Resource>) => Promise<void>;
    deleteJeeResource: (id: string) => Promise<void>;

    class12Resources: Resource[];
    addClass12Resource: (resource: Omit<Resource, 'id' | 'createdAt'>) => Promise<void>;
    updateClass12Resource: (id: string, data: Partial<Resource>) => Promise<void>;
    deleteClass12Resource: (id: string) => Promise<void>;

    loading: boolean;
    
    activePoll: Poll | null;
    submitPollVote: (pollId: string, option: string) => Promise<void>;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

// ============================================================================
//  MAIN DATA PROVIDER COMPONENT
// ============================================================================

export const AppDataProvider = ({ children }: { children: ReactNode }) => {
    const { user: authUser } = useAuth();

    // STATE MANAGEMENT
    const [isAdmin, setIsAdmin] = useState(false);
    const [users, setUsers] = useState<User[]>([]);
    const [currentUserData, setCurrentUserData] = useState<User | null>(null);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [resources, setResources] = useState<Resource[]>([]);
    const [premiumResources, setPremiumResources] = useState<Resource[]>([]);
    const [jeeResources, setJeeResources] = useState<Resource[]>([]);
    const [class12Resources, setClass12Resources] = useState<Resource[]>([]);
    const [activePoll, setActivePoll] = useState<Poll | null>(null);
    const [loading, setLoading] = useState(true);

    // EFFECT: Determine if the logged-in user is an admin
    useEffect(() => {
        setIsAdmin(!!authUser && ADMIN_UIDS.includes(authUser.uid));
    }, [authUser]);

    // EFFECT: Listen for real-time updates to the ALL users collection (for Admin Panel)
    useEffect(() => {
        const usersCol = collection(db, 'users');
        const q = query(usersCol);
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const usersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
            setUsers(usersList);
        });
        return () => unsubscribe();
    }, []);

    // EFFECT: Listen for real-time updates for the CURRENTLY LOGGED-IN user's data (for credits, etc.)
    useEffect(() => {
        if (authUser?.uid) {
            const userDocRef = doc(db, 'users', authUser.uid);
            const unsubscribe = onSnapshot(userDocRef, (doc) => {
                if (doc.exists()) {
                    setCurrentUserData({ id: doc.id, ...doc.data() } as User);
                } else {
                    setCurrentUserData(null);
                }
            });
            return () => unsubscribe();
        } else {
            setCurrentUserData(null);
        }
    }, [authUser]);
    
    // EFFECT: Listen for global data (announcements, resources, polls)
    useEffect(() => {
        setLoading(true);
        const announcementsQuery = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
        const resourcesQuery = query(collection(db, 'generalResources'), orderBy('createdAt', 'desc'));
        const premiumResourcesQuery = query(collection(db, 'premiumResources'), orderBy('createdAt', 'desc'));
        const jeeResourcesQuery = query(collection(db, 'jeeResources'), orderBy('createdAt', 'desc'));
        const class12ResourcesQuery = query(collection(db, 'class12Resources'), orderBy('createdAt', 'desc'));
        const pollsQuery = query(collection(db, 'polls'), where('isActive', '==', true));

        const unsubAnnouncements = onSnapshot(announcementsQuery, (snapshot) => {
            setAnnouncements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement)));
        });
        const unsubResources = onSnapshot(resourcesQuery, (snapshot) => {
            setResources(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Resource)));
        });
        const unsubPremium = onSnapshot(premiumResourcesQuery, (snapshot) => {
            setPremiumResources(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Resource)));
        });
        const unsubJee = onSnapshot(jeeResourcesQuery, (snapshot) => {
            setJeeResources(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Resource)));
        });
        const unsubClass12 = onSnapshot(class12ResourcesQuery, (snapshot) => {
            setClass12Resources(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Resource)));
        });
        const unsubPolls = onSnapshot(pollsQuery, (snapshot) => {
            if (!snapshot.empty) {
                const pollDoc = snapshot.docs[0];
                setActivePoll({ id: pollDoc.id, ...pollDoc.data() } as Poll);
            } else {
                setActivePoll(null);
            }
        });
        
        Promise.all([getDocs(announcementsQuery), getDocs(resourcesQuery), getDocs(premiumResourcesQuery), getDocs(pollsQuery), getDocs(jeeResourcesQuery), getDocs(class12ResourcesQuery)])
          .finally(() => setLoading(false));


        return () => {
            unsubAnnouncements();
            unsubResources();
            unsubPremium();
            unsubPolls();
            unsubJee();
            unsubClass12();
        };
    }, []);


    // FUNCTIONS: Actions that modify data

    const toggleUserBlock = async (uid: string, isBlocked: boolean) => {
        const userDocRef = doc(db, 'users', uid);
        await updateDoc(userDocRef, { isBlocked: !isBlocked });
    };

    const addCreditsToUser = async (uid: string, amount: number) => {
        if (!uid) return;
        const userDocRef = doc(db, 'users', uid);
        await updateDoc(userDocRef, { credits: increment(amount) });
    };

    const giftCreditsToUser = async (uid: string, amount: number) => {
        if (!uid || !Number.isFinite(amount) || amount <= 0) return;
        const userDocRef = doc(db, 'users', uid);
        await updateDoc(userDocRef, { credits: increment(amount) });
    };
    
    const resetUserCredits = async (uid: string) => {
        if (!uid) return;
        const userDocRef = doc(db, 'users', uid);
        await updateDoc(userDocRef, { credits: 50 });
    };
    
    const unlockSocialFeature = async (uid: string) => {
        if (!uid) return;
        const userDocRef = doc(db, 'users', uid);
        await updateDoc(userDocRef, { socialUnlocked: true, credits: increment(-20) });
    };

    const addPerfectedQuiz = async (uid: string, quizId: string) => {
        if(!uid || !quizId) return;
        const userDocRef = doc(db, 'users', uid);
        await updateDoc(userDocRef, {
            perfectedQuizzes: arrayUnion(quizId)
        });
    }

    const incrementQuizAttempt = async (uid: string, quizId: string) => {
        if (!uid || !quizId) return;
        const userDocRef = doc(db, 'users', uid);
        await updateDoc(userDocRef, {
            [`quizAttempts.${quizId}`]: increment(1)
        });
    };

    const addAnnouncement = async (announcement: Omit<Announcement, 'id' | 'createdAt'>) => {
        await addDoc(collection(db, 'announcements'), {
            ...announcement,
            createdAt: serverTimestamp()
        });
    }
    const deleteAnnouncement = async (id: string) => await deleteDoc(doc(db, 'announcements', id));

    const addResource = async (resource: Omit<Resource, 'id' | 'createdAt'>) => {
        await addDoc(collection(db, 'generalResources'), { ...resource, createdAt: serverTimestamp() });
    }
    const updateResource = async (id: string, data: Partial<Resource>) => await updateDoc(doc(db, 'generalResources', id), data);
    const deleteResource = async (id: string) => await deleteDoc(doc(db, 'generalResources', id));
    
    const addPremiumResource = async (resource: Omit<Resource, 'id' | 'createdAt'>) => {
         await addDoc(collection(db, 'premiumResources'), { ...resource, createdAt: serverTimestamp() });
    }
    const updatePremiumResource = async (id: string, data: Partial<Resource>) => await updateDoc(doc(db, 'premiumResources', id), data);
    const deletePremiumResource = async (id: string) => await deleteDoc(doc(db, 'premiumResources', id));

    const addJeeResource = async (resource: Omit<Resource, 'id' | 'createdAt'>) => {
         await addDoc(collection(db, 'jeeResources'), { ...resource, createdAt: serverTimestamp() });
    }
    const updateJeeResource = async (id: string, data: Partial<Resource>) => await updateDoc(doc(db, 'jeeResources', id), data);
    const deleteJeeResource = async (id: string) => await deleteDoc(doc(db, 'jeeResources', id));

    const addClass12Resource = async (resource: Omit<Resource, 'id' | 'createdAt'>) => {
         await addDoc(collection(db, 'class12Resources'), { ...resource, createdAt: serverTimestamp() });
    }
    const updateClass12Resource = async (id: string, data: Partial<Resource>) => await updateDoc(doc(db, 'class12Resources', id), data);
    const deleteClass12Resource = async (id: string) => await deleteDoc(doc(db, 'class12Resources', id));


    const submitPollVote = async (pollId: string, option: string) => {
        if (!authUser) return;

        const pollRef = doc(db, 'polls', pollId);
        const userRef = doc(db, 'users', authUser.uid);

        const batch = writeBatch(db);
        batch.update(pollRef, { [`results.${option}`]: increment(1) });
        batch.update(userRef, { [`votedPolls.${pollId}`]: option });
        await batch.commit();
    };

    // CONTEXT VALUE
    const value: AppDataContextType = {
        isAdmin,
        users,
        currentUserData,
        toggleUserBlock,
        addCreditsToUser,
        giftCreditsToUser,
        resetUserCredits,
        unlockSocialFeature,
        addPerfectedQuiz,
        incrementQuizAttempt,
        announcements,
        addAnnouncement,
        deleteAnnouncement,
        resources,
        addResource,
        updateResource,
        deleteResource,
        premiumResources,
        addPremiumResource,
        updatePremiumResource,
        deletePremiumResource,
        jeeResources,
        addJeeResource,
        updateJeeResource,
        deleteJeeResource,
        class12Resources,
        addClass12Resource,
        updateClass12Resource,
        deleteClass12Resource,
        loading,
        activePoll,
        submitPollVote,
    };

    return (
        <AppDataContext.Provider value={value}>
            {children}
        </AppDataContext.Provider>
    );
};

// =_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=
//  CONVENIENCE HOOKS
// =_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=

export const useAdmin = () => {
    const context = useContext(AppDataContext);
    if (!context) throw new Error('useAdmin must be used within an AppDataProvider');
    return context;
};

export const useUsers = () => {
    const context = useContext(AppDataContext);
    if (!context) throw new Error('useUsers must be used within an AppDataProvider');
    return context;
};

export const useAnnouncements = () => {
    const context = useContext(AppDataContext);
    if (!context) throw new Error('useAnnouncements must be used within an AppDataProvider');
    return context;
};

export const useResources = () => {
    const context = useContext(AppDataContext);
    if (!context) throw new Error('useResources must be used within an AppDataProvider');
    return context;
};

export const usePolls = () => {
    const context = useContext(AppDataContext);
    if(!context) throw new Error('usePolls must be used within an AppDataProvider');
    return context;
}
