
import { Schedule } from '@/components/schedule/schedule';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function SchedulePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Schedule</h1>
        <p className="text-muted-foreground">Plan your week, month, and beyond.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Study Calendar</CardTitle>
          <CardDescription>Click on a day to add an event, or click an event to view its details.</CardDescription>
        </CardHeader>
        <CardContent>
          <Schedule />
        </CardContent>
      </Card>
    </div>
  );
}
