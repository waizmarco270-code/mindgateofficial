
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bot, ListTodo, Home, Trophy, User, Percent } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { href: '/dashboard/todos', icon: ListTodo, label: 'To-Dos' },
  { href: '/dashboard/ai-assistant', icon: Bot, label: 'Marco AI' },
  { href: '/dashboard/leaderboard', icon: Trophy, label: 'Ranks' },
  { href: '/dashboard/profile', icon: User, label: 'Profile' },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 h-16 border-t bg-background/95 backdrop-blur-sm md:hidden">
      <div className="grid h-full grid-cols-5">
        {navItems.map((item) => {
          const isActive =
            (item.href === '/dashboard' && pathname === '/dashboard') ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              className={cn(
                'flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
