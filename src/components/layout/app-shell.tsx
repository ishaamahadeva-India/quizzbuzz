
'use client';
import type { ReactNode } from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarInset,
  SidebarHeader,
} from '@/components/ui/sidebar';
import { MainNav } from './main-nav';
import { Header } from './header';
import { Footer } from './footer';
import { MobileFooterNav } from './mobile-footer-nav';
import { BookHeart } from 'lucide-react';


export function AppShell({ children }: { children: ReactNode }) {
  return (
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2 px-2 py-1">
              <BookHeart className="w-8 h-8 text-primary" />
              <h1 className="text-xl font-bold font-headline text-foreground">
                quizzbuzz
              </h1>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <MainNav />
          </SidebarContent>
        </Sidebar>
        <SidebarInset className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-1 p-4 md:p-8 lg:p-12 pb-20 md:pb-4">{children}</main>
          <Footer />
          <MobileFooterNav />
        </SidebarInset>
      </SidebarProvider>
  );
}
