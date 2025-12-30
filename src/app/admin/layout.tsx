
'use client';
import {
  Home,
  Users,
  FileText,
  BadgePercent,
  Gamepad2,
  Shield,
  Loader2,
  TriangleAlert,
  Ticket,
  Image as ImageIcon,
  BarChart3,
  Calculator,
  Coins,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { type ReactNode, useEffect } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useUser, useDoc, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';
import { cn } from '@/lib/utils';

const adminNavItems = [
  { href: '/admin', label: 'Dashboard', icon: Home },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/rewards', label: 'Rewards', icon: Coins },
  { href: '/admin/campaign-estimator', label: 'Campaign Estimator', icon: Calculator },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/points', label: 'Points Management', icon: Coins },
  { href: '/admin/content', label: 'Content', icon: FileText },
  { href: '/admin/ads', label: 'Advertisements', icon: BadgePercent },
  { href: '/admin/image-ads', label: 'Image Ads', icon: ImageIcon },
  { href: '/admin/fantasy', label: 'Fantasy Games', icon: Gamepad2 },
  { href: '/admin/fanzone', label: 'Fan Zone', icon: Shield },
  { href: '/admin/coupons', label: 'Coupons', icon: Ticket },
];

function AdminSidebar() {
  const pathname = usePathname();
  const { user } = useUser();

  return (
    <aside className="fixed inset-y-0 left-0 z-10 flex-col hidden w-64 border-r bg-gradient-to-b from-background to-muted/20 sm:flex shadow-lg">
      <nav className="flex flex-col h-full gap-2 px-3 py-4">
        <div className="flex items-center gap-3 px-4 py-4 mb-2 border-b bg-gradient-to-r from-primary/5 to-transparent rounded-lg">
          <div className="relative">
            <Avatar className="ring-2 ring-primary/20">
              {user?.photoURL && <AvatarImage src={user.photoURL} />}
              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                {user?.displayName?.charAt(0) || 'A'}
              </AvatarFallback>
            </Avatar>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="font-semibold text-sm truncate">{user?.displayName || 'Admin'}</span>
            <span className="text-xs text-muted-foreground">Administrator</span>
          </div>
        </div>
        <div className="flex-1 space-y-1">
          {adminNavItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 group',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <item.icon className={cn(
                  'w-5 h-5 transition-transform group-hover:scale-110',
                  isActive && 'text-primary-foreground'
                )} />
                <span>{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-foreground/50" />
                )}
              </Link>
            );
          })}
        </div>
        <div className="mt-auto pt-2 border-t">
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-2 hover:bg-muted" 
            asChild
          >
            <Link href="/">
              <Home className="w-4 h-4" />
              Back to App
            </Link>
          </Button>
        </div>
      </nav>
    </aside>
  );
}

const SUPER_ADMIN_EMAIL = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || 'admin@fantasy.com';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, isLoading: userLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  
  // Check superadmin ONLY (from Firebase Auth, available immediately on refresh)
  const isSuperAdmin = user?.email === SUPER_ADMIN_EMAIL;
  
  // Only wait for user loading
  const isLoading = userLoading;
  
  // ONLY super admin is authorized - no other users can access admin panel
  const isAuthorized = isSuperAdmin;

  useEffect(() => {
    // Only redirect if loading is finished AND we're sure the user is not authorized
    if (!isLoading) {
      // If user is not logged in, redirect to home
      if (!user) {
        router.replace('/');
        return;
      }
      // If user is logged in but is NOT the super admin, redirect to home
      if (!isSuperAdmin) {
        router.replace('/');
      }
    }
  }, [isLoading, isSuperAdmin, router, user]);


  // While we are verifying the user's authentication state and admin role,
  // show a loading screen.
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-4">Verifying admin access...</span>
      </div>
    );
  }

  // After loading, if the user is still not authorized, show an access denied message.
  // This handles the case where the user is logged in but is not an admin.
  if (!isAuthorized) {
    return (
       <div className="flex items-center justify-center h-screen">
        <div className='text-center'>
            <TriangleAlert className="w-12 h-12 mx-auto mb-4 text-destructive" />
            <h1 className="text-2xl font-bold">Access Denied</h1>
            <p className="text-muted-foreground">You do not have permission to view this page.</p>
            <Button asChild className="mt-4"><Link href="/">Go to Home</Link></Button>
        </div>
      </div>
    );
  }

  // If all checks pass, render the admin layout with its content.
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-background via-background to-muted/20">
      <AdminSidebar />
      <main className="flex flex-col sm:gap-4 sm:py-4 sm:pl-64">
        <div className="p-4 sm:p-6 sm:max-w-7xl">{children}</div>
      </main>
    </div>
  );
}
