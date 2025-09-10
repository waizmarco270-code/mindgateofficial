
'use client';

import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight, MoreHorizontal, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, getDay, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, query } from 'firebase/firestore';


export interface Event {
  id: string;
  date: string;
  title: string;
  description: string;
  color: string;
}

const colors = ['bg-blue-500', 'bg-green-500', 'bg-red-500', 'bg-yellow-500', 'bg-purple-500'];


export function Schedule() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventColor, setEventColor] = useState(colors[0]);

  // Listen for real-time updates from Firestore
  useEffect(() => {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const eventsColRef = collection(db, 'users', user.uid, 'scheduleEvents');
      const q = query(eventsColRef);

      const unsubscribe = onSnapshot(q, (snapshot) => {
          const fetchedEvents = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Event));
          setEvents(fetchedEvents);
          setLoading(false);
      });

      return () => unsubscribe();

  }, [user]);


  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = [];
  let day = startDate;
  while (day <= endDate) {
    days.push(day);
    day = addDays(day, 1);
  }
  
  const handleAddEventClick = (date: Date) => {
    setSelectedDate(date);
    setIsAddDialogOpen(true);
    setEventTitle('');
    setEventDescription('');
    setSelectedEvent(null);
  };
  
  const handleEventClick = (e: React.MouseEvent, event: Event) => {
      e.stopPropagation(); // Prevent opening the add dialog when clicking an event
      setSelectedEvent(event);
      setSelectedDate(parseISO(event.date));
      setEventTitle(event.title);
      setEventDescription(event.description);
      setEventColor(event.color);
      setIsAddDialogOpen(true);
  }

  const handleSaveEvent = async () => {
    if (!eventTitle || !selectedDate || !user) return;

    const eventData: Omit<Event, 'id'> = {
      date: selectedDate.toISOString(),
      title: eventTitle,
      description: eventDescription,
      color: eventColor,
    };

    if(selectedEvent) {
        // Update existing event
        const eventDocRef = doc(db, 'users', user.uid, 'scheduleEvents', selectedEvent.id);
        await setDoc(eventDocRef, eventData);
    } else {
        // Add new event
        const newEventId = `evt_${Date.now()}`;
        const eventDocRef = doc(db, 'users', user.uid, 'scheduleEvents', newEventId);
        await setDoc(eventDocRef, eventData);
    }

    setIsAddDialogOpen(false);
    setSelectedEvent(null);
  };
  
  const handleDeleteEvent = async () => {
      if(!selectedEvent || !user) return;
      const eventDocRef = doc(db, 'users', user.uid, 'scheduleEvents', selectedEvent.id);
      await deleteDoc(eventDocRef);
      setIsAddDialogOpen(false);
      setSelectedEvent(null);
  }

  const getEventsForDay = (date: Date) => {
    return events.filter(event => isSameDay(parseISO(event.date), date));
  };
  
  const renderEvent = (event: Event) => (
      <TooltipProvider key={event.id}>
        <Tooltip>
            <TooltipTrigger asChild>
                 <div onClick={(e) => handleEventClick(e, event)} className={cn('w-full text-white text-xs rounded px-1 py-0.5 truncate cursor-pointer', event.color)}>
                    {event.title}
                </div>
            </TooltipTrigger>
            <TooltipContent>
                <p className="font-bold">{event.title}</p>
                {event.description && <p>{event.description}</p>}
            </TooltipContent>
        </Tooltip>
      </TooltipProvider>
  )

  return (
    <div className="p-4 rounded-lg border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold text-center w-40">{format(currentDate, 'MMMM yyyy')}</h2>
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button onClick={() => handleAddEventClick(new Date())} disabled={!user}>
          <Plus className="mr-2 h-4 w-4" /> Add Event
        </Button>
      </div>

      <div className="grid grid-cols-7 text-center font-semibold text-sm text-muted-foreground border-b">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="py-2">{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 grid-rows-5">
        {days.map((day, index) => (
          <button
            key={index}
            onClick={() => handleAddEventClick(day)}
            disabled={!user}
            className={cn(
              'border-b border-r p-2 h-32 flex flex-col relative text-left',
              'hover:bg-muted/80 transition-colors duration-200 disabled:hover:bg-transparent disabled:cursor-not-allowed',
              !isSameMonth(day, currentDate) && 'bg-muted/50 text-muted-foreground',
              isSameDay(day, new Date()) && 'bg-primary/10',
              (index % 7 === 0) && 'border-l', // Left border for first column
              (index < 7) && 'border-t' // Top border for first row
            )}
          >
            <span className={cn('font-medium', !isSameMonth(day, currentDate) && 'opacity-50')}>
              {format(day, 'd')}
            </span>
            <div className="flex-1 mt-1 overflow-y-auto space-y-1">
                {getEventsForDay(day).slice(0, 2).map(event => renderEvent(event))}
                {getEventsForDay(day).length > 2 && (
                    <Popover onOpenChange={(open) => open && event.stopPropagation()}>
                        <PopoverTrigger asChild>
                             <button onClick={(e) => e.stopPropagation()} className="text-xs text-muted-foreground hover:underline">
                                +{getEventsForDay(day).length - 2} more
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-2">
                             <div className="space-y-1">
                                {getEventsForDay(day).map(event => renderEvent(event))}
                            </div>
                        </PopoverContent>
                    </Popover>
                )}
            </div>
            {user && (
              <div
                className="absolute bottom-1 right-1 h-6 w-6 rounded-full bg-primary/10 text-primary opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
              >
                <Plus className="h-4 w-4" />
              </div>
            )}
          </button>
        ))}
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedEvent ? 'Edit Event' : 'Add New Event'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="event-title">Event Title</Label>
              <Input id="event-title" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} placeholder="e.g. Study for Physics" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-desc">Description (optional)</Label>
              <Textarea id="event-desc" value={eventDescription} onChange={(e) => setEventDescription(e.target.value)} placeholder="e.g. Chapters 4-5" />
            </div>
             <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2">
                {colors.map(colorClass => (
                  <button
                    key={colorClass}
                    onClick={() => setEventColor(colorClass)}
                    className={cn('h-8 w-8 rounded-full border-2', colorClass, eventColor === colorClass ? 'border-primary' : 'border-transparent')}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="justify-between">
            <div>
             {selectedEvent && (
                <Button variant="destructive" onClick={handleDeleteEvent}>
                    <Trash2 className="mr-2 h-4 w-4"/> Delete
                </Button>
            )}
            </div>
            <div className="flex gap-2">
                <DialogClose asChild>
                     <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={handleSaveEvent}>Save Event</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
