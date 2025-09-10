
'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, DocumentData, doc, deleteDoc, orderBy } from 'firebase/firestore';

export interface QuizQuestion {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
}

export interface Quiz {
  id: string;
  title: string;
  category: string;
  timeLimit: number;
  questions: QuizQuestion[];
  createdAt: string; // Ensure createdAt is part of the type
}

export const useQuizzes = () => {
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        const quizzesColRef = collection(db, 'quizzes');
        // Order by creation date to easily find the newest one
        const q = query(quizzesColRef, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedQuizzes = snapshot.docs.map(doc => {
                const data = doc.data() as DocumentData;
                // Add a unique ID to each question if it doesn't have one
                const questionsWithIds = data.questions.map((q: any, index: number) => ({
                    ...q,
                    id: q.id || `q_${index}`
                }));
                return { 
                    id: doc.id, 
                    ...data,
                    questions: questionsWithIds,
                    createdAt: data.createdAt || new Date(0).toISOString() // Fallback for old quizzes
                } as Quiz;
            });
            setQuizzes(fetchedQuizzes);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching quizzes: ", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);
    
    const deleteQuiz = async (quizId: string) => {
        const quizDocRef = doc(db, 'quizzes', quizId);
        await deleteDoc(quizDocRef);
    }
    
    return { quizzes, loading, deleteQuiz };
}
