
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bot,
  Home,
  Calendar,
  Settings,
  User,
  BookOpen,
  Shield,
  ListTodo,
  BrainCircuit,
  Users,
  Percent,
  Trophy,
  Globe,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '../ui/logo';
import { useUnreadMessages } from '@/hooks/use-unread';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useNewQuiz } from '@/hooks/use-new-quiz';
import { useAdmin } from '@/hooks/use-admin';

const mainNav = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { href: '/dashboard/todos', icon: ListTodo, label: 'To-Dos' },
  { href: '/dashboard/leaderboard', icon: Trophy, label: 'Leaderboard' },
  { href: '/dashboard/ai-assistant', icon: Bot, label: 'Marco AI', highlighted: true },
  { href: '/dashboard/resources', icon: BookOpen, label: 'Resources', highlighted: true },
  { href: '/dashboard/schedule', icon: Calendar, label: 'Schedule' },
  { href: '/dashboard/tracker', icon: BrainCircuit, label: 'Focus Mode' },
  { href: '/dashboard/calculator', icon: Percent, label: 'Percentage Calc' },
  { href: '/dashboard/quiz', icon: BrainCircuit, label: 'Quiz Zone' },
  { href: '/dashboard/social', icon: Users, label: 'Social', highlighted: true },
  { href: '/dashboard/community', icon: Globe, label: 'Community Hub' },
];

const adminNav = [
    { href: '/dashboard/admin', icon: Shield, label: 'Admin Panel' },
]

export default function SidebarContent() {
  const pathname = usePathname();
  const { hasUnread, hasGlobalUnread } = useUnreadMessages();
  const { hasNewQuiz } = useNewQuiz();
  const { isAdmin } = useAdmin();

  const isActive = (href: string) => {
    return (href === '/dashboard' && pathname === href) || (href !== '/dashboard' && pathname.startsWith(href));
  };
  
  const renderNavLinks = (navItems: typeof mainNav) => (
    <div className="grid grid-flow-row auto-rows-max text-sm">
        {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              prefetch={true}
              className={cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted',
                isActive(item.href) 
                  ? 'bg-muted font-medium text-primary' 
                  : item.highlighted 
                  ? 'text-yellow-500 hover:text-yellow-600 dark:text-yellow-400 dark:hover:text-yellow-300'
                  : ''
              )}
            >
              <div className={cn(
                "absolute left-0 h-6 w-1 rounded-r-lg bg-primary transition-transform scale-y-0 group-hover:scale-y-100",
                isActive(item.href) ? "scale-y-100" : ""
              )}></div>
              <item.icon className="h-4 w-4" />
              <span className="flex-1">{item.label}</span>
               {item.href === '/dashboard/social' && hasUnread && (
                 <span className="h-2.5 w-2.5 rounded-full bg-destructive animate-pulse" />
              )}
              {item.href === '/dashboard/community' && hasGlobalUnread && (
                 <span className="h-2.5 w-2.5 rounded-full bg-destructive animate-pulse" />
              )}
               {item.href === '/dashboard/quiz' && hasNewQuiz && (
                 <span className="h-2.5 w-2.5 rounded-full bg-destructive animate-pulse" />
              )}
            </Link>
          ))}
    </div>
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center border-b px-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold" prefetch={true}>
          <Logo className="h-8 w-8 text-primary" />
          <span className="text-lg">MindMate</span>
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto">
        <nav className="grid items-start p-4 text-sm font-medium">
          {renderNavLinks(mainNav)}
        </nav>
      </div>
    </div>
  );
}
