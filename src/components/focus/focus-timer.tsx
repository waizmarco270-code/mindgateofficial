'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, Settings } from 'lucide-react';

const FOCUS_TIME = 25 * 60;
const BREAK_TIME = 5 * 60;

export function FocusTimer() {
  const [time, setTime] = useState(FOCUS_TIME);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [hasNotificationPermission, setHasNotificationPermission] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        setHasNotificationPermission(true);
      }
    }
  }, []);

  const requestNotificationPermission = () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          setHasNotificationPermission(true);
        }
      });
    }
  };


  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const resetTimer = useCallback(() => {
    setIsActive(false);
    setIsBreak(false);
    setTime(FOCUS_TIME);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive && time > 0) {
      interval = setInterval(() => {
        setTime((prevTime) => prevTime - 1);
      }, 1000);
    } else if (isActive && time === 0) {
      if (isBreak) {
        // Break finished, start new focus session
        setIsBreak(false);
        setTime(FOCUS_TIME);
      } else {
        // Focus session finished, start break
        setIsBreak(true);
        setTime(BREAK_TIME);
      }
      // Notify user
      if (hasNotificationPermission) {
        new Notification(isBreak ? 'Time for a break!' : 'Back to focus!');
      }
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isActive, time, isBreak, hasNotificationPermission]);

  const progress = isBreak
    ? ((BREAK_TIME - time) / BREAK_TIME) * 100
    : ((FOCUS_TIME - time) / FOCUS_TIME) * 100;
    
  const strokeDashoffset = 283 * (1 - progress / 100);

  const handleStartPause = () => {
    if(!isActive && !hasNotificationPermission && Notification.permission !== 'denied') {
        requestNotificationPermission();
    }
    setIsActive(!isActive);
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative h-64 w-64">
        <svg className="h-full w-full" viewBox="0 0 100 100">
          <circle
            className="text-muted"
            strokeWidth="7"
            stroke="currentColor"
            fill="transparent"
            r="45"
            cx="50"
            cy="50"
          />
          <circle
            className={isBreak ? "text-accent" : "text-primary"}
            strokeWidth="7"
            strokeDasharray="283"
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r="45"
            cx="50"
            cy="50"
            style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-sm text-muted-foreground">{isBreak ? "Break" : "Focus"}</p>
            <span className="text-5xl font-bold font-mono tabular-nums tracking-tighter">
                {formatTime(time)}
            </span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={resetTimer}>
          <RotateCcw className="h-5 w-5" />
        </Button>
        <Button size="lg" className="w-32" onClick={handleStartPause}>
          {isActive ? <Pause className="mr-2 h-5 w-5" /> : <Play className="mr-2 h-5 w-5" />}
          {isActive ? 'Pause' : 'Start'}
        </Button>
        <Button variant="outline" size="icon">
          <Settings className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
