'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Users, BarChart3, Trophy, Wrench, Table2 } from 'lucide-react';

const links = [
  { href: '/admin/fantasy/ipl/matches', title: 'Matches', desc: 'Create, edit, start/end matches', icon: Calendar },
  { href: '/admin/fantasy/ipl/players', title: 'Players', desc: 'Add/edit players, roles, emerging flag', icon: Users },
  { href: '/admin/fantasy/ipl/scoring', title: 'Scoring & selection %', desc: 'Resync selection %, run match scoring', icon: Trophy },
  { href: '/admin/fantasy/ipl/results', title: 'Results', desc: 'Leaderboard & user history', icon: BarChart3 },
  { href: '/admin/fantasy/ipl/tools', title: 'Tools', desc: 'Recalc totals, fix data, reset match', icon: Wrench },
];

export default function AdminIPLFantasyHubPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">IPL Fantasy — Admin</h1>
        <p className="text-muted-foreground mt-1">
          Manage matches, players, stats, scoring, and monitoring. Access: super-admin email or{' '}
          <code className="text-xs bg-muted px-1 rounded">users.isAdmin</code>. Alias URLs:{' '}
          <code className="text-xs">/admin/fantasy/matches</code> → here.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {links.map(({ href, title, desc, icon: Icon }) => (
          <Card key={href} className="hover:border-primary/40 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Icon className="w-5 h-5 text-primary" />
                {title}
              </CardTitle>
              <CardDescription>{desc}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href={href}>Open</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Table2 className="w-4 h-4" />
            Stats entry
          </CardTitle>
          <CardDescription>
            Open a match from <strong>Matches</strong>, then use <strong>Enter stats</strong> to edit player_match_stats for that fixture.
          </CardDescription>
        </CardHeader>
      </Card>
      <Button variant="ghost" asChild>
        <Link href="/admin/fantasy">← Back to Fantasy Games</Link>
      </Button>
    </div>
  );
}
