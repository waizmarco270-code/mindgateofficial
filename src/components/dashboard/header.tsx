
'use client';

import { LogOut, Medal, Menu, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserNav } from './user-nav';
import { ThemeToggle } from '../theme-toggle';
import { useSidebar } from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/use-auth';
import { useUsers, useAdmin } from '@/hooks/use-admin';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import Link from 'next/link';


export default function Header() {
  const { setOpenMobile } = useSidebar();
  const { logout } = useAuth();
  const { currentUserData } = useUsers();
  const { isAdmin } = useAdmin();
  
  const credits = currentUserData?.credits ?? 0;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-lg sm:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setOpenMobile(true)}
      >
        <Menu className="h-6 w-6" />
        <span className="sr-only">Toggle Menu</span>
      </Button>
      <div className="flex-1" />
      <div className="flex items-center gap-4">
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="flex cursor-pointer items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground">
                        <Medal className="h-5 w-5 text-yellow-500" />
                        <span>{credits} Credits</span>
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Credits can be used to unlock premium content.</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>

        {isAdmin && (
           <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button asChild variant="ghost" size="icon">
                  <Link href="/dashboard/admin">
                    <Shield className="h-5 w-5 text-primary" />
                    <span className="sr-only">Admin Panel</span>
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Admin Panel</p>
              </TooltipContent>
            </Tooltip>
           </TooltipProvider>
        )}

        <ThemeToggle />
        <UserNav />
        <Button variant="ghost" size="icon" onClick={logout}>
            <LogOut className="h-5 w-5" />
            <span className="sr-only">Log out</span>
        </Button>
      </div>
    </header>
  );
}
