'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Trophy,
  Users,
  Play,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

const mobileNavItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/fantasy', label: 'Fantasy', icon: Trophy },
  { href: '/fan-zone', label: 'Fan Zone', icon: Users },
  { href: '/profile', label: 'Profile', icon: User },
  { href: '/play', label: 'Play', icon: Play, isComingSoon: true },
];

export function MobileFooterNav() {
  const pathname = usePathname();

  const handlePlayClick = (e: React.MouseEvent) => {
    e.preventDefault();
    toast({
      title: 'Coming Soon',
      description: 'Play features will be available in Version 2.0. Stay tuned!',
      duration: 3000,
    });
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {mobileNavItems.map((item) => {
          let isActive = pathname === item.href;

          // Handle active state for nested routes
          if (item.href === '/fan-zone') {
            isActive = pathname.startsWith('/fan-zone');
          } else if (item.href === '/fantasy') {
            isActive = (pathname.startsWith('/fantasy') || pathname.startsWith('/live-fantasy')) && !pathname.startsWith('/fantasy/prizes');
          } else if (item.href !== '/') {
            isActive = pathname.startsWith(item.href);
          }

          if (item.isComingSoon) {
            return (
              <button
                key={item.href}
                onClick={handlePlayClick}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 min-w-0 flex-1 h-full px-2 py-1.5 rounded-lg transition-colors',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <item.icon className={cn(
                  'w-5 h-5 transition-transform',
                  isActive && 'scale-110'
                )} />
                <span className={cn(
                  'text-[10px] font-medium truncate w-full text-center',
                  isActive && 'font-semibold'
                )}>
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 min-w-0 flex-1 h-full px-2 py-1.5 rounded-lg transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <item.icon className={cn(
                'w-5 h-5 transition-transform',
                isActive && 'scale-110'
              )} />
              <span className={cn(
                'text-[10px] font-medium truncate w-full text-center',
                isActive && 'font-semibold'
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

