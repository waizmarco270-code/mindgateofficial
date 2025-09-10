
'use client';

import { ArrowRight, Bell, Bot, CreditCard, ListTodo, Users, Vote, BrainCircuit, Medal } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useAnnouncements, useUsers } from '@/hooks/use-admin';
import { CommunityPoll } from '@/components/dashboard/community-poll';

const quickActions = [
  {
    title: 'Chat with Marco AI',
    description: 'Get instant answers and explanations.',
    icon: Bot,
    href: '/dashboard/ai-assistant',
  },
  {
    title: 'Quiz Zone',
    description: 'Test your knowledge and compete.',
    icon: BrainCircuit,
    href: '/dashboard/quiz',
  },
  {
    title: 'Social Hub',
    description: 'Connect with friends and collaborate.',
    icon: Users,
    href: '/dashboard/social',
  },
];

export default function DashboardPage() {
    const { user } = useAuth();
    const { announcements } = useAnnouncements();
    const { currentUserData } = useUsers();

    const credits = currentUserData?.credits ?? 0;

    const latestAnnouncement = announcements.length > 0 ? announcements[0] : {
        title: 'Welcome to MindMate!',
        description: 'New features and updates are coming soon. Stay tuned!'
    };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome Back, {user?.displayName?.split(' ')[0] || 'Student'}!</h1>
        <p className="text-muted-foreground">Here's a snapshot of your study world.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-8">
           <Card className="bg-gradient-to-br from-primary/20 to-primary/5 border-primary/20 shadow-lg">
                <CardHeader className="flex flex-row items-start gap-4">
                    <div className="bg-primary/80 text-primary-foreground p-3 rounded-full">
                        <Bell className="h-6 w-6" />
                    </div>
                    <div>
                        <CardTitle className="text-primary text-xl">Latest Announcement</CardTitle>
                        <CardDescription className="text-primary/80">Don't miss out on important updates.</CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <h3 className="text-2xl font-bold">{latestAnnouncement.title}</h3>
                    <p className="text-muted-foreground mt-2">
                    {latestAnnouncement.description}
                    </p>
                </CardContent>
            </Card>

            <div className="space-y-4">
                <h2 className="text-2xl font-bold tracking-tight">Quick Actions</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {quickActions.map((action) => (
                    <Link href={action.href} key={action.title} prefetch={true}>
                    <Card className="hover:border-primary hover:shadow-lg hover:-translate-y-1 transition-all h-full flex flex-col group">
                        <CardHeader>
                        <div className="flex items-start gap-4">
                            <div className="bg-muted p-3 rounded-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                            <action.icon className="h-6 w-6 text-primary group-hover:text-primary-foreground transition-colors" />
                            </div>
                            <div>
                            <CardTitle className="text-lg">{action.title}</CardTitle>
                            <CardDescription className="text-sm mt-1">{action.description}</CardDescription>
                            </div>
                        </div>
                        </CardHeader>
                        <CardFooter className="mt-auto">
                        <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                            Launch <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </CardFooter>
                    </Card>
                    </Link>
                ))}
                </div>
            </div>
        </div>

        {/* Side Column */}
        <div className="lg:col-span-1 space-y-8">
            <Card className="border-amber-500/20 bg-amber-500/5">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium flex items-center justify-between text-amber-600">
                        <span>Your Credits</span>
                        <Medal className="h-4 w-4" />
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-6xl font-bold text-amber-500">{credits}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                    +1 for daily tasks, +5 for perfecting quizzes!
                    </p>
                </CardContent>
            </Card>

             <CommunityPoll />
        </div>

      </div>

    </div>
  );
}
