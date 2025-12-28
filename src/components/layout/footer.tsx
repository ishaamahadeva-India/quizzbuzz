'use client';

import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="hidden md:block border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 md:py-4">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 md:gap-4 text-xs text-muted-foreground">
          <span className="shrink-0">© {currentYear} quizzbuzz. All rights reserved.</span>
          <span className="hidden sm:inline text-muted-foreground/50">•</span>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 md:gap-4">
            <Link href="/terms" className="hover:text-foreground transition-colors whitespace-nowrap">
              Terms & Conditions
            </Link>
            <span className="text-muted-foreground/50">•</span>
            <Link href="/privacy" className="hover:text-foreground transition-colors whitespace-nowrap">
              Privacy Policy
            </Link>
            <span className="text-muted-foreground/50">•</span>
            <a href="mailto:support@fantasy.com" className="hover:text-foreground transition-colors whitespace-nowrap">
              Contact Support
            </a>
            <span className="text-muted-foreground/50">•</span>
            <a href="mailto:privacy@fantasy.com" className="hover:text-foreground transition-colors whitespace-nowrap">
              Privacy Inquiries
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

