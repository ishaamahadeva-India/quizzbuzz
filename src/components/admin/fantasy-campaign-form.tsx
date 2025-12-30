'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, Trash2, Clock, Info } from 'lucide-react';
import { useEffect } from 'react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { EVENT_TEMPLATES, COMPARISON_EVENT_TEMPLATES } from '@/firebase/firestore/fantasy-campaigns';
import { useCollection, useFirestore } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Movie } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useState, useMemo } from 'react';

const eventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  eventType: z.enum([
    'choice_selection', 'numeric_prediction', 'draft_selection',
    'opening_day_collection', 'weekend_collection', 'lifetime_gross',
    'imdb_rating', 'occupancy_percentage', 'day1_talk',
    'awards_rank', 'ott_debut_rank', 'ranking_selection'
  ]),
  movieId: z.string().optional(),
  status: z.enum(['upcoming', 'live', 'completed', 'locked']),
  startDate: z.date(),
  endDate: z.date(),
  lockTime: z.date().optional(),
  points: z.number().min(1, 'Points must be at least 1'),
  difficultyLevel: z.enum(['easy', 'medium', 'hard']).optional(),
  options: z.array(z.string()).optional(),
  rules: z.array(z.string()).optional(),
});

const movieSchema = z.object({
  movieId: z.string().min(1, 'Movie is required'),
  movieTitle: z.string().optional(),
  language: z.string().min(1, 'Language is required'),
  industry: z.enum(['Hollywood', 'Bollywood', 'Tollywood', 'Tamil', 'Kannada', 'Malayalam', 'Punjabi', 'Bhojpuri', 'Other', 'OTT']),
  releaseDate: z.date(),
  releaseType: z.enum(['theatrical', 'ott']),
  posterUrl: z.string().optional(),
  status: z.enum(['upcoming', 'released', 'completed']),
  order: z.number().default(0),
});

const campaignSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  campaignType: z.enum(['single_movie', 'multiple_movies']),
  // Single movie (backward compatibility)
  movieId: z.string().optional(),
  movieTitle: z.string().optional(),
  movieLanguage: z.string().optional(),
  // Multiple movies
  movies: z.array(movieSchema).optional(),
  // Campaign settings
  description: z.string().optional(),
  prizePool: z.string().optional(),
  prizeDistribution: z.object({
    tiers: z.array(z.object({
      rankStart: z.number().min(1),
      rankEnd: z.number().min(-1), // -1 means "and above"
      prizeAmount: z.number().min(0),
      prizeType: z.enum(['merchandise', 'tickets', 'ott_subscription', 'experience', 'travel', 'certificate', 'voucher', 'coupons']),
      description: z.string().optional(),
      minParticipants: z.number().optional(),
    })),
    totalPrizePool: z.number().optional(),
    currency: z.string().optional().default('INR'),
    notes: z.string().optional(),
  }).optional(),
  sponsorName: z.string().optional(),
  sponsorLogo: z.string().optional(),
  startDate: z.date(),
  endDate: z.date().optional(),
  status: z.enum(['upcoming', 'active', 'completed']),
  visibility: z.enum(['public', 'private', 'invite_only']).default('public'),
  maxParticipants: z.number().optional(),
  // REMOVED: Entry fee - all contests are FREE
  // Compliance fields (auto-set, not user-editable)
  isFreeContest: z.literal(true).default(true),
  fundedBy: z.literal('sponsor').default('sponsor'),
  nonCashOnly: z.literal(true).default(true),
  // Events
  events: z.array(eventSchema).optional(),
}).refine((data) => {
  // Require movieId for single_movie campaigns
  if (data.campaignType === 'single_movie') {
    return !!data.movieId && typeof data.movieId === 'string' && data.movieId.trim().length > 0;
  }
  return true;
}, {
  message: 'Please select a movie for single movie campaign.',
  path: ['movieId'],
}).refine((data) => {
  // Require movies array for multiple_movies campaigns
  if (data.campaignType === 'multiple_movies') {
    return data.movies && Array.isArray(data.movies) && data.movies.length > 0;
  }
  return true;
}, {
  message: 'Please add at least one movie for multiple movies campaign.',
  path: ['movies'],
});

type CampaignFormValues = z.infer<typeof campaignSchema>;

type FantasyCampaignFormProps = {
  onSubmit: (data: CampaignFormValues) => void;
  defaultValues?: Partial<CampaignFormValues>;
};

export function FantasyCampaignForm({ onSubmit, defaultValues }: FantasyCampaignFormProps) {
  const firestore = useFirestore();
  const moviesQuery = firestore ? collection(firestore, 'movies') : null;
  const { data: moviesData, isLoading: moviesLoading } = useCollection(moviesQuery);
  const movies = moviesData as (Movie & { id: string })[] | undefined;

  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      status: 'upcoming',
      campaignType: 'single_movie',
      visibility: 'public',
      isFreeContest: true,
      fundedBy: 'sponsor',
      nonCashOnly: true,
      events: [],
      ...defaultValues,
    },
  });

  const { fields: eventFields, append: appendEvent, remove: removeEvent } = useFieldArray({
    control: form.control,
    name: 'events',
  });

  const { fields: movieFields, append: appendMovie, remove: removeMovie } = useFieldArray({
    control: form.control,
    name: 'movies',
  });

  const { fields: prizeTierFields, append: appendPrizeTier, remove: removePrizeTier } = useFieldArray({
    control: form.control,
    name: 'prizeDistribution.tiers',
  });

  const campaignType = form.watch('campaignType') || 'single_movie';
  const campaignStartDate = form.watch('startDate');
  const campaignEndDate = form.watch('endDate');
  
  // State for bulk selection
  const [selectedEventIndices, setSelectedEventIndices] = useState<Set<number>>(new Set());
  const [selectedComparisonIndices, setSelectedComparisonIndices] = useState<Set<number>>(new Set());
  
  // Group events by category with index tracking
  const eventsByCategory = useMemo(() => {
    const grouped: Record<string, Array<{ template: typeof EVENT_TEMPLATES[0]; index: number }>> = {};
    EVENT_TEMPLATES.forEach((event, index) => {
      const category = (event as any).category || 'Other';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push({ template: event, index });
    });
    return grouped;
  }, []);
  
  // Group comparison events by category with index tracking
  const comparisonEventsByCategory = useMemo(() => {
    const grouped: Record<string, Array<{ template: typeof COMPARISON_EVENT_TEMPLATES[0]; index: number }>> = {};
    COMPARISON_EVENT_TEMPLATES.forEach((event, index) => {
      const category = (event as any).category || 'Other';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push({ template: event, index });
    });
    return grouped;
  }, []);

  // Auto-update event dates only when campaign dates are first set (not on every change)
  useEffect(() => {
    const events = form.getValues('events') || [];
    if (events.length > 0 && campaignStartDate) {
      events.forEach((event, index) => {
        const currentStartDate = form.getValues(`events.${index}.startDate`);
        const currentEndDate = form.getValues(`events.${index}.endDate`);
        
        // Only set if not already set (initial population)
        if (!currentStartDate) {
          form.setValue(`events.${index}.startDate`, campaignStartDate, { shouldDirty: false });
        }
        if (!currentEndDate) {
          const endDateToUse = campaignEndDate || campaignStartDate;
          form.setValue(`events.${index}.endDate`, endDateToUse, { shouldDirty: false });
        }
      });
    }
  }, [campaignStartDate, campaignEndDate]); // Only depend on campaign dates, not form or eventFields

  const addEventFromTemplate = (template: typeof EVENT_TEMPLATES[0]) => {
    // Use campaign dates if available, otherwise use current date
    const eventStartDate = campaignStartDate || new Date();
    const eventEndDate = campaignEndDate || new Date();
    
    const newEvent = {
      title: template.title,
      description: template.description,
      eventType: template.eventType,
      status: 'upcoming' as const,
      startDate: eventStartDate,
      endDate: eventEndDate,
      points: template.defaultPoints,
      difficultyLevel: template.difficultyLevel,
      options: template.defaultOptions || [],
      rules: template.defaultRules || [],
    };
    console.log('➕ Adding event from template:', newEvent.title);
    appendEvent(newEvent);
    console.log('✅ Event added. Current events count:', form.getValues('events')?.length || 0);
  };
  
  const addAllEventsFromTemplates = () => {
    console.log('🚀 Adding all events from templates. Total templates:', EVENT_TEMPLATES.length);
    EVENT_TEMPLATES.forEach((template) => {
      addEventFromTemplate(template);
    });
    const finalCount = form.getValues('events')?.length || 0;
    console.log('✅ All events added. Final count:', finalCount);
  };

  const addComparisonEventFromTemplate = (template: typeof COMPARISON_EVENT_TEMPLATES[0]) => {
    const campaignMovies = form.getValues('movies') || [];
    
    // For comparison events, options should be movie names (or industries for industry battles)
    let options: string[] = [];
    
    // If template has defaultOptions (like Collection Gap Prediction), use those
    if (template.defaultOptions && template.defaultOptions.length > 0) {
      options = template.defaultOptions;
    } else if (template.isIndustryBattle) {
      // For industry battles, get unique industries from movies
      const industries = [...new Set(campaignMovies.map(m => m.industry))];
      options = industries;
    } else {
      // For regular comparison events, use movie titles
      // Look up movie titles from the movies collection if movieTitle is not set
      options = campaignMovies.map(m => {
        if (m.movieTitle) {
          return m.movieTitle;
        }
        // Look up from movies collection
        const movie = movies?.find(mv => mv.id === m.movieId);
        return movie?.title || `Movie ${m.movieId}`;
      });
    }
    
    // If no movies added yet and no defaultOptions, use placeholder
    if (options.length === 0) {
      options = ['Movie A', 'Movie B', 'Movie C', 'Movie D'];
    }
    
    // Use campaign dates if available, otherwise use current date
    const eventStartDate = campaignStartDate || new Date();
    const eventEndDate = campaignEndDate || new Date();
    
    const newEvent = {
      title: template.title,
      description: template.description,
      eventType: template.eventType,
      status: 'upcoming' as const,
      startDate: eventStartDate,
      endDate: eventEndDate,
      points: template.defaultPoints,
      difficultyLevel: template.difficultyLevel,
      options: options,
      rules: template.defaultRules || [],
      movieId: '', // Campaign-wide event
    };
    
    console.log('➕ Adding comparison event from template:', newEvent.title);
    console.log('   Options:', options);
    appendEvent(newEvent);
    console.log('✅ Comparison event added. Current events count:', form.getValues('events')?.length || 0);
  };

  const addMovie = () => {
    appendMovie({
      movieId: '',
      language: 'Hindi', // Default language
      industry: 'Bollywood',
      releaseDate: new Date(),
      releaseType: 'theatrical',
      status: 'upcoming',
      order: movieFields.length,
    });
  };

  const selectedMovieId = form.watch('movieId');
  const selectedMovie = movies?.find((m) => m.id === selectedMovieId);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => {
        // Ensure all events have campaign dates
        if (data.events && data.events.length > 0) {
          data.events = data.events.map(event => ({
            ...event,
            startDate: event.startDate || data.startDate,
            endDate: event.endDate || data.endDate || data.startDate,
          }));
        }
        // Ensure compliance fields are always set (all contests are FREE + NON-CASH)
        const complianceData = {
          ...data,
          isFreeContest: true as const,
          fundedBy: 'sponsor' as const,
          nonCashOnly: true as const,
        };
        
        // CRITICAL DEBUG: Log form data before submission
        console.log('🔥 FORM SUBMIT - Data being sent to onSubmit:', complianceData);
        console.log('🔥 FORM SUBMIT - Events in data:', complianceData.events);
        console.log('🔥 FORM SUBMIT - Events length:', complianceData.events?.length || 0);
        onSubmit(complianceData);
      }, (errors) => {
        console.error('❌ Form validation errors:', errors);
        console.error('❌ Form values at error:', form.getValues());
      })} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Campaign Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Campaign Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Weekend Movie Fantasy – Pan India" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!defaultValues?.campaignType ? (
              <FormField
                control={form.control}
                name="campaignType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Campaign Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || 'single_movie'}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select campaign type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="single_movie">Single Movie</SelectItem>
                        <SelectItem value="multiple_movies">Multiple Movies</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium">
                  Campaign Type: <span className="text-primary capitalize">{defaultValues.campaignType.replace('_', ' ')}</span>
                </p>
              </div>
            )}

            {campaignType === 'single_movie' ? (
              <>
                <FormField
                  control={form.control}
                  name="movieId"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between mb-2">
                        <FormLabel>Movie <span className="text-destructive">*</span></FormLabel>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <Link href="/admin/fanzone/movies/new" target="_blank" rel="noopener noreferrer">
                            <Plus className="w-4 h-4 mr-2" />
                            Create New Movie
                          </Link>
                        </Button>
                      </div>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value);
                        }} 
                        value={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a movie" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {moviesLoading && (
                            <div className="px-2 py-1.5 text-sm text-muted-foreground">
                              Loading movies...
                            </div>
                          )}
                          {!moviesLoading && (!movies || movies.length === 0) && (
                            <div className="px-2 py-1.5 text-sm text-muted-foreground">
                              No movies available. Click "Create New Movie" to add one.
                            </div>
                          )}
                          {movies?.map((movie) => (
                            <SelectItem key={movie.id} value={movie.id}>
                              {movie.title} {movie.releaseYear ? `(${movie.releaseYear})` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {selectedMovie ? `Selected: ${selectedMovie.title}` : 'Choose a movie from the list or create a new one'}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="movieLanguage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Movie Language</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select language" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Tollywood">Tollywood (Telugu)</SelectItem>
                          <SelectItem value="Bollywood">Bollywood (Hindi)</SelectItem>
                          <SelectItem value="Tamil">Tamil</SelectItem>
                          <SelectItem value="Kannada">Kannada</SelectItem>
                          <SelectItem value="Malayalam">Malayalam</SelectItem>
                          <SelectItem value="Punjabi">Punjabi</SelectItem>
                          <SelectItem value="Bhojpuri">Bhojpuri</SelectItem>
                          <SelectItem value="Hollywood">Hollywood</SelectItem>
                          <SelectItem value="OTT">OTT</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <FormLabel>Movies in Campaign</FormLabel>
                  <Button type="button" variant="outline" size="sm" onClick={addMovie}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Movie
                  </Button>
                </div>
                {movieFields.map((field, index) => (
                  <Card key={field.id} className="p-4">
                    <div className="flex items-start justify-between mb-4">
                      <h4 className="font-semibold">Movie {index + 1}</h4>
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeMovie(index)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`movies.${index}.movieId`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Movie <span className="text-destructive">*</span></FormLabel>
                            <Select 
                              onValueChange={(value) => {
                                field.onChange(value);
                                // Auto-populate movieTitle when movie is selected
                                const selectedMovie = movies?.find(m => m.id === value);
                                if (selectedMovie) {
                                  form.setValue(`movies.${index}.movieTitle`, selectedMovie.title);
                                }
                              }} 
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select movie" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {moviesLoading && (
                                  <SelectItem value="loading" disabled>
                                    Loading movies...
                                  </SelectItem>
                                )}
                                {!moviesLoading && (!movies || movies.length === 0) && (
                                  <SelectItem value="no-movies" disabled>
                                    No movies available
                                  </SelectItem>
                                )}
                                {movies?.map((movie) => (
                                  <SelectItem key={movie.id} value={movie.id}>
                                    {movie.title} {movie.releaseYear ? `(${movie.releaseYear})` : ''}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`movies.${index}.industry`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Industry <span className="text-destructive">*</span></FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || 'Bollywood'}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select industry" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Bollywood">Bollywood</SelectItem>
                                <SelectItem value="Tollywood">Tollywood</SelectItem>
                                <SelectItem value="Tamil">Tamil</SelectItem>
                                <SelectItem value="Kannada">Kannada</SelectItem>
                                <SelectItem value="Malayalam">Malayalam</SelectItem>
                                <SelectItem value="Punjabi">Punjabi</SelectItem>
                                <SelectItem value="Bhojpuri">Bhojpuri</SelectItem>
                                <SelectItem value="Hollywood">Hollywood</SelectItem>
                                <SelectItem value="OTT">OTT</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`movies.${index}.releaseType`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Release Type <span className="text-destructive">*</span></FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || 'theatrical'}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select release type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="theatrical">Theatrical</SelectItem>
                                <SelectItem value="ott">OTT</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`movies.${index}.releaseDate`}
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Release Date <span className="text-destructive">*</span></FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button variant="outline" className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}>
                                    {field.value ? format(field.value, 'PPP') : <span>Pick date</span>}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`movies.${index}.language`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Language <span className="text-destructive">*</span></FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || 'Hindi'}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select language" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Hindi">Hindi</SelectItem>
                                <SelectItem value="Telugu">Telugu</SelectItem>
                                <SelectItem value="Tamil">Tamil</SelectItem>
                                <SelectItem value="Kannada">Kannada</SelectItem>
                                <SelectItem value="Malayalam">Malayalam</SelectItem>
                                <SelectItem value="Punjabi">Punjabi</SelectItem>
                                <SelectItem value="Bhojpuri">Bhojpuri</SelectItem>
                                <SelectItem value="English">English</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`movies.${index}.status`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status <span className="text-destructive">*</span></FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || 'upcoming'}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="upcoming">Upcoming</SelectItem>
                                <SelectItem value="released">Released</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </Card>
                ))}
                {movieFields.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    No movies added. Click "Add Movie" to add movies to this campaign.
                  </div>
                )}
              </div>
            )}

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Campaign description"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'PPP')
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date (Optional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'PPP')
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="upcoming">Upcoming</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="visibility"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Visibility</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || 'public'}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="invite_only">Invite Only</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="maxParticipants"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max Participants (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g., 1000"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="prizePool"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prize Pool (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Vouchers & 1,00,000 quizzbuzz Points" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sponsorName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sponsor Name (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Kingfisher" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sponsorLogo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sponsor Logo URL (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/logo.png" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5 text-primary" />
              Compliance & Contest Model
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
                ✓ Free Contest
              </Badge>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                ✓ Sponsor-Funded
              </Badge>
              <Badge variant="outline" className="bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                ✓ Non-Cash Only
              </Badge>
            </div>
            <p className="text-muted-foreground mt-2">
              All contests are FREE to enter. Prizes are sponsor-funded, non-cash rewards only. 
              No entry fees or cash prizes are allowed.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sponsored Rewards Distribution (Optional)</CardTitle>
            <CardDescription>
              Configure reward tiers based on rankings. All rewards are non-cash, sponsor-funded. 
              Rewards will be distributed based on final leaderboard positions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="prizeDistribution.totalPrizePool"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sponsored Rewards Pool (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g., 1000000"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription>
                    Total value of all non-cash rewards combined (for display purposes only)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="prizeDistribution.currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Currency</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || 'INR'}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="INR">INR (₹)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Prize Tiers</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    appendPrizeTier({
                      rankStart: 1,
                      rankEnd: 1,
                      prizeAmount: 0,
                      prizeType: 'merchandise',
                      minParticipants: undefined,
                    });
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Tier
                </Button>
              </div>

              {prizeTierFields.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No prize tiers configured. Click "Add Tier" to add prize distribution tiers.
                </p>
              )}

              {prizeTierFields.map((field, index) => (
                <Card key={field.id} className="p-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Tier {index + 1}</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removePrizeTier(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`prizeDistribution.tiers.${index}.rankStart`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Rank Start</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={1}
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`prizeDistribution.tiers.${index}.rankEnd`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Rank End (-1 for "and above")</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={-1}
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormDescription>
                              Use -1 for "and above" (e.g., rank 100+)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`prizeDistribution.tiers.${index}.prizeAmount`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Reward Value (₹)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={0}
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`prizeDistribution.tiers.${index}.prizeType`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Reward Type</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="merchandise">Merchandise</SelectItem>
                                <SelectItem value="tickets">Tickets</SelectItem>
                                <SelectItem value="ott_subscription">OTT Subscription</SelectItem>
                                <SelectItem value="experience">Experience</SelectItem>
                                <SelectItem value="travel">Travel</SelectItem>
                                <SelectItem value="certificate">Certificate</SelectItem>
                                <SelectItem value="voucher">Voucher (Non-Cash)</SelectItem>
                                <SelectItem value="coupons">Coupons</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Cash prizes are not allowed. All rewards must be non-cash, sponsor-funded.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name={`prizeDistribution.tiers.${index}.minParticipants`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Min Participants (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              placeholder="Leave empty if always active"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormDescription>
                            Minimum participants required for this tier to be active
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`prizeDistribution.tiers.${index}.description`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Amazon voucher" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </Card>
              ))}
            </div>

            <FormField
              control={form.control}
              name="prizeDistribution.notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., Prizes will be distributed within 30 days of campaign completion"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Campaign Events</CardTitle>
              <div className="flex gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button type="button" variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Event
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Add Event from Template</DialogTitle>
                      <DialogDescription>
                        Select events to add. Use checkboxes for bulk selection or click individual events.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex gap-2 mt-4 mb-4">
                      <Button
                        type="button"
                        variant="default"
                        onClick={() => {
                          selectedEventIndices.forEach(index => {
                            addEventFromTemplate(EVENT_TEMPLATES[index]);
                          });
                          setSelectedEventIndices(new Set());
                        }}
                        disabled={selectedEventIndices.size === 0}
                        className="flex-1"
                      >
                        Add Selected ({selectedEventIndices.size})
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          if (selectedEventIndices.size === EVENT_TEMPLATES.length) {
                            setSelectedEventIndices(new Set());
                          } else {
                            setSelectedEventIndices(new Set(EVENT_TEMPLATES.map((_, i) => i)));
                          }
                        }}
                        className="flex-1"
                      >
                        {selectedEventIndices.size === EVENT_TEMPLATES.length ? 'Deselect All' : 'Select All'}
                      </Button>
                    </div>
                    <div className="space-y-6">
                      {Object.entries(eventsByCategory).map(([category, events]) => (
                        <div key={category} className="space-y-2">
                          <div className="flex items-center justify-between border-b pb-2">
                            <h3 className="font-semibold text-lg">{category}</h3>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const categoryIndices = events.map(e => e.index);
                                const allSelected = categoryIndices.every(i => selectedEventIndices.has(i));
                                if (allSelected) {
                                  const newSet = new Set(selectedEventIndices);
                                  categoryIndices.forEach(i => newSet.delete(i));
                                  setSelectedEventIndices(newSet);
                                } else {
                                  const newSet = new Set(selectedEventIndices);
                                  categoryIndices.forEach(i => newSet.add(i));
                                  setSelectedEventIndices(newSet);
                                }
                              }}
                            >
                              {events.every(e => selectedEventIndices.has(e.index)) ? 'Deselect Category' : 'Select Category'}
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 gap-2">
                            {events.map(({ template, index }) => {
                              const isSelected = selectedEventIndices.has(index);
                              return (
                                <div
                                  key={index}
                                  className={cn(
                                    "flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors",
                                    isSelected && "bg-primary/5 border-primary"
                                  )}
                                  onClick={() => {
                                    const newSet = new Set(selectedEventIndices);
                                    if (isSelected) {
                                      newSet.delete(index);
                                    } else {
                                      newSet.add(index);
                                    }
                                    setSelectedEventIndices(newSet);
                                  }}
                                >
                                  <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={(checked) => {
                                      const newSet = new Set(selectedEventIndices);
                                      if (checked) {
                                        newSet.add(index);
                                      } else {
                                        newSet.delete(index);
                                      }
                                      setSelectedEventIndices(newSet);
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <div className="flex-1">
                                    <div className="font-semibold">{template.title}</div>
                                    <div className="text-sm text-muted-foreground mt-1">
                                      {template.description}
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                      <Badge variant="secondary">{template.eventType}</Badge>
                                      <Badge variant="outline">{template.defaultPoints} points</Badge>
                                      {template.difficultyLevel && (
                                        <Badge variant="secondary">{template.difficultyLevel}</Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
                
                {campaignType === 'multiple_movies' && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button type="button" variant="default">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Comparison Events
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Add Comparison Events</DialogTitle>
                        <DialogDescription>
                          These events compare movies head-to-head. Options will be populated with your campaign movies. Use checkboxes for bulk selection.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex gap-2 mt-4 mb-4">
                        <Button
                          type="button"
                          variant="default"
                          onClick={() => {
                            selectedComparisonIndices.forEach(index => {
                              addComparisonEventFromTemplate(COMPARISON_EVENT_TEMPLATES[index]);
                            });
                            setSelectedComparisonIndices(new Set());
                          }}
                          disabled={selectedComparisonIndices.size === 0}
                          className="flex-1"
                        >
                          Add Selected ({selectedComparisonIndices.size})
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            if (selectedComparisonIndices.size === COMPARISON_EVENT_TEMPLATES.length) {
                              setSelectedComparisonIndices(new Set());
                            } else {
                              setSelectedComparisonIndices(new Set(COMPARISON_EVENT_TEMPLATES.map((_, i) => i)));
                            }
                          }}
                          className="flex-1"
                        >
                          {selectedComparisonIndices.size === COMPARISON_EVENT_TEMPLATES.length ? 'Deselect All' : 'Select All'}
                        </Button>
                      </div>
                      <div className="space-y-6">
                        {Object.entries(comparisonEventsByCategory).map(([category, events]) => (
                          <div key={category} className="space-y-2">
                            <div className="flex items-center justify-between border-b pb-2">
                              <h3 className="font-semibold text-lg">{category}</h3>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const categoryIndices = events.map(e => e.index);
                                  const allSelected = categoryIndices.every(i => selectedComparisonIndices.has(i));
                                  if (allSelected) {
                                    const newSet = new Set(selectedComparisonIndices);
                                    categoryIndices.forEach(i => newSet.delete(i));
                                    setSelectedComparisonIndices(newSet);
                                  } else {
                                    const newSet = new Set(selectedComparisonIndices);
                                    categoryIndices.forEach(i => newSet.add(i));
                                    setSelectedComparisonIndices(newSet);
                                  }
                                }}
                              >
                                {events.every(e => selectedComparisonIndices.has(e.index)) ? 'Deselect Category' : 'Select Category'}
                              </Button>
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                              {events.map(({ template, index }) => {
                                const isSelected = selectedComparisonIndices.has(index);
                                return (
                                  <div
                                    key={index}
                                    className={cn(
                                      "flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors",
                                      isSelected && "bg-primary/5 border-primary"
                                    )}
                                    onClick={() => {
                                      const newSet = new Set(selectedComparisonIndices);
                                      if (isSelected) {
                                        newSet.delete(index);
                                      } else {
                                        newSet.add(index);
                                      }
                                      setSelectedComparisonIndices(newSet);
                                    }}
                                  >
                                    <Checkbox
                                      checked={isSelected}
                                      onCheckedChange={(checked) => {
                                        const newSet = new Set(selectedComparisonIndices);
                                        if (checked) {
                                          newSet.add(index);
                                        } else {
                                          newSet.delete(index);
                                        }
                                        setSelectedComparisonIndices(newSet);
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                    <div className="flex-1">
                                      <div className="font-semibold">{template.title}</div>
                                      <div className="text-sm text-muted-foreground mt-1">
                                        {template.description}
                                      </div>
                                      <div className="flex items-center gap-2 mt-2">
                                        <Badge variant="secondary">{template.eventType}</Badge>
                                        <Badge variant="outline">{template.defaultPoints} points</Badge>
                                        {template.isIndustryBattle && (
                                          <Badge variant="destructive">Industry Battle</Badge>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {eventFields.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No events added yet. Click "Add Event" to add events from templates.
              </div>
            )}

            {eventFields.map((field, index) => (
              <Card key={field.id} className="p-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h4 className="font-semibold">
                      {form.watch(`events.${index}.title`) || `Event ${index + 1}`}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {form.watch(`events.${index}.eventType`)} • {form.watch(`events.${index}.points`)} points
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeEvent(index)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>

                {campaignType === 'multiple_movies' && (
                  <FormField
                    control={form.control}
                    name={`events.${index}.movieId`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Movie (Optional - leave blank for campaign-wide event)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select movie or leave blank" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="all-movies">All Movies (Campaign-wide)</SelectItem>
                            {form.watch('movies')?.filter((movie) => movie.movieId && movie.movieId.trim() !== '').map((movie) => (
                              <SelectItem key={movie.movieId} value={movie.movieId}>
                                {movie.movieTitle || `Movie ${movie.movieId}`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name={`events.${index}.title`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event Title</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`events.${index}.points`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Points</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name={`events.${index}.difficultyLevel`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Difficulty Level</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || undefined}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select difficulty" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="easy">Easy (10-25 points)</SelectItem>
                          <SelectItem value="medium">Medium (25-75 points)</SelectItem>
                          <SelectItem value="hard">Hard (75-300 points)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`events.${index}.description`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name={`events.${index}.eventType`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="choice_selection">Choice Selection</SelectItem>
                            <SelectItem value="numeric_prediction">Numeric Prediction</SelectItem>
                            <SelectItem value="draft_selection">Draft Selection</SelectItem>
                            <SelectItem value="opening_day_collection">Opening Day Collection</SelectItem>
                            <SelectItem value="weekend_collection">Weekend Collection</SelectItem>
                            <SelectItem value="lifetime_gross">Lifetime Gross</SelectItem>
                            <SelectItem value="imdb_rating">IMDb Rating</SelectItem>
                            <SelectItem value="occupancy_percentage">Occupancy %</SelectItem>
                            <SelectItem value="day1_talk">Day-1 Talk</SelectItem>
                            <SelectItem value="awards_rank">Awards/Trending Rank</SelectItem>
                            <SelectItem value="ott_debut_rank">OTT Debut Rank</SelectItem>
                            <SelectItem value="ranking_selection">Ranking Selection (Multiple Movies)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`events.${index}.status`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || 'upcoming'}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="upcoming">Upcoming</SelectItem>
                            <SelectItem value="live">Live</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="locked">Locked</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`events.${index}.startDate`}
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Start Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  'w-full pl-3 text-left font-normal text-sm',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                {field.value ? (
                                  format(field.value, 'PPP')
                                ) : (
                                  <span>Pick date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name={`events.${index}.endDate`}
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>End Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                'w-full pl-3 text-left font-normal text-sm',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              {field.value ? (
                                format(field.value, 'PPP')
                              ) : (
                                <span>Pick date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {(form.watch(`events.${index}.eventType`) === 'choice_selection' || 
                  form.watch(`events.${index}.eventType`) === 'ranking_selection') && (
                  <FormField
                    control={form.control}
                    name={`events.${index}.options`}
                    render={({ field }) => {
                      // For multiple movie campaigns, auto-populate with movie names if empty
                      const eventType = form.watch(`events.${index}.eventType`);
                      const isRanking = eventType === 'ranking_selection';
                      const movies = form.watch('movies') || [];
                      
                      // Auto-populate options with movie names for comparison events
                      const shouldAutoPopulate = campaignType === 'multiple_movies' && 
                                                 (!field.value || field.value.length === 0) &&
                                                 movies.length > 0;
                      
                      if (shouldAutoPopulate && !field.value) {
                        const movieOptions = movies.map(m => m.movieTitle || `Movie ${m.movieId}`);
                        setTimeout(() => field.onChange(movieOptions), 0);
                      }
                      
                      return (
                        <FormItem>
                          <FormLabel>
                            {isRanking ? 'Movies to Rank (will be ranked 1st, 2nd, 3rd, etc.)' : 'Options (one per line)'}
                            {campaignType === 'multiple_movies' && (
                              <span className="text-xs text-muted-foreground ml-2">
                                (For comparison events, use movie names)
                              </span>
                            )}
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={
                                isRanking 
                                  ? campaignType === 'multiple_movies' 
                                    ? "Movie names will auto-populate from your campaign movies"
                                    : "Movie 1\nMovie 2\nMovie 3\nMovie 4"
                                  : campaignType === 'multiple_movies'
                                    ? "Movie A\nMovie B\nMovie C\nMovie D"
                                    : "Option 1\nOption 2\nOption 3"
                              }
                              value={field.value?.join('\n') || ''}
                              onChange={(e) => {
                                const options = e.target.value.split('\n').filter((o) => o.trim());
                                field.onChange(options);
                              }}
                            />
                          </FormControl>
                          <FormDescription>
                            {isRanking 
                              ? 'Enter movie names. Users will rank these movies (1st, 2nd, 3rd, etc.)'
                              : 'Enter each option on a new line. For comparison events, use movie names.'}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                )}

                <FormField
                  control={form.control}
                  name={`events.${index}.rules`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rules (one per line)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Rule 1&#10;Rule 2"
                          value={field.value?.join('\n') || ''}
                          onChange={(e) => {
                            const rules = e.target.value.split('\n').filter((r) => r.trim());
                            field.onChange(rules);
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Enter each rule on a new line
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </Card>
            ))}
          </CardContent>
        </Card>

        <Button type="submit">
          {defaultValues ? 'Update Campaign' : 'Create Campaign'}
        </Button>
      </form>
    </Form>
  );
}

