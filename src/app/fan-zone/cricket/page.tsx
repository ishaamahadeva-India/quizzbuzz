
'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Lock, Search, SlidersHorizontal, Flame, BarChartHorizontal, BarChart2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AnimatePresence, motion } from 'framer-motion';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

type Cricketer = {
    id: string;
    name: string;
    roles: string[];
    country: string;
    avatarUrl?: string;
    trendingRank?: number;
    consistencyIndex: number;
    impactScore: number;
}

type TeamProfile = {
    id: string;
    name: string;
    type: 'ip' | 'national';
    logoUrl?: string;
}


function CricketersTab({
  searchTerm,
  filters,
}: {
  searchTerm: string;
  filters: { roles: string[]; countries: string[] };
}) {
  const firestore = useFirestore();
  const cricketersQuery = firestore ? collection(firestore, 'cricketers') : null;
  const { data: cricketers, isLoading } = useCollection(cricketersQuery);

  const filteredCricketers =
    cricketers
      ?.filter((cricketer) =>
        cricketer.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .filter((cricketer) => {
        if (filters.roles.length > 0) {
          if (!cricketer.roles || !filters.roles.some((role) => cricketer.roles.includes(role))) {
            return false;
          }
        }
        if (filters.countries.length > 0) {
          if (!filters.countries.includes(cricketer.country)) {
            return false;
          }
        }
        return true;
      }) || [];

   if (isLoading) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(6)].map((_, i) => (
                <Card key={i}>
                    <CardContent className="p-4 flex flex-col gap-2">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                    </CardContent>
                </Card>
            ))}
        </div>
    )
   }

  if (filteredCricketers.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        No cricketers found matching your criteria.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {filteredCricketers.map((cricketer) => (
        <Link
          href={`/fan-zone/cricket/cricketer/${cricketer.id}`}
          key={cricketer.id}
          className="group"
        >
          <Card className="h-full hover:border-primary/50 transition-colors">
            <CardContent className="p-4 flex flex-col gap-2 h-full">
              <h3 className="font-bold font-headline text-base group-hover:text-primary">
                {cricketer.name}
              </h3>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">Country:</span> {cricketer.country || 'N/A'}
                </p>
                {cricketer.roles && cricketer.roles.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Role:</span> {cricketer.roles.join(', ')}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

function TeamsTab({ type, searchTerm }: { type: 'national' | 'ip', searchTerm: string }) {
  const firestore = useFirestore();
  const teamsQuery = firestore ? query(collection(firestore, 'teams'), where('type', '==', type)) : null;
  const { data: teams, isLoading } = useCollection(teamsQuery);
  
  const filteredTeams =
    teams?.filter((team) =>
        team.name.toLowerCase().includes(searchTerm.toLowerCase())
      ) || [];

  if (isLoading) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(6)].map((_, i) => (
                <Card key={i}>
                    <CardContent className="p-4 flex flex-col gap-2">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                    </CardContent>
                </Card>
            ))}
        </div>
    )
  }

  if (filteredTeams.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        No {type} teams found.
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {filteredTeams.map((team) => (
        <Link
          href={`/fan-zone/cricket/${type}-team/${team.id}`}
          key={team.id}
          className="group"
        >
          <Card className="h-full hover:border-primary/50 transition-colors">
            <CardContent className="p-4 flex flex-col gap-2 h-full">
              <h3 className="font-bold font-headline text-base group-hover:text-primary">
                {team.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Type:</span> {type === 'ip' ? 'IPL Team' : 'National Team'}
              </p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}


function TrendingTab() {
  const firestore = useFirestore();
  const cricketersQuery = firestore ? query(collection(firestore, 'cricketers'), where('trendingRank', '>', 0), orderBy('trendingRank'), limit(5)) : null;
  const { data: cricketers, isLoading } = useCollection(cricketersQuery);

  if (isLoading) {
    return <Card><CardContent><Skeleton className="h-64" /></CardContent></Card>
  }
  
  if (!cricketers || cricketers.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <p>No trending cricketers at the moment.</p>
          <p className="text-sm mt-2">Cricketers with trendingRank set will appear here.</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-2xl flex items-center gap-2">
          <Flame className="text-primary" /> Trending Cricketers
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {cricketers.map((cricketer, index) => (
            <li key={cricketer.id}>
              <Link href={`/fan-zone/cricket/cricketer/${cricketer.id}`} className="group">
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-bold font-code text-muted-foreground w-8 text-center shrink-0">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <h3 className="font-bold font-headline text-lg leading-tight group-hover:text-primary">
                      {cricketer.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 mt-1">
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Country:</span> {cricketer.country || 'N/A'}
                      </p>
                      {cricketer.roles && cricketer.roles.length > 0 && (
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">Role:</span> {cricketer.roles.join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
              {index < cricketers.length - 1 && (
                <Separator className="mt-4" />
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function StatBar({ label, value1, value2, higherIsBetter = true }: { label: string, value1: number, value2: number, higherIsBetter?: boolean }) {
  const p1_is_winner = higherIsBetter ? value1 > value2 : value1 < value2;
  const p2_is_winner = higherIsBetter ? value2 > value1 : value2 < value1;
  const is_tie = value1 === value2;
  
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1 text-sm font-medium">
        <span className={`${p1_is_winner && 'text-primary'}`}>{value1}</span>
        <span className="text-muted-foreground">{label}</span>
        <span className={`${p2_is_winner && 'text-primary'}`}>{value2}</span>
      </div>
      <div className="flex items-center gap-1">
        <div className={`h-2 w-1/2 rounded-l-full ${p1_is_winner || is_tie ? 'bg-primary' : 'bg-muted'}`} />
        <div className={`h-2 w-1/2 rounded-r-full ${p2_is_winner || is_tie ? 'bg-primary' : 'bg-muted'}`} />
      </div>
    </div>
  );
}

function AnalystViewTab() {
  const firestore = useFirestore();
  const cricketersQuery = firestore ? collection(firestore, 'cricketers') : null;
  const { data: cricketers, isLoading } = useCollection(cricketersQuery);

  const [player1, setPlayer1] = useState<string | undefined>(undefined);
  const [player2, setPlayer2] = useState<string | undefined>(undefined);

  const getPlayerById = (id: string | undefined): Cricketer | undefined => {
      if (!id || !cricketers) return undefined;
      return cricketers.find((p: any) => p.id === id) as any as Cricketer | undefined;
  }

  const p1Data = getPlayerById(player1);
  const p2Data = getPlayerById(player2);

  return (
      <Card>
        <CardHeader>
            <CardTitle className="font-headline">Analyst View</CardTitle>
            <CardDescription>Compare player stats head-to-head. A premium analytics feature.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
              <div className="flex flex-col items-center gap-2">
                 <h3 className="font-semibold text-lg">Player 1</h3>
                  <Select onValueChange={setPlayer1} value={player1} disabled={isLoading}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select a player" />
                    </SelectTrigger>
                    <SelectContent>
                      {cricketers?.map(p => (
                        <SelectItem key={p.id} value={p.id} disabled={p.id === player2}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
              </div>
              <div className="text-center font-bold text-2xl font-headline text-muted-foreground">VS</div>
              <div className="flex flex-col items-center gap-2">
                   <h3 className="font-semibold text-lg">Player 2</h3>
                    <Select onValueChange={setPlayer2} value={player2} disabled={isLoading}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select a player" />
                    </SelectTrigger>
                    <SelectContent>
                      {cricketers?.map(p => (
                        <SelectItem key={p.id} value={p.id} disabled={p.id === player1}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
              </div>
          </div>
          <AnimatePresence>
          {p1Data && p2Data && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="pt-6 overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 border-t pt-6">
                   <div className="flex flex-col items-center text-center gap-2">
                    <h3 className="font-bold font-headline text-lg">{p1Data.name}</h3>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Country:</span> {p1Data.country || 'N/A'}
                      </p>
                      {p1Data.roles && p1Data.roles.length > 0 && (
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">Role:</span> {p1Data.roles.join(', ')}
                        </p>
                      )}
                    </div>
                   </div>
                   <div className="space-y-4">
                    <StatBar label="Consistency" value1={p1Data.consistencyIndex || 0} value2={p2Data.consistencyIndex || 0} />
                    <StatBar label="Impact Score" value1={p1Data.impactScore || 0} value2={p2Data.impactScore || 0} />
                   </div>
                   <div className="flex flex-col items-center text-center gap-2">
                    <h3 className="font-bold font-headline text-lg">{p2Data.name}</h3>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Country:</span> {p2Data.country || 'N/A'}
                      </p>
                      {p2Data.roles && p2Data.roles.length > 0 && (
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">Role:</span> {p2Data.roles.join(', ')}
                        </p>
                      )}
                    </div>
                   </div>
                </div>
              </motion.div>
          )}
          </AnimatePresence>
        </CardContent>
      </Card>
  )
}

function SponsorBanner() {
    return (
        <Card className="bg-gradient-to-r from-primary/10 via-background to-background border-primary/20">
            <CardContent className="p-4">
                 <div className="flex flex-col md:flex-row items-center justify-center gap-x-6 gap-y-2 text-center md:text-left">
                    <span className="text-xs font-semibold tracking-widest uppercase text-primary">Official Partner</span>
                    <p className="font-semibold text-lg text-foreground">
                        Play Fantasy Cricket on <span className="text-primary font-bold">My11Circle</span>
                    </p>
                    <Button asChild size="sm" className="ml-auto shrink-0">
                        <Link href="#" target="_blank">Play Now</Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

export default function CricketFanZonePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<{ roles: string[], countries: string[] }>({ roles: [], countries: [] });

  const firestore = useFirestore();
  const cricketersQuery = firestore ? collection(firestore, 'cricketers') : null;
  const { data: cricketers } = useCollection(cricketersQuery);

  const allRoles = cricketers ? [...new Set(cricketers.flatMap((c) => c.roles || []))] : [];
  const allCountries = cricketers ? [...new Set(cricketers.map((c) => c.country))] : [];

  const handleFilterChange = (type: 'roles' | 'countries', value: string, checked: boolean) => {
    setFilters(prev => {
        const currentValues = prev[type];
        if(checked) {
            return { ...prev, [type]: [...currentValues, value] };
        } else {
            return { ...prev, [type]: currentValues.filter(v => v !== value) };
        }
    });
  };

  const clearFilters = () => {
    setFilters({ roles: [], countries: []});
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold md:text-4xl font-headline">
          Fan Zone – Cricket
        </h1>
        <p className="mt-2 text-muted-foreground">Teams · Players · Leagues</p>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
                placeholder="Search teams, players..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            </div>
            <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline">
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filter
                </Button>
            </SheetTrigger>
            <SheetContent>
                <SheetHeader>
                <SheetTitle>Filter Cricketers</SheetTitle>
                </SheetHeader>
                <div className="py-4 space-y-6">
                <div>
                    <h3 className="font-semibold mb-3">Role</h3>
                    <div className="space-y-2">
                    {allRoles.map((role) => (
                        <div key={role} className="flex items-center space-x-2">
                        <Checkbox
                            id={`role-${role}`}
                            checked={filters.roles.includes(role)}
                            onCheckedChange={(checked) => handleFilterChange('roles', role, !!checked)}
                        />
                        <Label htmlFor={`role-${role}`} className="font-normal">
                            {role}
                        </Label>
                        </div>
                    ))}
                    </div>
                </div>
                <Separator />
                <div>
                    <h3 className="font-semibold mb-3">Country</h3>
                    <div className="space-y-2">
                    {allCountries.map((country) => (
                        <div key={country} className="flex items-center space-x-2">
                        <Checkbox
                            id={`country-${country}`}
                            checked={filters.countries.includes(country)}
                            onCheckedChange={(checked) => handleFilterChange('countries', country, !!checked)}
                        />
                        <Label htmlFor={`country-${country}`} className="font-normal">
                            {country}
                        </Label>
                        </div>
                    ))}
                    </div>
                </div>
                </div>
                <SheetFooter>
                    <Button variant="ghost" onClick={clearFilters}>Clear All</Button>
                <SheetClose asChild>
                    <Button>Apply Filters</Button>
                </SheetClose>
                </SheetFooter>
            </SheetContent>
            </Sheet>
        </div>
        <SponsorBanner />
      </div>

      <Tabs defaultValue="cricketers" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6 sm:grid-cols-5">
          <TabsTrigger value="cricketers">Cricketers</TabsTrigger>
          <TabsTrigger value="national-teams">National Teams</TabsTrigger>
          <TabsTrigger value="ip-teams">IPL Teams</TabsTrigger>
          <TabsTrigger value="trending">
            <Flame className="w-4 h-4 mr-2" />
            Trending
          </TabsTrigger>
          <TabsTrigger value="analyst-view">
            <BarChart2 className="w-4 h-4 mr-2" />
            Analyst View
          </TabsTrigger>
        </TabsList>
        <TabsContent value="cricketers">
          <CricketersTab searchTerm={searchTerm} filters={filters} />
        </TabsContent>
        <TabsContent value="national-teams">
          <TeamsTab type="national" searchTerm={searchTerm} />
        </TabsContent>
        <TabsContent value="ip-teams">
          <TeamsTab type="ip" searchTerm={searchTerm} />
        </TabsContent>
        <TabsContent value="trending">
          <TrendingTab />
        </TabsContent>
        <TabsContent value="analyst-view">
          <AnalystViewTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
