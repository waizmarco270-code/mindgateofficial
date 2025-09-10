
'use client';

import { useState, useMemo, useCallback } from 'react';
import { useQuizzes } from './use-quizzes';
import { useLocalStorage } from './use-local-storage';

export const useNewQuiz = () => {
  const { quizzes, loading } = useQuizzes();
  const [lastVisitedQuizTime, setLastVisitedQuizTime] = useLocalStorage<number>('lastVisitedQuizTime', 0);

  const latestQuizTimestamp = useMemo(() => {
    if (loading || quizzes.length === 0) {
      return 0;
    }
    // Find the most recent creation date among all quizzes
    const latestTime = Math.max(
      ...quizzes.map(quiz => new Date(quiz.createdAt).getTime())
    );
    return latestTime;
  }, [quizzes, loading]);

  const hasNewQuiz = useMemo(() => {
    if (loading) return false;
    return latestQuizTimestamp > lastVisitedQuizTime;
  }, [latestQuizTimestamp, lastVisitedQuizTime, loading]);


  const markAsSeen = useCallback(() => {
    setLastVisitedQuizTime(Date.now());
  }, [setLastVisitedQuizTime]);

  return { hasNewQuiz, markAsSeen };
};
