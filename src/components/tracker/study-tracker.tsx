
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Pause, RotateCcw, Timer, History, BarChart2, PieChart } from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Pie, Cell, Legend } from 'recharts';
import { useToast } from '@/hooks/use-toast';
import { useVisibilityChange } from '@/hooks/use-visibility-change';
import { format, parseISO, startOfDay, eachDayOfInterval, subDays } from 'date-fns';

interface StudySession {
  subject: string;
  startTime: string;
  endTime: string;
  duration: number; // in seconds
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#ff4d4d", "#4dffff"];

const useLocalStorage = <T,>(key: string, initialValue: T) => {
    const [storedValue, setStoredValue] = useState<T>(() => {
        if (typeof window === 'undefined') return initialValue;
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            return initialValue;
        }
    });

    useEffect(() => {
        if (typeof window !== 'undefined') {
            window.localStorage.setItem(key, JSON.stringify(storedValue));
        }
    }, [key, storedValue]);

    return [storedValue, setStoredValue] as const;
};


export function StudyTracker() {
  const [subject, setSubject] = useState('');
  const [mode, setMode] = useState<'timer' | 'stopwatch'>('stopwatch');
  const [timerDuration, setTimerDuration] = useState(25); // in minutes
  
  const [time, setTime] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);

  const [sessions, setSessions] = useLocalStorage<StudySession[]>('studySessions', []);
  const { toast } = useToast();

  const handlePause = useCallback(() => {
    if (isActive) {
      setIsActive(false);
    }
  }, [isActive]);

  useVisibilityChange(handlePause);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive) {
      interval = setInterval(() => {
        setTime(prevTime => {
            if(mode === 'timer' && prevTime <= 1) {
                // Timer finished
                clearInterval(interval!);
                setIsActive(false);
                saveSession(timerDuration * 60);
                toast({ title: "Session Complete!", description: `Great focus on ${subject}!` });
                return 0;
            }
            return mode === 'timer' ? prevTime - 1 : prevTime + 1;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, mode, subject, timerDuration, toast]);
  
  const saveSession = (duration: number) => {
    if(!subject.trim() || duration < 10) {
        if (duration < 10 && subject.trim()) {
            toast({ variant: 'destructive', title: "Session too short", description: "Study sessions must be at least 10 seconds."});
        }
        return;
    };
    const newSession: StudySession = {
      subject: subject.trim(),
      startTime: (startTime ?? new Date()).toISOString(),
      endTime: new Date().toISOString(),
      duration: Math.round(duration),
    };
    setSessions(prev => [...prev, newSession]);
  };

  const handleStartPause = () => {
    if (!subject.trim()) {
      toast({ variant: 'destructive', title: "No Subject", description: "Please enter a subject to track." });
      return;
    }
    if (isActive) { // Pausing
      setIsActive(false);
      if (mode === 'stopwatch') {
         saveSession(time);
      }
    } else { // Starting
      if (mode === 'timer' && time === 0) {
        setTime(timerDuration * 60);
      } else if (mode === 'stopwatch' && time > 0) {
        // This is a resume after a reset, so we reset time
         setTime(0);
      }
      setStartTime(new Date());
      setIsActive(true);
    }
  };

  const handleReset = () => {
    if(isActive && mode === 'stopwatch' && time > 0) {
        saveSession(time);
    }
    setIsActive(false);
    setTime(0);
  };
  
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = mode === 'timer' && timerDuration > 0
    ? ((timerDuration * 60 - time) / (timerDuration * 60)) * 100
    : 0;

  const dailyData = useMemo(() => {
    const last7Days = eachDayOfInterval({ start: subDays(new Date(), 6), end: new Date() });
    const data = last7Days.map(day => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const daySessions = sessions.filter(s => format(parseISO(s.startTime), 'yyyy-MM-dd') === dayStr);
        const totalMinutes = daySessions.reduce((acc, s) => acc + s.duration, 0) / 60;
        return {
            name: format(day, 'EEE'),
            minutes: Math.round(totalMinutes),
        };
    });
    return data;
  }, [sessions]);

  const subjectData = useMemo(() => {
      const data: {[key: string]: number} = {};
      sessions.forEach(s => {
          data[s.subject] = (data[s.subject] || 0) + s.duration;
      });
      return Object.entries(data).map(([name, value]) => ({ name, value: Math.round(value/60) })).sort((a,b) => b.value - a.value);
  }, [sessions]);

  return (
    <div className="space-y-8">
       <div>
        <h1 className="text-3xl font-bold tracking-tight">Study Tracker</h1>
        <p className="text-muted-foreground">Focus on your subjects and track your progress.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New Study Session</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input id="subject" placeholder="e.g. Quantum Physics" value={subject} onChange={e => setSubject(e.target.value)} disabled={isActive} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="mode">Mode</Label>
                    <Select value={mode} onValueChange={(v: 'timer' | 'stopwatch') => { setMode(v); setTime(0); }} disabled={isActive}>
                        <SelectTrigger id="mode"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="stopwatch">Stopwatch</SelectItem>
                            <SelectItem value="timer">Timer</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                 {mode === 'timer' && (
                     <div className="space-y-2">
                        <Label htmlFor="duration">Duration (minutes)</Label>
                         <Input id="duration" type="number" value={timerDuration} onChange={e => setTimerDuration(Number(e.target.value))} disabled={isActive} />
                    </div>
                 )}
            </div>

            <div className="flex flex-col items-center gap-6 bg-muted p-8 rounded-lg">
                 <div className="relative h-48 w-48">
                    <svg className="h-full w-full" viewBox="0 0 100 100">
                      <circle className="text-border" strokeWidth="7" stroke="currentColor" fill="transparent" r="45" cx="50" cy="50" />
                      {mode === 'timer' && (
                         <circle
                            className="text-primary"
                            strokeWidth="7"
                            strokeDasharray="283"
                            strokeDashoffset={283 * (1 - progress / 100)}
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="transparent"
                            r="45"
                            cx="50"
                            cy="50"
                            style={{ transform: 'rotate(-90deg)', transformOrigin: 'center', transition: 'stroke-dashoffset 1s linear' }}
                          />
                      )}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <p className="text-sm text-muted-foreground">{subject || "No Subject"}</p>
                        <span className="text-5xl font-bold font-mono tabular-nums tracking-tighter">
                            {formatTime(time)}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={handleReset} disabled={!isActive && time === 0}>
                    <RotateCcw className="h-5 w-5" />
                    </Button>
                    <Button size="lg" className="w-32" onClick={handleStartPause}>
                    {isActive ? <Pause className="mr-2 h-5 w-5" /> : <Play className="mr-2 h-5 w-5" />}
                    {isActive ? 'Pause' : (time > 0 ? 'Resume' : 'Start')}
                    </Button>
                    <div className="w-[40px]"></div>
                </div>
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Analytics</CardTitle>
          <CardDescription>Review your study habits over time.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
            <div className="space-y-2">
                 <h3 className="font-semibold flex items-center gap-2"><BarChart2 className="h-5 w-5 text-primary" /> Daily Progress (Last 7 Days)</h3>
                 {sessions.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={dailyData}>
                            <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}m`} />
                            <Tooltip
                                contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                                labelStyle={{ color: 'hsl(var(--foreground))' }}
                                cursor={{fill: 'hsl(var(--muted))'}}
                            />
                            <Bar dataKey="minutes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                 ) : (
                    <p className="text-muted-foreground text-center py-10">No study data yet. Complete a session to see your progress!</p>
                 )}
            </div>
             <div className="space-y-2">
                 <h3 className="font-semibold flex items-center gap-2"><PieChart className="h-5 w-5 text-primary" /> Subject Breakdown</h3>
                 {sessions.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                             <Pie data={subjectData} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value" nameKey="name" label={(entry) => `${entry.name} (${entry.value}m)`}>
                                {subjectData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                                labelStyle={{ color: 'hsl(var(--foreground))' }}
                                formatter={(value, name) => [`${value} minutes`, name]}
                            />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                 ) : (
                    <p className="text-muted-foreground text-center py-10">Your subject breakdown will appear here.</p>
                 )}
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
