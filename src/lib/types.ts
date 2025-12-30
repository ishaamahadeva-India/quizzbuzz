
export type CricketEventCategory = 
    | 'Powerplay Events'
    | 'Batting Events'
    | 'Bowling Events'
    | 'Fielding Events'
    | 'Match Outcome'
    | 'Innings Events'
    | 'Special Events'
    | 'Player Performance';

export type Movie = {
    id: string;
    title: string;
    releaseYear: number;
    genre: string;
    industry: 'Hollywood' | 'Bollywood' | 'Tollywood' | 'Tamil' | 'Kannada' | 'Malayalam' | 'Punjabi' | 'Bhojpuri' | 'Other' | 'OTT';
    posterUrl: string;
    description: string;
    director?: string;
    cast?: string;
    runtime?: string;
    imdbRating?: number;
    language?: string;
    communityScore?: number;
    trendingRank?: number;
}

export type Star = {
    id: string;
    name: string;
    profession?: string;
    genre: string[]; // Changed from specialization
    avatar: string;
    bio?: string;
    dateOfBirth?: string;
    debutYear?: number;
    industry?: string;
    popularityIndex?: number;
    trendingRank?: number;
}

export type FanRating = {
  userId: string;
  entityId: string;
  entityType: 'cricketer' | 'team' | 'movie' | 'star';
  ratings: Record<string, number>;
  review?: string;
  createdAt: Date;
};

export type AdminRole = 'super_admin' | 'campaign_manager' | 'content_moderator' | 'finance_admin' | 'analytics_admin';

export type UserProfile = {
    id: string;
    displayName: string;
    email: string;
    username?: string; // Unique username for public display
    realName?: string; // Real name (private, for profile only)
    phoneNumber?: string; // Phone number (private, for profile only)
    avatarUrl?: string;
    points: number;
    watchlist?: string[]; // Movie IDs
    favorites?: {
        cricketer?: string[];
        star?: string[];
        team?: string[];
    };
    ageVerified?: boolean;
    fantasyEnabled?: boolean;
    isAdmin?: boolean;
    adminRole?: AdminRole;
    city?: string;
    state?: string;
    isBanned?: boolean;
    banReason?: string;
    banExpiresAt?: Date;
    suspiciousActivity?: boolean;
    // Subscription fields
    isSubscribed?: boolean;
    subscriptionStartDate?: Date;
    subscriptionEndDate?: Date;
    subscriptionPlan?: 'annual';
    paymentId?: string; // Cashfree payment order ID
    subscriptionStatus?: 'active' | 'expired' | 'cancelled';
    // Daily rewards tracking
    lastDailyLoginDate?: string; // YYYY-MM-DD format
    lastDailyGameDate?: string; // YYYY-MM-DD format
    dailyLoginStreak?: number; // Consecutive days of login
    totalDailyLogins?: number; // Total number of daily logins
    totalDailyGames?: number; // Total number of daily games played
};

export type UserPrediction = {
    id?: string;
    userId: string;
    eventId: string;
    campaignId: string;
    movieId?: string; // For multi-movie campaigns
    predictionData: Record<string, any>;
    score?: number;
    isLocked: boolean;
    lockedAt?: Date;
    createdAt: Date;
    updatedAt?: Date;
};

export type Article = {
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  content: string;
  imageUrl?: string;
}

export type Gossip = {
    id: string;
    title: string;
    source: string;
    imageUrl?: string;
}

export type Advertisement = {
    id: string;
    title: string;
    description?: string;
    imageUrl?: string; // Made optional
    linkUrl: string;
    position: AdvertisementPosition;
    active: boolean;
    startDate?: Date;
    endDate?: Date;
    createdAt: Date;
    updatedAt: Date;
};

export type AdvertisementPosition = 
    | 'home-banner-top'           // Top banner on home page
    | 'home-sidebar-sponsored'    // Sidebar sponsored card on home
    | 'home-article-between'      // Between articles on home (AdBanner)
    | 'article-top'               // Top of article pages
    | 'article-sidebar'           // Sidebar in article pages
    | 'fantasy-banner'             // Banner in fantasy pages
    | 'profile-sidebar'           // Sidebar in profile page
    | 'quiz-banner';              // Banner in quiz pages

export type FantasyEventType = 
    | 'choice_selection'      // Multiple choice questions
    | 'numeric_prediction'   // Number predictions (views, collections, etc.)
    | 'draft_selection'      // Team/player draft
    | 'opening_day_collection'  // Opening day box office collection
    | 'weekend_collection'      // First weekend box office
    | 'lifetime_gross'          // Lifetime gross collection
    | 'imdb_rating'             // IMDb rating range
    | 'occupancy_percentage'    // Opening day occupancy %
    | 'day1_talk'               // Day-1 talk (Hit/Average/Flop)
    | 'awards_rank'             // Awards / Trending rank
    | 'ott_debut_rank'          // OTT platform debut week rank
    | 'ranking_selection';       // Ranking multiple movies (1st, 2nd, 3rd, etc.)

// Campaign Movie - represents a movie in a campaign
export type CampaignMovie = {
    id: string;
    movieId: string;
    movieTitle: string;
    language: string;
    industry: 'Hollywood' | 'Bollywood' | 'Tollywood' | 'Tamil' | 'Kannada' | 'Malayalam' | 'Punjabi' | 'Bhojpuri' | 'Other' | 'OTT';
    releaseDate: Date;
    releaseType: 'theatrical' | 'ott';
    posterUrl?: string;
    status: 'upcoming' | 'released' | 'completed';
    order: number; // Display order
}

// Campaign Type
export type CampaignType = 'single_movie' | 'multiple_movies';

// Entry Fee Configuration - REMOVED
// All contests are FREE - no entry fees allowed
// This type is kept for backward compatibility but should not be used
// @deprecated - All campaigns are free contests
export type EntryFeeConfig = {
    type: 'free'; // Always 'free' - paid contests not allowed
}

// Prize Tier Configuration
export type PrizeTier = {
    rankStart: number; // Starting rank (inclusive)
    rankEnd: number; // Ending rank (inclusive), -1 means "and above"
    prizeAmount: number; // Prize value in INR (for display only, not cash)
    prizeType: 'merchandise' | 'tickets' | 'ott_subscription' | 'experience' | 'travel' | 'certificate' | 'voucher' | 'coupons';
    description?: string; // Optional description
    minParticipants?: number; // Minimum participants required for this tier to be active
    nonTransferable?: boolean; // Prizes are non-transferable (default: true)
    nonCashRedeemable?: boolean; // Prizes cannot be redeemed for cash (default: true)
}

// Prize Distribution Configuration
export type PrizeDistribution = {
    tiers: PrizeTier[]; // Prize tiers
    totalPrizePool?: number; // Total sponsored rewards pool value (optional, for display). Display as "Sponsored Rewards Pool"
    currency?: string; // Currency code (default: 'INR')
    notes?: string; // Additional notes about prize distribution
}

// Reward Configuration
export type RewardConfig = {
    type: 'merchandise' | 'coupons' | 'tickets' | 'ott_subscription' | 'badges' | 'xp' | 'experience' | 'travel' | 'certificate' | 'voucher';
    value?: number; // Prize value in INR (for display only, not cash)
    description?: string;
    rankRange?: { start: number; end: number }; // e.g., rank 1-3 gets this reward
    minParticipants?: number; // Minimum participants required
    nonTransferable?: boolean; // Rewards are non-transferable (default: true)
    nonCashRedeemable?: boolean; // Rewards cannot be redeemed for cash (default: true)
}

// Points Configuration
export type PointsConfig = {
    difficultyLevel: 'easy' | 'medium' | 'hard';
    basePoints: number;
    perfectBonus?: number; // Bonus for perfect prediction
    allMovieBonus?: number; // Bonus for getting all movies correct
    perfectMovieBonus?: number; // Bonus for perfect movie-wise score
    negativeMarking?: number; // Negative points for wrong prediction (0 = no negative)
    accuracyBased?: boolean; // If true, points scale with accuracy
    rangeBased?: boolean; // If true, use range-based scoring for numeric predictions
    tolerance?: number; // Percentage tolerance for range-based scoring (default 10%)
}

// Event Result with Verification
export type EventResult = {
    outcome: string | number;
    verified: boolean;
    verifiedBy?: string; // Admin user ID
    verifiedAt?: Date;
    approved: boolean;
    approvedBy?: string; // Super Admin user ID
    approvedAt?: Date;
    notes?: string;
}

// Enhanced Fantasy Event
export type FantasyEvent = {
    id: string;
    title: string;
    description: string;
    eventType: FantasyEventType;
    status: 'upcoming' | 'live' | 'completed' | 'locked';
    startDate: Date;
    endDate: Date;
    lockTime?: Date; // When predictions should be locked
    movieId?: string; // For single-movie campaigns, or specific movie in multi-movie
    points: number;
    pointsConfig?: PointsConfig;
    difficultyLevel?: 'easy' | 'medium' | 'hard';
    options?: string[]; // For choice_selection type
    rules?: string[];
    result?: EventResult;
    draftConfig?: {
        budget: number;
        roles: Array<{ id: string; title: string; players: string[] }>;
        playerCredits: Record<string, number>;
    };
    createdAt: Date;
    updatedAt: Date;
}

// Leaderboard Entry
export type LeaderboardEntry = {
    userId: string;
    displayName: string;
    avatarUrl?: string;
    totalPoints: number;
    rank: number;
    movieWisePoints?: Record<string, number>; // movieId -> points
    city?: string;
    state?: string;
    predictionsCount: number;
    correctPredictions: number;
    lastUpdated: Date;
}

// Campaign Leaderboard
export type CampaignLeaderboard = {
    campaignId: string;
    type: 'overall' | 'movie_wise' | 'city_wise' | 'state_wise' | 'friends' | 'private_group';
    movieId?: string; // For movie-wise leaderboards
    entries: LeaderboardEntry[];
    lastUpdated: Date;
}

// Campaign Entry (User participation)
// All contests are FREE - no entry fees or payments
export type CampaignEntry = {
    id: string;
    userId: string;
    campaignId: string;
    // REMOVED: entryFee, entryFeeTier, paymentStatus, paymentMethod
    // All contests are free - no payment collection
    totalPoints: number;
    rank?: number;
    joinedAt: Date;
    city?: string;
    state?: string;
    isFreeContest: true; // Always true - all contests are free
    fundedBy: 'sponsor'; // Always sponsor-funded
}

// Reward Payout
// All rewards are non-cash, sponsor-funded
export type RewardPayout = {
    id: string;
    campaignId: string;
    userId: string;
    reward: RewardConfig;
    rank: number;
    status: 'pending' | 'approved' | 'distributed' | 'rejected'; // Changed 'paid' to 'distributed'
    // REMOVED: paymentMethod, paymentDetails (no cash payments)
    distributionMethod?: 'courier' | 'email' | 'in_app' | 'pickup'; // How non-cash reward is delivered
    distributionDetails?: string; // Tracking number, voucher code, etc.
    processedBy?: string;
    processedAt?: Date;
    notes?: string;
}

// Enhanced Fantasy Campaign
export type FantasyCampaign = {
    id: string;
    title: string;
    campaignType: CampaignType;
    description?: string;
    prizePool?: string; // @deprecated - Use prizeDistribution.totalPrizePool instead. Display as "Sponsored Rewards Pool"
    sponsorName?: string;
    sponsorLogo?: string;
    
    // Single movie (for backward compatibility)
    movieId?: string;
    movieTitle?: string;
    movieLanguage?: string;
    
    // Multiple movies
    movies?: CampaignMovie[];
    
    // Campaign settings
    startDate: Date;
    endDate?: Date;
    status: 'upcoming' | 'active' | 'completed';
    visibility: 'public' | 'private' | 'invite_only';
    maxParticipants?: number;
    
    // Entry and rewards
    // @deprecated - entryFee is kept for backward compatibility but all contests are free
    entryFee?: EntryFeeConfig; // Optional - all contests are free
    rewards?: RewardConfig[];
    
    // Compliance fields (REQUIRED for all campaigns)
    isFreeContest: true; // Always true - all contests are free
    fundedBy: 'sponsor'; // Always sponsor-funded
    nonCashOnly: true; // Always true - no cash prizes allowed
    
    // Prize distribution
    prizeDistribution?: PrizeDistribution; // Structured prize tiers (non-cash only)
    
    // Events
    events?: FantasyEvent[]; // Events within this campaign
    
    // Leaderboards
    leaderboards?: {
        overall?: CampaignLeaderboard;
        movieWise?: Record<string, CampaignLeaderboard>; // movieId -> leaderboard
        cityWise?: CampaignLeaderboard;
        stateWise?: CampaignLeaderboard;
    };
    
    // Metadata
    createdAt: Date;
    updatedAt: Date;
    createdBy?: string;
}

export type CricketEventType =
    // Powerplay Events
    | 'powerplay_runs'
    | 'powerplay_wickets'
    | 'powerplay_boundaries'
    | 'powerplay_sixes'
    | 'powerplay_overs'
    // Batting Events
    | 'first_ball_runs'
    | 'first_boundary'
    | 'first_six'
    | 'first_wicket'
    | 'first_50_partnership'
    | 'first_100_partnership'
    | 'highest_individual_score'
    | 'most_boundaries'
    | 'most_sixes'
    | 'strike_rate_range'
    // Bowling Events
    | 'first_wicket_bowler'
    | 'most_wickets'
    | 'best_economy'
    | 'maiden_overs'
    | 'hat_trick'
    | 'first_5_wicket_haul'
    // Match Outcome Events
    | 'toss_winner'
    | 'toss_decision'
    | 'match_winner'
    | 'win_margin'
    | 'win_by_wickets_or_runs'
    | 'total_runs'
    | 'total_wickets'
    | 'total_fours'
    | 'total_sixes'
    | 'total_extras'
    // Innings Events
    | 'first_innings_score'
    | 'second_innings_score'
    | 'first_innings_wickets'
    | 'second_innings_wickets'
    // Test Match Specific
    | 'first_innings_lead'
    | 'follow_on'
    | 'declaration'
    | 'century_count'
    | 'fifty_count'
    // ODI Specific
    | '300_plus_score'
    | '400_plus_score'
    | 'chase_successful'
    // T20/IPL Specific
    | '200_plus_score'
    | 'fastest_50'
    | 'fastest_100'
    | 'super_over'
    | 'drs_reviews'
    | 'timeout_taken';

export type CricketEvent = {
    id: string;
    title: string;
    description: string;
    eventType: CricketEventType;
    matchId: string;
    innings?: number; // 1 or 2 (for two-innings formats)
    status: 'upcoming' | 'live' | 'completed' | 'locked';
    startTime?: Date;
    endTime?: Date;
    lockTime?: Date;
    points: number;
    difficultyLevel?: 'easy' | 'medium' | 'hard';
    options?: string[]; // For choice_selection type
    rules?: string[];
    result?: EventResult;
    applicableFormats?: ('T20' | 'ODI' | 'Test')[]; // Which formats this event applies to
    category?: CricketEventCategory; // Category for grouping events
    createdAt: Date;
    updatedAt: Date;
}

export type FantasyMatch = {
    id: string;
    matchName: string;
    format: "T20" | "ODI" | "Test" | "IPL";
    teams: string[];
    team1: string;
    team2: string;
    venue?: string;
    startTime: Date;
    status: "upcoming" | "live" | "completed";
    events?: CricketEvent[];
    description?: string;
    entryFee?: {
        type: 'free' | 'paid';
        amount?: number;
    };
    maxParticipants?: number;
    tournamentId?: string; // Link to tournament if part of one
    createdAt: Date;
    updatedAt: Date;
}

// Tournament Group
export type TournamentGroup = {
    id: string;
    name: string; // e.g., "Group A", "Group B"
    teams: string[];
    order: number;
}

// Tournament Event Types
export type TournamentEventType =
    // Tournament Level
    | 'tournament_winner'
    | 'tournament_runner_up'
    | 'semi_finalists'
    | 'finalists'
    | 'points_table_topper'
    // Group Level
    | 'group_topper'
    | 'group_second_place'
    | 'group_qualifiers'
    | 'group_team_points'
    // Player Level
    | 'top_run_scorer'
    | 'top_wicket_taker'
    | 'tournament_mvp'
    | 'most_sixes'
    | 'best_strike_rate'
    | 'most_centuries'
    | 'most_fifties'
    | 'best_bowling_average'
    // Special Events
    | 'most_toss_wins'
    | 'highest_team_total'
    | 'lowest_team_total'
    | 'super_over_count'
    | 'highest_individual_score'
    | 'fastest_fifty_tournament'
    | 'fastest_hundred_tournament'
    // Live Tournament Predictions
    | 'group_qualifier_live'
    | 'top_2_after_matches'
    | 'playoff_qualifier'
    | 'mvp_as_of_today';

// Tournament Event
export type TournamentEvent = {
    id: string;
    title: string;
    description: string;
    eventType: TournamentEventType;
    tournamentId: string;
    groupId?: string; // For group-level events
    status: 'upcoming' | 'live' | 'completed' | 'locked';
    startDate: Date;
    endDate: Date;
    lockTime?: Date; // When predictions lock
    points: number;
    difficultyLevel?: 'easy' | 'medium' | 'hard';
    options?: string[]; // For choice_selection
    multiSelect?: boolean; // For multi-select predictions (e.g., semi-finalists)
    maxSelections?: number; // Max selections allowed (e.g., 4 for semi-finalists)
    rules?: string[];
    result?: EventResult;
    applicableFormats?: ('T20' | 'ODI' | 'Test' | 'IPL')[];
    // Event-level sponsorship (micro-level)
    sponsorId?: string; // Reference to image-ad-sponsors collection
    sponsorName?: string; // Sponsor name for display
    sponsorLogo?: string; // Sponsor logo URL
    sponsorWebsite?: string; // Sponsor website URL
    createdAt: Date;
    updatedAt: Date;
}

// Cricket Tournament / Series
export type CricketTournament = {
    id: string;
    name: string; // e.g., "ICC Men's T20 World Cup 2024"
    format: "T20" | "ODI" | "Test" | "IPL";
    description?: string;
    startDate: Date;
    endDate: Date;
    status: 'upcoming' | 'live' | 'completed';
    teams: string[]; // All participating teams
    groups?: TournamentGroup[]; // For tournaments with groups
    venue?: string; // Primary venue or "Multiple Venues"
    entryFee: {
        type: 'free' | 'paid' | 'ad_watch';
        amount?: number;
        tiers?: Array<{ amount: number; label: string }>; // e.g., ₹99, ₹199, ₹499
        seasonPass?: boolean; // For IPL full season
    };
    entryMethod?: 'free' | 'paid' | 'ad_watch'; // How users can enter
    advertisementId?: string; // If entryMethod is 'ad_watch', link to specific ad
    maxParticipants?: number;
    events?: TournamentEvent[];
    matches?: string[]; // Array of match IDs
    prizePool?: string; // @deprecated - Use prizeDistribution.totalPrizePool instead. Display as "Sponsored Rewards Pool"
    sponsorName?: string;
    sponsorLogo?: string;
    visibility: 'public' | 'private' | 'invite_only';
    createdAt: Date;
    updatedAt: Date;
    createdBy?: string;
}

export type CricketerProfile = {
    id: string;
    name: string;
    country: string;
    roles: string[];
    avatarUrl?: string;
    bio?: string;
    dateOfBirth?: string;
    battingStyle?: string;
    bowlingStyle?: string;
    consistencyIndex?: number;
    impactScore?: number;
    trendingRank?: number;
    recentForm?: number[];
    careerPhase?: 'Early' | 'Peak' | 'Late';
}

export type TeamProfile = {
    id: string;
    name: string;
    type: 'ip' | 'national';
    logoUrl?: string;
    country?: string;
    foundedYear?: number;
    homeGround?: string;
    description?: string;
}

export type FantasyRoleSelection = {
    userId: string;
    matchId: string;
    innings: number;
    selectedRoles: Record<string, string>; // e.g., { "powerplay-king": "player-id-1" }
    lockedAt: Date;
};

// User Participation
export type UserParticipation = {
    userId: string;
    campaignId: string;
    totalPoints: number;
    movieWisePoints: Record<string, number>;
    predictionsCount: number;
    correctPredictions: number;
    rank?: number;
    lastUpdated: Date;
}

// Fraud Detection
export type FraudFlag = {
    userId: string;
    reason: 'multiple_accounts' | 'same_device' | 'unusual_pattern' | 'suspicious_activity';
    severity: 'low' | 'medium' | 'high';
    flaggedAt: Date;
    flaggedBy?: string;
    resolved: boolean;
    resolvedAt?: Date;
    notes?: string;
}

export type CouponCode = {
  id: string;
  code: string;
  description?: string;
  discountType: 'percentage' | 'fixed' | 'points';
  discountValue: number;
  minPurchaseAmount?: number;
  maxDiscountAmount?: number;
  validFrom: Date;
  validUntil: Date;
  maxRedemptions?: number;
  currentRedemptions: number;
  isActive: boolean;
  applicableTo?: string[]; // Categories, products, etc.
  createdAt: Date;
  createdBy: string; // Admin user ID
  updatedAt: Date;
};

export type CouponRedemption = {
  id: string;
  couponId: string;
  couponCode: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  redeemedAt: Date;
  orderId?: string;
  discountAmount: number;
  originalAmount?: number;
  finalAmount?: number;
};

// Voucher System Types
export type Voucher = {
  id: string;
  name: string; // e.g., "Amazon Voucher ₹500", "Petrol Voucher ₹99"
  description?: string;
  voucherType: 'amazon' | 'petrol' | 'grocery' | 'other';
  pointsRequired: number; // Points needed to redeem
  value: number; // Voucher value in ₹
  imageUrl?: string;
  terms?: string; // Terms and conditions
  active: boolean; // Whether voucher is available for redemption
  stock?: number; // Number of vouchers available (undefined = unlimited)
  redeemedCount?: number; // Number of times this voucher has been redeemed
  createdAt: Date;
  updatedAt: Date;
};

export type VoucherRedemption = {
  id: string;
  userId: string;
  voucherId: string;
  voucherName: string;
  pointsSpent: number;
  voucherValue: number;
  voucherCode?: string; // Actual voucher code if generated
  status: 'pending' | 'fulfilled' | 'cancelled';
  redeemedAt: Date;
  fulfilledAt?: Date;
  notes?: string; // Admin notes
};

export type RewardMilestoneConfig = {
  id: string;
  name: string; // e.g., "30-Day Login Streak", "30 Games in 30 Days"
  description?: string;
  type: 'login_streak' | 'games_played' | 'points_earned' | 'custom';
  requirement: {
    days?: number; // For login streak (e.g., 30)
    games?: number; // For games played (e.g., 30)
    daysWindow?: number; // Time window for games (e.g., 30 days)
    points?: number; // For points earned milestone
  };
  reward: {
    voucherId?: string; // Voucher to award
    voucherName?: string; // Voucher name (if voucher doesn't exist yet)
    points?: number; // Points to award instead of voucher
  };
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type NewRewardMilestoneConfig = Omit<RewardMilestoneConfig, 'id' | 'createdAt' | 'updatedAt'>;

export type UserMilestoneProgress = {
  milestoneId: string;
  milestoneName: string;
  currentProgress: number; // Current count (days/games/points)
  requiredProgress: number; // Required count
  achieved: boolean;
  achievedAt?: Date;
  lastUpdated: Date;
};

// Image Advertisement Types
export type ImageAdvertisement = {
  id: string;
  sponsorId: string;
  sponsorName: string;
  title: string;
  description?: string;
  
  // Image instead of video
  imageUrl: string;
  thumbnailUrl?: string;
  
  // Display Settings
  displayDuration: number; // Seconds to show (default: 5)
  clickThroughUrl?: string; // URL when image is clicked
  
  // Repeat Behavior
  allowMultipleViews?: boolean; // Allow showing ad multiple times for same campaign/tournament
  repeatInterval?: 'never' | 'always' | 'daily' | 'weekly' | 'session'; // When to repeat ad
  minTimeBetweenViews?: number; // Minimum seconds between views (alternative to repeatInterval)
  
  // Targeting
  targetTournaments?: string[];
  targetCampaigns?: string[]; // For movie fantasy campaigns
  targetCategories?: string[];
  
  // Status & Scheduling
  status: 'active' | 'inactive' | 'scheduled' | 'expired';
  startDate: Date;
  endDate: Date;
  priority: number; // Higher = shown first
  
  // Limits
  maxViews?: number;
  currentViews: number;
  maxViewsPerUser?: number;
  
  // Tracking
  trackingPixel?: string;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // Admin user ID
};

export type ImageAdView = {
  id: string;
  advertisementId: string;
  userId: string;
  tournamentId?: string; // For cricket tournaments
  campaignId?: string; // For movie fantasy campaigns
  
  // View Details
  viewedAt: Date;
  viewedDuration: number; // Seconds viewed
  wasCompleted: boolean; // Viewed for required duration
  
  // Interaction
  clicked: boolean;
  clickedAt?: Date;
  clickThroughUrl?: string;
  
  // Device Info
  deviceType: 'mobile' | 'tablet' | 'desktop';
  browser: string;
};

export type ImageAdSponsor = {
  id: string;
  name: string;
  companyName: string;
  logoUrl?: string;
  contactEmail: string;
  contactPhone?: string;
  
  // Social Links
  website?: string;
  instagram?: string;
  twitter?: string;
  facebook?: string;
  
  // Billing
  billingAddress?: string;
  paymentMethod?: string;
  totalSpent: number;
  totalViews: number;
  
  // Status
  status: 'active' | 'inactive' | 'suspended';
  contractStartDate?: Date;
  contractEndDate?: Date;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
};
