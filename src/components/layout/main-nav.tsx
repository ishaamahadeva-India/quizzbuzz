
'use client';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import {
  Home,
  Newspaper,
  Play,
  BarChart2,
  User,
  Settings,
  Star,
  Shield,
  Gift,
  Trophy,
  Users,
  Zap,
  Award,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser, useDoc, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';
import { toast } from '@/hooks/use-toast';


const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/play', label: 'Play', icon: Play, isComingSoon: true },
  { href: '/fantasy', label: 'Fantasy', icon: Trophy },
  { href: '/fantasy/prizes', label: 'Prize Pools', icon: Award },
  { href: '/fan-zone', label: 'Fan Zone', icon: Users },
  { href: '/insights', label: 'Insights', icon: BarChart2 },
  { href: '/redeem', label: 'Rewards', icon: Gift },
  { href: '/profile', label: 'Profile', icon: User },
];

const SUPER_ADMIN_EMAIL = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || 'admin@fantasy.com';

export function MainNav() {
  const pathname = usePathname();
  const { user } = useUser();
  const firestore = useFirestore();
  const userProfileRef = user ? doc(firestore!, 'users', user.uid) : null;
  const { data: userProfile } = useDoc(userProfileRef);

  // Only super admin can see admin link
  const isSuperAdmin = user?.email === SUPER_ADMIN_EMAIL;

  const handlePlayClick = (e: React.MouseEvent) => {
    e.preventDefault();
    toast({
      title: 'Coming Soon',
      description: 'Play features will be available in Version 2.0. Stay tuned!',
      duration: 3000,
    });
  };

  return (
    <div className="flex flex-col justify-between h-full p-2">
      <SidebarMenu>
        {navItems.map((item) => {
           let isActive = pathname === item.href;
           if (item.href === '/fan-zone') {
                isActive = pathname.startsWith('/fan-zone');
           } else if (item.href === '/fantasy') {
                isActive = (pathname.startsWith('/fantasy') || pathname.startsWith('/live-fantasy')) && !pathname.startsWith('/fantasy/prizes');
           } else if (item.href === '/fantasy/prizes') {
                isActive = pathname.startsWith('/fantasy/prizes');
           }
            else if (item.href !== '/') {
                isActive = pathname.startsWith(item.href);
           }

          if (item.isComingSoon) {
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  onClick={handlePlayClick}
                  isActive={isActive}
                  tooltip={item.label}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          }

          return (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={isActive}
                tooltip={item.label}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
        {isSuperAdmin && (
            <SidebarMenuItem>
                <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith('/admin')}
                    tooltip="Admin"
                >
                    <Link href="/admin">
                        <Shield />
                        <span>Admin</span>
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
        )}
      </SidebarMenu>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton tooltip="Settings" asChild>
            <Link href="#">
              <Settings />
              <span>Settings</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </div>
  );
}
