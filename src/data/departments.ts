export type TrackCategory = 'social' | 'automation' | 'freelancing';

export interface EligibilityRow {
  metric: string;
  requirement: string;
  notes: string;
}

export interface CourseStep {
  id: string;
  stepNumber: string;
  title: string;
  duration: string;
  objective: string;
  instructions: string;
  checklist: string[];
  deliverable: string;
  mentorPrompt: string;
}

export interface BlueprintTemplate {
  id: string;
  title: string;
  format: 'json' | 'text';
  summary: string;
  content: string;
}

export interface WeeklyMilestone {
  week: string;
  focusTitle: string;
  targetMetric: string;
  tasks: string[];
}

export interface InsightTargets {
  primaryLabel: string;
  primaryGoal: number;
  primaryUnit: string;
  secondaryLabel: string;
  secondaryGoal: number;
  secondaryUnit: string;
}

export interface DepartmentTrack {
  id: string;
  title: string;
  shortName: string;
  category: TrackCategory;
  categoryLabel: string;
  level: string;
  timeToFirstDollar: string;
  earningModel: string;
  imageUrl: string;
  exampleTemplateImage: string;
  exampleTemplateCaption: string;
  officialDocUrl: string;
  officialDocLabel: string;
  summary: string;
  romanUrduIntro: string;
  eligibility: EligibilityRow[];
  revenueStreams: string[];
  requiredTools: string[];
  policyWarnings: string[];
  insightTargets: InsightTargets;
  weeklyMilestones: WeeklyMilestone[];
  steps: CourseStep[];
  blueprints: BlueprintTemplate[];
  quickPrompts: string[];
}

export const TEMPLATE_IMAGE_PRESETS = [
  {
    id: 'yt-thumb',
    label: 'YouTube Analytics / Tech Tutorial',
    url: '/src/assets/images/tpl_youtube_thumbnail_1795095058373.jpg',
    defaultFormat: '16:9' as const,
  },
  {
    id: 'fb-reel',
    label: 'Facebook / Instagram Vertical Studio',
    url: '/src/assets/images/tpl_facebook_reel_layout_1795095057768.jpg',
    defaultFormat: '4:5' as const,
  },
  {
    id: 'n8n-map',
    label: 'n8n AI Automation Architecture',
    url: '/src/assets/images/tpl_n8n_workflow_map_1795095058035.jpg',
    defaultFormat: '16:9' as const,
  },
  {
    id: 'freelance-deck',
    label: 'Client Proposal / Freelance Case Study',
    url: '/src/assets/images/tpl_freelance_portfolio_shot_1795095058317.jpg',
    defaultFormat: '4:5' as const,
  },
  {
    id: 'creator-desk',
    label: 'Creator Workstation Hero',
    url: '/src/assets/images/hero_creator_studio_1795091708946.jpg',
    defaultFormat: '16:9' as const,
  },
];

export const DEPARTMENT_TRACKS: DepartmentTrack[] = [
  {
    id: 'youtube',
    title: 'YouTube Monetization & Faceless Automation',
    shortName: 'YouTube',
    category: 'social',
    categoryLabel: 'Social Monetization',
    level: 'Beginner to Pro',
    timeToFirstDollar: '60 - 120 Days',
    earningModel: 'AdSense RPM + Sponsorships + Affiliate',
    imageUrl: '/src/assets/images/tpl_youtube_thumbnail_1795095058373.jpg',
    exampleTemplateImage: '/src/assets/images/tpl_youtube_thumbnail_1795095058373.jpg',
    exampleTemplateCaption: 'Example high-CTR dark studio tutorial thumbnail composition (subject right, chart left).',
    officialDocUrl: 'https://support.google.com/youtube/answer/72851',
    officialDocLabel: 'YouTube Partner Program Official Criteria',
    summary:
      'Complete system to launch, rank, and monetize high-RPM YouTube channels (personal or faceless automation) using retention scripting, CTR thumbnail engineering, and compliant AdSense payouts.',
    romanUrduIntro:
      'YouTube par apna face dikhaye baghair (Faceless Automation) ya personal brand channel bana kar AdSense, sponsorships, aur affiliate se dollar earning karne ka mukammal step-by-step roadmap.',
    eligibility: [
      {
        metric: 'Tier 1 (Fan Funding)',
        requirement: '500 Subscribers + 3 Public Uploads',
        notes: 'Plus 3,000 watch hours (12 mo) OR 3M Shorts views (90 days).',
      },
      {
        metric: 'Tier 2 (Ad Revenue)',
        requirement: '1,000 Subscribers',
        notes: 'Plus 4,000 valid public watch hours (12 mo) OR 10M Shorts views (90 days).',
      },
      {
        metric: 'Payout Threshold',
        requirement: '$100 USD Minimum',
        notes: 'Requires Google AdSense PIN verification & W-8BEN tax form.',
      },
      {
        metric: 'High-RPM Niches',
        requirement: '$6 - $24 per 1,000 views',
        notes: 'SaaS tutorials, finance, AI tools, B2B case studies, luxury/engineering.',
      },
    ],
    revenueStreams: [
      'Long-form AdSense Watch Page Ads (55% creator revenue share)',
      'YouTube Shorts Ad Revenue Sharing (45% creator pool share)',
      'Dedicated Brand Integrations & Sponsored Segments ($300 - $5,000+)',
      'High-Ticket Affiliate Links in Pinned Comments & Descriptions',
    ],
    requiredTools: [
      'YouTube Studio & VidIQ / TubeBuddy (Keyword gap research)',
      'CapCut Desktop / Premiere Pro / DaVinci Resolve',
      'ElevenLabs or clean condenser mic (Shure MV7 / Fifine AM8)',
      'Google AdSense + Payoneer / Local USD Bank Account',
    ],
    policyWarnings: [
      'Never upload unedited AI slideshows or raw Reddit text-to-speech — YouTube flags this as "Reused / Repetitious Content" during YPP review.',
      'Always add original commentary, custom pacing, visual B-roll storytelling, and human-edited transitions.',
      'Avoid copyrighted music clips over 5 seconds; use YouTube Audio Library or Epidemic Sound licenses.',
    ],
    insightTargets: {
      primaryLabel: 'Public Watch Hours',
      primaryGoal: 4000,
      primaryUnit: 'hrs',
      secondaryLabel: 'Channel Subscribers',
      secondaryGoal: 1000,
      secondaryUnit: 'subs',
    },
    weeklyMilestones: [
      {
        week: 'Week 01',
        focusTitle: 'Niche Lock, Channel Branding & Packaging',
        targetMetric: '3 Video Topics + 3 Thumbnails Ready',
        tasks: [
          'Validate 5 competitor channels under 100K subs getting 25K+ views',
          'Set up channel banner, 2FA, keyword bio, and business contact email',
          'Design 3 high-contrast 1280x720 thumbnails before scripting',
        ],
      },
      {
        week: 'Week 02',
        focusTitle: 'Production Sprint & First 2 Long-Form Uploads',
        targetMetric: '2 Long Videos (8+ mins) + 4 Shorts',
        tasks: [
          'Write retention-focused scripts with strong 30-second payoff hooks',
          'Mix clean voiceover (-14 LUFS) with licensed background audio',
          'Publish 2 long-form videos + 4 companion Shorts linking to long videos',
        ],
      },
      {
        week: 'Week 03',
        focusTitle: 'CTR & Retention Optimization Loop',
        targetMetric: 'Target > 5.5% CTR & > 42% Retention',
        tasks: [
          'Inspect YouTube Studio Audience Retention dips at 0:30 mark',
          'Swap underperforming thumbnails (< 4% CTR) after 48 hours',
          'Publish 2 more videos doubling down on top viewer search terms',
        ],
      },
      {
        week: 'Week 04',
        focusTitle: 'Scale Cadence, Affiliate & YPP Readiness',
        targetMetric: '8+ Long Videos Live + Affiliate Pinned',
        tasks: [
          'Add relevant software/tool affiliate links to top-viewed videos',
          'Audit entire catalog for Reused Content compliance',
          'Track daily watch hours toward 3,000 (Tier 1) and 4,000 (Tier 2)',
        ],
      },
    ],
    steps: [
      {
        id: 'yt-1',
        stepNumber: '01',
        title: 'High-RPM Niche & Channel Architecture',
        duration: 'Day 1 - 3',
        objective: 'Select a sustainable niche with proven advertiser demand and low saturation.',
        instructions:
          'Pick a niche intersecting advertiser budgets (AI workflows, software reviews, personal finance, documentary explainers) rather than low-RPM general entertainment. Validate 5 competitor channels under 100k subscribers getting 30k+ views per video.',
        checklist: [
          'Research 5 emerging competitor channels using YouTube Incognito search',
          'Verify target RPM is above $4 by checking software/finance/education advertisers',
          'Set up Brand Account with 2FA, custom handle, banner, and keyword-rich About bio',
        ],
        deliverable: 'Validated Niche Sheet + 10 Proven Video Topic Titles',
        mentorPrompt:
          'Walk me through Step 1 of YouTube Monetization. Help me pick a high-RPM niche and validate 5 video ideas step by step.',
      },
      {
        id: 'yt-2',
        stepNumber: '02',
        title: 'Packaging First: Title & Thumbnail Psychology',
        duration: 'Day 4 - 6',
        objective: 'Design clickable packaging BEFORE writing a single word of the script.',
        instructions:
          'High CTR (6% - 11%) starts before filming. Craft a curiosity-gap title under 55 characters paired with a maximum 3-element thumbnail (1 focal subject, 1 contrast background, 2-4 bold words max).',
        checklist: [
          'Write 5 title variations per video focusing on outcome or contrast',
          'Design thumbnail at 1280x720 with high figure-ground contrast',
          'Test readability at small mobile thumbnail size (160px width)',
        ],
        deliverable: '3 Click-Tested Title + Thumbnail Pairings',
        mentorPrompt:
          'Guide me on Step 2: Teach me how to create a high-CTR title and thumbnail concept before scripting.',
      },
      {
        id: 'yt-3',
        stepNumber: '03',
        title: 'Retention Scripting & 30-Second Hook Formula',
        duration: 'Day 7 - 10',
        objective: 'Hold 65%+ of viewers past the first 30 seconds to trigger algorithmic push.',
        instructions:
          'Open by confirming the title promise in the first 5 seconds, introduce an open loop or stakes by second 15, and structure the body into tight 90-second micro-chapters with pattern interrupts.',
        checklist: [
          'Cut intro fluff (no "Hey guys welcome back to my channel")',
          'Write an immediate payoff hook matching the thumbnail',
          'Add visual cues every 4-6 seconds for the editor',
        ],
        deliverable: 'Complete 1,200-Word Retention Script',
        mentorPrompt:
          'Help me write a 30-second high-retention YouTube hook and script structure for Step 3.',
      },
      {
        id: 'yt-4',
        stepNumber: '04',
        title: 'Production, Voiceover & Originality Compliance',
        duration: 'Day 11 - 16',
        objective: 'Edit a clean 8-12 minute video that passes YouTube Partner Policy easily.',
        instructions:
          'Ensure mid-roll ad eligibility (8+ minutes length). Layer crisp voiceover (-14 LUFS loudness), subtle ambient music (-26 dB), motion graphics, and original visual storytelling so YPP reviewers see clear human creative value.',
        checklist: [
          'Export at 1080p or 4K 60fps/30fps with normalized voice audio',
          'Add custom chapter timestamps in the description',
          'Upload unlisted first to verify zero copyright claims',
        ],
        deliverable: 'First 3 Published Long-Form Videos + 5 Companion Shorts',
        mentorPrompt:
          'Walk me through Step 4: How do I edit and verify my video passes YouTube originality and copyright checks?',
      },
      {
        id: 'yt-5',
        stepNumber: '05',
        title: 'Analytics Iteration & Watch Hour Scaling',
        duration: 'Day 17 - 60',
        objective: 'Reach 1,000 subscribers and 4,000 watch hours systematically.',
        instructions:
          'Publish 2 consistent long-form videos weekly. After 48 hours on each upload, inspect Retention Graph dips and Impression CTR. Double down on the top 20% performing topics.',
        checklist: [
          'Audit Average View Duration (target > 45% on 8-10 min videos)',
          'Swap thumbnail on underperforming videos (< 4% CTR) after 48 hours',
          'Pin an affiliate or lead-magnet comment under top-performing videos',
        ],
        deliverable: 'Weekly Retention Audit & 4,000 Watch-Hour Milestone',
        mentorPrompt:
          'Show me Step 5: How to read YouTube Studio retention analytics to scale faster to 4,000 watch hours.',
      },
      {
        id: 'yt-6',
        stepNumber: '06',
        title: 'AdSense Verification, Tax Form & Sponsor Pitching',
        duration: 'Day 60+',
        objective: 'Activate clean payouts and layer direct brand sponsorships.',
        instructions:
          'Apply for YPP inside YouTube Studio > Earn. Link a clean Google AdSense account, submit W-8BEN tax form (to reduce US withholding via treaty if eligible), complete identity + address PIN verification, and add a business inquiry email for sponsors.',
        checklist: [
          'Link AdSense account and enable Mid-Roll Ads on 8+ min videos',
          'Complete W-8BEN tax form inside AdSense Payments Settings',
          'Create a 1-page Media Kit for direct sponsorship outreach',
        ],
        deliverable: 'Active Monetized Channel + Sponsor Outreach Kit',
        mentorPrompt:
          'Guide me through Step 6: How to apply for YPP, fill out AdSense W-8BEN tax details, and pitch sponsors.',
      },
    ],
    blueprints: [
      {
        id: 'yt-bp-1',
        title: 'High-Retention Script Skeleton (8-Min Video)',
        format: 'text',
        summary: 'Proven structure used by faceless documentary and tech channels.',
        content: `[0:00 - 0:15] THE HOOK: Confirm title promise immediately + state the hidden problem.
[0:15 - 0:45] THE STAKES: Why solving this saves time/money + preview the final outcome.
[0:45 - 2:30] CHAPTER 1 (Context): Quick origin or foundation with rapid B-roll cuts.
[2:30 - 5:30] CHAPTER 2 (Core Mechanism): Step-by-step breakdown + screen/visual proof.
[5:30 - 7:30] CHAPTER 3 (Advanced Twist): The mistake 90% make and how to bypass it.
[7:30 - 8:15] PAYOFF & NEXT CLICK: Wrap cleanly and bridge directly to your next related video (end screen).`,
      },
      {
        id: 'yt-bp-2',
        title: 'Sponsor Outreach Email Template',
        format: 'text',
        summary: 'Direct email pitch for SaaS & creator brands once hitting 5k+ views/video.',
        content: `Subject: Integration idea for [Brand Name] on [Channel Name] ([Avg Views] avg views)

Hi [First Name],

I run [Channel Name], where we teach [Target Audience] how to [Core Outcome]. Our last 5 videos averaged [Number] views with a [Percentage]% audience in Tier-1 countries (US/UK/CA).

I am filming a deep-dive on "[Video Title]" next week and [Brand Name] fits naturally at the [Timestamp] mark. Would you be open to a 60-second dedicated integration or a 3-video test package?

Happy to send our 1-page audience breakdown.

Best,
[Your Name]`,
      },
    ],
    quickPrompts: [
      'Explain all YouTube monetization requirements in Roman Urdu',
      'Give me 5 low-competition high-RPM faceless YouTube niches',
      'Walk me through Step 1 right now and give me a task',
      'How do I pass YouTube Reused Content review safely?',
    ],
  },
  {
    id: 'facebook',
    title: 'Facebook In-Stream Ads, Reels & Page Monetization',
    shortName: 'Facebook',
    category: 'social',
    categoryLabel: 'Social Monetization',
    level: 'Beginner to Intermediate',
    timeToFirstDollar: '30 - 90 Days',
    earningModel: 'In-Stream Ads + Ads on Reels + Performance Bonus',
    imageUrl: '/src/assets/images/tpl_facebook_reel_layout_1795095057768.jpg',
    exampleTemplateImage: '/src/assets/images/tpl_facebook_reel_layout_1795095057768.jpg',
    exampleTemplateCaption: 'Example vertical Reels studio framing with soft key light and lav mic for 100% Meta originality compliance.',
    officialDocUrl: 'https://www.facebook.com/business/help/169845596919485',
    officialDocLabel: 'Meta In-Stream Ads & Partner Policy Official Docs',
    summary:
      'Build policy-compliant Facebook Pages, trigger viral recommendation loops via Reels and 3-minute In-Stream videos, and set up clean international payouts without Limited Originality flags.',
    romanUrduIntro:
      'Facebook Page aur Reels se In-Stream Ads, Ads on Reels aur Performance Bonus ke zariye earning shuru karne aur LOC (Limited Originality of Content) policy issues se bachne ka mukammal tareeqa.',
    eligibility: [
      {
        metric: 'In-Stream Ads',
        requirement: '5,000 Followers + 60,000 Minutes',
        notes: '60k watch minutes in the last 60 days + 5 active videos on Page.',
      },
      {
        metric: 'Ads on Reels',
        requirement: 'Invite / Content Monetization',
        notes: 'Consistent original Reels + zero Partner Monetization Policy strikes.',
      },
      {
        metric: 'Content Monetization',
        requirement: 'Unified Meta Beta Program',
        notes: 'Combines In-Stream, Reels, and Performance Bonus under one payout.',
      },
      {
        metric: 'Payout Eligibility',
        requirement: 'Eligible Country Admin + $25/$100',
        notes: 'Bank/PayPal/Payoneer payout account with valid tax ID/W-8BEN.',
      },
    ],
    revenueStreams: [
      'In-Stream Video Ads (1-min+ and 3-min+ horizontal/vertical videos)',
      'Ads on Reels (overlay & post-loop ads paid by views/engagement)',
      'Performance Bonus Program (paid on photo, text, and link post reach)',
      'Stars & Subscriptions from loyal community followers',
    ],
    requiredTools: [
      'Meta Business Suite & Professional Dashboard',
      'CapCut / Premiere for 1:1 square & 9:16 vertical cuts',
      'Meta Sound Collection (Licensed Royalty-Free Audio)',
      'Verified Payout Account (Wise / Payoneer / Local Bank in eligible regions)',
    ],
    policyWarnings: [
      'Unoriginal Content (LOC / Limited Originality of Content) is the #1 reason pages lose monetization. Never repost watermarked TikTok/YouTube clips without transformative commentary and original editing.',
      'Do not share your own page videos into 20 spammy groups from the same admin ID — Meta flags this as "Inauthentic Engagement".',
      'Always verify your Page Quality and Monetization Status in Meta Business Suite before scaling.',
    ],
    insightTargets: {
      primaryLabel: '60-Day Watch Minutes',
      primaryGoal: 60000,
      primaryUnit: 'mins',
      secondaryLabel: 'Page Followers',
      secondaryGoal: 5000,
      secondaryUnit: 'followers',
    },
    weeklyMilestones: [
      {
        week: 'Week 01',
        focusTitle: 'Clean Page Setup, 2FA & Originality Foundation',
        targetMetric: 'Green Page Quality + 10 Original Reels',
        tasks: [
          'Verify Page Quality is Green in Meta Business Suite with 2FA enabled on admins',
          'Publish 10 original Reels (15-40s) using Meta Sound Collection audio only',
          'Avoid cross-sharing from admin profile into external spam groups',
        ],
      },
      {
        week: 'Week 02',
        focusTitle: 'Follower Acceleration & 3-Min Video Launch',
        targetMetric: '1,500+ Followers + 15,000 Watch Minutes',
        tasks: [
          'Publish 2 daily Reels + 3 three-minute storytelling videos (4:5 vertical/square)',
          'Reply to early comments with follow-up questions to boost comment velocity',
          'Track 3-second vs 1-minute video views in Meta Insights',
        ],
      },
      {
        week: 'Week 03',
        focusTitle: 'Watch-Time Push & Policy Pre-Audit',
        targetMetric: '3,500+ Followers + 40,000 Watch Minutes',
        tasks: [
          'Double down on top 2 hooks driving highest organic Shares',
          'Delete any borderline clip that uses external stock without clear transformation',
          'Verify 5 active original videos are live on the Page',
        ],
      },
      {
        week: 'Week 04',
        focusTitle: '60K Threshold, Payout Account & Monetization Review',
        targetMetric: '5,000 Followers + 60,000 Mins + Payout Submitted',
        tasks: [
          'Match legal ID name identically with Bank / Payoneer payout details',
          'Complete W-8BEN / tax profile inside Meta Payout Settings',
          'Submit In-Stream Ads / Content Monetization review cleanly',
        ],
      },
    ],
    steps: [
      {
        id: 'fb-1',
        stepNumber: '01',
        title: 'Policy-Safe Page Setup & Eligible Payout Architecture',
        duration: 'Day 1 - 2',
        objective: 'Create a clean Facebook Page with proper category, 2FA, and compliant admin structure.',
        instructions:
          'Avoid old/flagged pages with hidden violations. Create a fresh Page (or verify Page Quality is Green), enable Two-Factor Authentication on all admins, and ensure payout admin resides in an eligible country if your region lacks specific Meta ad tools.',
        checklist: [
          'Check Page Quality tab shows zero community or intellectual property strikes',
          'Set clear niche category (Digital Creator / Education / Media)',
          'Enable 2FA on all Business Manager admin accounts',
        ],
        deliverable: 'Green-Status Facebook Page + Business Manager Setup',
        mentorPrompt:
          'Walk me through Step 1 of Facebook Monetization: How to set up a clean Page and check eligibility countries safely.',
      },
      {
        id: 'fb-2',
        stepNumber: '02',
        title: 'Organic 5K Followers & 60K Watch Minutes Sprint',
        duration: 'Day 3 - 25',
        objective: 'Hit 5,000 followers and 60,000 minutes viewed organically via Reels + 3-min videos.',
        instructions:
          'Use high-shareability Reels (15-40 seconds) to acquire followers fast, paired with 3-minute storytelling videos (1:1 or 4:5 aspect ratio fills mobile feeds) to build watch minutes rapidly.',
        checklist: [
          'Publish 2 original Reels daily with bold on-screen captions in first 2 seconds',
          'Publish 3 long-form videos (3+ mins) per week for watch time accumulation',
          'End posts with a debate/question prompt to boost comment velocity',
        ],
        deliverable: '30-Day Content Sprint Log',
        mentorPrompt:
          'Teach me Step 2: What exact content mix gets 5,000 followers and 60,000 watch minutes fastest on Facebook?',
      },
      {
        id: 'fb-3',
        stepNumber: '03',
        title: 'Originality Shield & Copyright Clearance',
        duration: 'Day 26 - 30',
        objective: 'Eliminate Limited Originality of Content (LOC) triggers before applying.',
        instructions:
          'Audit every video before applying: remove any stock clips used without heavy visual transformation, ensure voiceover or face presence is authentic, and stick strictly to Meta Sound Collection music for monetized Reels.',
        checklist: [
          'Replace copyrighted background tracks with Meta Sound Collection audio',
          'Ensure 100% original voiceover or face-cam intro on curated topics',
          'Delete any borderline reposted clips before submitting monetization review',
        ],
        deliverable: 'Policy-Clean Content Audit Checklist',
        mentorPrompt:
          'Explain Step 3: How do I prevent Limited Originality of Content (LOC) and fix it if it happens?',
      },
      {
        id: 'fb-4',
        stepNumber: '04',
        title: 'Payout Account, Tax Form & Monetization Submission',
        duration: 'Day 31 - 35',
        objective: 'Submit In-Stream Ads & Ads on Reels onboarding cleanly.',
        instructions:
          'Inside Meta Business Suite > Monetization, submit your application, attach your bank/Payoneer/Wise payout credentials matching your legal ID, and complete the W-8BEN or local tax questionnaire accurately.',
        checklist: [
          'Match legal name on ID, bank account, and Meta Payout profile identically',
          'Complete W-8BEN / Tax Info inside Payout Settings',
          'Submit In-Stream Ads review and wait 3-10 business days',
        ],
        deliverable: 'Approved Meta Payout Account',
        mentorPrompt:
          'Walk me through Step 4: How to set up Facebook Payout Account and Tax Information step by step.',
      },
      {
        id: 'fb-5',
        stepNumber: '05',
        title: 'Performance Bonus & Multi-Format Scaling',
        duration: 'Day 36 - 60',
        objective: 'Multiply Page revenue using high-engagement photo/text posts + Reels.',
        instructions:
          'Meta pays Performance Bonus on viral static image carousels, relatable quotes, and discussion threads alongside video ads. Post 3 high-save image posts daily alongside your video schedule.',
        checklist: [
          'Test 3 carousel / infographic posts daily for shareability',
          'Pin top-performing Reels to your Page header',
          'Track RPM per video in Meta Insights > Earnings',
        ],
        deliverable: 'Multi-Format Weekly Monetization Schedule',
        mentorPrompt:
          'Show me Step 5: How to maximize Facebook Performance Bonus and Ads on Reels RPM.',
      },
      {
        id: 'fb-6',
        stepNumber: '06',
        title: 'Client Page Management (Freelance Agency Service)',
        duration: 'Day 60+',
        objective: 'Turn your Facebook growth skill into a $400-$1,200/mo service for creators & brands.',
        instructions:
          'Package your repeatable workflow as "Facebook Page Monetization & Reels Growth Management" on Upwork/Fiverr and pitch YouTubers who are leaving Facebook ad revenue on the table.',
        checklist: [
          'Document your own Page growth metrics as a case study screenshot',
          'Pitch 20 mid-sized YouTubers to repurpose their catalog natively to Facebook',
          'Charge a base retainer + % revenue share on Facebook earnings',
        ],
        deliverable: 'Facebook Growth Service Offer & Outreach Pitch',
        mentorPrompt:
          'Help me with Step 6: How do I sell Facebook Page Monetization management as a freelance service?',
      },
    ],
    blueprints: [
      {
        id: 'fb-bp-1',
        title: 'Facebook 3-Minute Video Retention Hook',
        format: 'text',
        summary: 'Optimized for mobile silent auto-play with bold captions.',
        content: `0:00-0:04 (Visual Shock + Bold Top Caption): "95% of creators lose this payout because of 1 setting..."
0:04-0:15 (Immediate Stakes): Show the exact problem on screen before explaining.
0:15-1:30 (Story/Breakdown): Use 4:5 vertical frame, captions in middle-lower third, zoom cut every 4s.
1:30-3:05 (Payoff Past 1-Min Ad Break): Deliver the core solution after the 60-second mid-roll trigger.`,
      },
    ],
    quickPrompts: [
      'Facebook monetization criteria aur payout setup Roman Urdu mein samjhao',
      'How do I avoid Limited Originality of Content on Facebook?',
      'Walk me through Step 1 of Facebook Page Monetization',
      'Write a pitch to manage a YouTuber’s Facebook Page for revenue share',
    ],
  },
  {
    id: 'instagram',
    title: 'Instagram Reels, Creator Marketplace & DM Automation',
    shortName: 'Instagram',
    category: 'social',
    categoryLabel: 'Social Monetization',
    level: 'Beginner to Pro',
    timeToFirstDollar: '21 - 60 Days',
    earningModel: 'Brand Deals + UGC + Digital Products via DM Funnels',
    imageUrl: '/src/assets/images/dept_social_monetization_1795091707708.jpg',
    exampleTemplateImage: '/src/assets/images/tpl_facebook_reel_layout_1795095057768.jpg',
    exampleTemplateCaption: 'Clean vertical framing with safe-zone captions keeping lower 20% unobstructed.',
    officialDocUrl: 'https://creators.instagram.com/',
    officialDocLabel: 'Instagram Creators Official Monetization Hub',
    summary:
      'Turn Instagram Reels reach into predictable income using Trial Reels, Creator Marketplace, automated DM funnels (ManyChat), and high-margin brand sponsorships or digital product sales.',
    romanUrduIntro:
      'Instagram par sirf likes nahi balkay Reels, Brand Deals, Creator Marketplace, aur automated DM funnels (ManyChat) ke zariye har post ko sales aur freelancing leads mein badalne ka tareeqa.',
    eligibility: [
      {
        metric: 'Professional Account',
        requirement: 'Creator or Business Mode',
        notes: 'Unlocks Insights, Creator Marketplace, and Instagram API for DM automation.',
      },
      {
        metric: 'Gifts & Bonuses',
        requirement: '1,000+ Followers (Region-based)',
        notes: 'Direct fan Gifts on Reels + invite-only seasonal Reels Bonuses.',
      },
      {
        metric: 'DM Funnel Revenue',
        requirement: 'No Minimum Followers',
        notes: 'Can sell services/digital products from Day 1 using Comment-to-DM triggers.',
      },
      {
        metric: 'Brand Sponsorships',
        requirement: '5K - 25K Targeted Niche',
        notes: 'Micro-influencers in tech/AI/business earn $150 - $1,500 per Reel.',
      },
    ],
    revenueStreams: [
      'Sponsored Reels & Story Packages via Instagram Creator Marketplace',
      'Automated Comment-to-DM Funnels selling courses, templates, or coaching',
      'Affiliate & SaaS recurring commissions promoted in Stories & Highlights',
      'Theme Page Shoutouts & Lead Generation for agencies',
    ],
    requiredTools: [
      'Instagram Professional Dashboard & Trial Reels',
      'ManyChat or n8n + Instagram Graph API (Comment-to-DM automation)',
      'CapCut / Edits app for crisp 9:16 typography & pacing',
      'Gumroad / Payhip / WhatsApp booking link in bio',
    ],
    policyWarnings: [
      'Never use unofficial third-party auto-DM bots or password-sharing scrapers — only use official Meta-approved API tools (ManyChat / official Graph API) to prevent account bans.',
      'Avoid "Follow-for-Follow" or engagement pods; Instagram ranks Watch Time and Sends per Reach (DM shares) above raw likes.',
      'Disclose paid partnerships with the Paid Partnership label to stay compliant.',
    ],
    insightTargets: {
      primaryLabel: '30-Day Reel Reach',
      primaryGoal: 100000,
      primaryUnit: 'reach',
      secondaryLabel: 'Niche Followers',
      secondaryGoal: 5000,
      secondaryUnit: 'followers',
    },
    weeklyMilestones: [
      {
        week: 'Week 01',
        focusTitle: 'Profile Funnel & 3 Pinned Authority Reels',
        targetMetric: 'Bio Optimized + 3 Pinned Reels',
        tasks: [
          'Switch to Professional Account linked to Facebook Page for Graph API',
          'Write 3-line conversion bio + set up 3 Highlights',
          'Publish 3 foundational authority Reels explaining your core topic',
        ],
      },
      {
        week: 'Week 02',
        focusTitle: 'Trial Reels Hook Testing',
        targetMetric: '7 Reels Published + Top Hook Identified',
        tasks: [
          'A/B test 3 hook styles via Trial Reels with non-followers',
          'Track Sends per Reach inside Instagram Insights',
          'Add Comment-to-DM keyword CTA on every tutorial Reel',
        ],
      },
      {
        week: 'Week 03',
        focusTitle: 'ManyChat DM Funnel & Daily Story Selling',
        targetMetric: 'Live Auto-DM Flow + Daily 3-Slide Stories',
        tasks: [
          'Build automated Comment-to-DM flow delivering a free checklist',
          'Run daily 3-slide Story arc (Work -> Proof -> Poll CTA)',
          'Message Poll responders directly to qualify service/product buyers',
        ],
      },
      {
        week: 'Week 04',
        focusTitle: 'Creator Marketplace & Brand Outreach',
        targetMetric: 'Media Kit + 15 Brand Pitches Sent',
        tasks: [
          'Complete Instagram Creator Marketplace portfolio profile',
          'Package 1-page Media Kit with 30-day Reach & Tier-1 demographics',
          'Pitch 15 aligned brands or SaaS tools for sponsored Reel packages',
        ],
      },
    ],
    steps: [
      {
        id: 'ig-1',
        stepNumber: '01',
        title: 'Niche Positioning & High-Converting Profile Funnel',
        duration: 'Day 1 - 2',
        objective: 'Optimize bio, highlights, and pinned posts so profile visitors convert into followers or leads.',
        instructions:
          'Switch to a Creator or Business account. Write a 3-line bio stating: Who you help + What result you deliver + Clear Call to Action ("Comment AI for my free toolkit"). Pin 3 authority Reels at the top.',
        checklist: [
          'Switch to Professional Account and connect to a Facebook Page for API access',
          'Rewrite bio with clear value proposition and single tracked link',
          'Set up 3 Story Highlights: Start Here, Case Studies/Results, Free Resources',
        ],
        deliverable: 'Conversion-Ready Profile & Bio',
        mentorPrompt:
          'Walk me through Step 1 of Instagram: Help me write a high-converting bio and 3 pinned Reel ideas for my niche.',
      },
      {
        id: 'ig-2',
        stepNumber: '02',
        title: 'Sends-Per-Reach Reel Engineering & Trial Reels',
        duration: 'Day 3 - 20',
        objective: 'Trigger non-follower distribution using Instagram’s top ranking signal: DM Shares.',
        instructions:
          'Use Instagram Trial Reels to A/B test hooks with non-followers before pushing winners to your main grid. Craft saveable, shareable 20-45 second Reels ("3 AI tools saving freelancers 10 hrs/week").',
        checklist: [
          'Test 3 hook variations per concept using Trial Reels',
          'Keep Reels tight: 1 clear takeaway, text inside safe zones (avoid bottom 20%)',
          'Include a clear "Save & Send this to a friend" or Comment keyword CTA',
        ],
        deliverable: '14-Day Reels Testing Matrix',
        mentorPrompt:
          'Teach me Step 2: How do Trial Reels and Sends-Per-Reach work to grow Instagram fast?',
      },
      {
        id: 'ig-3',
        stepNumber: '03',
        title: 'Automated Comment-to-DM Sales Funnel',
        duration: 'Day 21 - 28',
        objective: 'Turn every Reel comment into an automated lead capture and offer delivery.',
        instructions:
          'Connect your official Instagram Business account to ManyChat (or an n8n Meta Graph workflow). When a viewer comments a keyword (e.g., "PLAN"), automatically reply to their comment and DM them your resource link or booking calendar.',
        checklist: [
          'Create a free lead magnet (checklist, n8n template, or guide)',
          'Configure Comment Trigger keyword + 3 varied public reply messages',
          'Test the DM sequence end-to-end from a secondary account',
        ],
        deliverable: 'Live Comment-to-DM Automation Flow',
        mentorPrompt:
          'Walk me through Step 3: How do I build a Comment-to-DM automation funnel step by step?',
      },
      {
        id: 'ig-4',
        stepNumber: '04',
        title: 'Story Selling Sequence (3-Slide Daily Formula)',
        duration: 'Day 29 - 40',
        objective: 'Convert warm followers into paying clients through daily Stories.',
        instructions:
          'Reels bring cold reach; Stories close sales. Use a simple daily 3-story arc: (1) Behind-the-scenes work/problem, (2) Client proof or micro-lesson, (3) Poll or DM sticker CTA.',
        checklist: [
          'Post 3-5 linked Stories daily (never dump 15 disconnected clips)',
          'Use interactive Poll/Question stickers on Slide 2 to boost Story reach',
          'Message everyone who votes Yes on your offer poll with a helpful opener',
        ],
        deliverable: 'Daily 3-Slide Story Template',
        mentorPrompt:
          'Show me Step 4: Write a 3-slide Instagram Story sequence that converts viewers into freelance clients.',
      },
      {
        id: 'ig-5',
        stepNumber: '05',
        title: 'Creator Marketplace, Gifts & Brand Sponsorships',
        duration: 'Day 41 - 60',
        objective: 'Activate native Meta monetization and close recurring brand sponsors.',
        instructions:
          'Enable Gifts and Creator Marketplace in Professional Dashboard. Build a clean Media Kit showing 30-day Reach, Audience Demographics, and Past Engagement Rate, then pitch 10 brands weekly.',
        checklist: [
          'Complete Creator Marketplace portfolio inside Instagram Settings',
          'Prepare 3 sponsorship tiers: 1 Reel, 1 Reel + 3 Stories, Monthly Retainer',
          'Add usage-rights fee (+30-50%) if the brand wants to run your Reel as an ad',
        ],
        deliverable: 'Instagram Media Kit & Pricing Rate Card',
        mentorPrompt:
          'Help me with Step 5: How to set my Instagram brand deal rates and join Creator Marketplace.',
      },
      {
        id: 'ig-6',
        stepNumber: '06',
        title: 'Scale With Paid Partnership Ads & Affiliate Hubs',
        duration: 'Day 60+',
        objective: 'Stack recurring SaaS affiliate revenue alongside sponsored campaigns.',
        instructions:
          'Recommend software tools you genuinely demonstrate in tutorials using recurring affiliate programs (20-40% lifetime commission), stacking passive monthly income on top of brand deals.',
        checklist: [
          'Select 3 high-retention tools aligned with your content',
          'Build a clean Link-in-Bio resource hub categorized by goal',
          'Track link clicks and DM conversion rates weekly',
        ],
        deliverable: 'Recurring Affiliate & Offer Ecosystem',
        mentorPrompt:
          'Guide me on Step 6: How to combine affiliate income and brand sponsorships on Instagram.',
      },
    ],
    blueprints: [
      {
        id: 'ig-bp-1',
        title: 'Comment-to-DM Funnel Script',
        format: 'text',
        summary: 'High-converting Reel CTA + automated DM follow-up.',
        content: `REEL CTA (Last 3 seconds): "Comment 'START' below and I'll DM you the exact step-by-step roadmap."

PUBLIC COMMENT REPLY (Rotated):
"Sent to your DMs! Check your requests folder."

AUTOMATED DM MESSAGE 1:
"Hey! Here is the roadmap I promised: [Link]. Quick question — are you starting from scratch or already offering a service?"`,
      },
    ],
    quickPrompts: [
      'Instagram se bina lakhon followers ke paise kaise kamayein? (Roman Urdu)',
      'Walk me through Step 1 for an Instagram AI/Freelancing page',
      'Design a ManyChat Comment-to-DM funnel for my niche',
      'Give me 10 high-shareability Instagram Reel hooks',
    ],
  },
  {
    id: 'tiktok',
    title: 'TikTok Creator Rewards Program & TikTok Shop',
    shortName: 'TikTok',
    category: 'social',
    categoryLabel: 'Social Monetization',
    level: 'Beginner to Pro',
    timeToFirstDollar: '30 - 60 Days',
    earningModel: 'Creator Rewards ($0.40-$1.20+ RPM) + TikTok Shop Affiliate',
    imageUrl: '/src/assets/images/dept_social_monetization_1795091707708.jpg',
    exampleTemplateImage: '/src/assets/images/tpl_facebook_reel_layout_1795095057768.jpg',
    exampleTemplateCaption: 'Example 9:16 65-second Creator Rewards filming rig with crisp desk lighting.',
    officialDocUrl: 'https://support.tiktok.com/en/business-and-creator/creator-rewards-program',
    officialDocLabel: 'TikTok Creator Rewards Program Official Rules',
    summary:
      'Master TikTok’s 1-minute+ Creator Rewards Program and TikTok Shop Affiliate system with original high-retention storytelling, RPM optimization, and strict disqualification prevention.',
    romanUrduIntro:
      'TikTok Creator Rewards Program (10K followers + 100K views) aur TikTok Shop Affiliate se dollar mein kamayi karne, RPM barhane aur Unoriginal Content strikes se bachne ki mukammal training.',
    eligibility: [
      {
        metric: 'Creator Rewards',
        requirement: '10,000 Followers + 100,000 Views',
        notes: 'Must be achieved in the last 30 days; creator must be 18+ in an eligible region.',
      },
      {
        metric: 'Qualified Videos',
        requirement: '1 Minute+ Original Video',
        notes: 'Only views over 5 seconds from For You Feed count toward Qualified Views.',
      },
      {
        metric: 'Eligible Countries',
        requirement: 'US, UK, DE, FR, JP, KR, BR',
        notes: 'Account must be registered genuinely in an eligible region with local tax/payout verification.',
      },
      {
        metric: 'TikTok Shop Affiliate',
        requirement: '1,000 - 5,000 Followers (Region)',
        notes: 'Earn 10% - 30% commission per product sold directly inside TikTok videos & Lives.',
      },
    ],
    revenueStreams: [
      'TikTok Creator Rewards Program (RPM on 1-min+ original videos)',
      'TikTok Shop Affiliate Showcase & Commission Videos',
      'LIVE Gifts, Subscriptions & Brand Sponsored Videos',
      'Driving TikTok traffic to external Shopify stores or YouTube channels',
    ],
    requiredTools: [
      'TikTok Creative Center (Trending Search & Hook Analytics)',
      'CapCut Desktop / Mobile (Auto-captions, keyframe pacing)',
      'TikTok Seller / Affiliate Center (for Shop regions)',
      'Clean 1080x1920 vertical filming or custom motion graphic assets',
    ],
    policyWarnings: [
      'TikTok aggressively flags "Unoriginal, Low-Quality, or QR/Watermark" content — 5 strikes in 30 days removes you from Creator Rewards.',
      'Never use cheap VPNs or fake SIM tricks to spoof US accounts — TikTok requires valid US/UK tax ID (SSN/ITIN/UTR) during payout verification and freezes mismatched accounts.',
      'Only 1-minute+ videos qualify for Creator Rewards payouts; sub-60s clips earn $0 in the rewards pool.',
    ],
    insightTargets: {
      primaryLabel: '30-Day Views',
      primaryGoal: 100000,
      primaryUnit: 'views',
      secondaryLabel: 'TikTok Followers',
      secondaryGoal: 10000,
      secondaryUnit: 'followers',
    },
    weeklyMilestones: [
      {
        week: 'Week 01',
        focusTitle: 'Account Warmup, Search SEO & Hook Testing',
        targetMetric: '7 Original Videos + Search Keywords Mapped',
        tasks: [
          'Verify region/payout path (Creator Rewards vs Worldwide UGC/Shop)',
          'Publish 7 videos mixing 20s curiosity clips & 65s deep dives',
          'Include exact TikTok Search phrases in spoken hook & captions',
        ],
      },
      {
        week: 'Week 02',
        focusTitle: '3-Second Hold Rate & Completion Optimization',
        targetMetric: '30,000+ Views + 2,500+ Followers',
        tasks: [
          'Audit TikTok Studio retention curve at 3-second and 5-second marks',
          'Add visual angle/graphic changes every 4 seconds on 65s videos',
          'Reply to viewer questions with Video Replies',
        ],
      },
      {
        week: 'Week 03',
        focusTitle: 'Viral Series Scaling & Originality Protection',
        targetMetric: '65,000+ Views + 6,000+ Followers',
        tasks: [
          'Turn top-performing video format into a numbered Part 1, 2, 3 series',
          'Ensure zero watermarks or unedited third-party podcast clips',
          'Pin top 3 highest-converting videos to profile grid',
        ],
      },
      {
        week: 'Week 04',
        focusTitle: '100K Gate, Creator Rewards / UGC Brand Pitching',
        targetMetric: '100K Views + 10K Followers or 3 UGC Pitches',
        tasks: [
          'Apply inside TikTok Studio > Creator Rewards (if eligible region)',
          'Or assemble 3 spec UGC TikTok ad clips and pitch 15 D2C brands',
          'Track Qualified View RPM and search traffic share',
        ],
      },
    ],
    steps: [
      {
        id: 'tt-1',
        stepNumber: '01',
        title: 'Account Warmup, Niche & Region Compliance',
        duration: 'Day 1 - 3',
        objective: 'Verify genuine regional eligibility and train the For You algorithm on your niche.',
        instructions:
          'Confirm whether your focus is Creator Rewards (requires eligible region + valid tax/payout verification) or Global Brand/Affiliate Monetization (works worldwide via external links, UGC, and Live). Spend 48 hours engaging only with top creators in your exact target niche.',
        checklist: [
          'Verify region eligibility & tax compliance path before scaling',
          'Set clean username, high-contrast avatar, and 2-line value bio',
          'Engage natively with 10-15 top creators in your niche (no spam)',
        ],
        deliverable: 'Verified Niche Positioning & Compliance Plan',
        mentorPrompt:
          'Walk me through Step 1 of TikTok Monetization: Explain Creator Rewards eligibility vs worldwide monetization options.',
      },
      {
        id: 'tt-2',
        stepNumber: '02',
        title: 'The 3-Second Visual Hook & Watch-Time Loop',
        duration: 'Day 4 - 14',
        objective: 'Win TikTok’s 3-second hold rate and full-watch completion metrics.',
        instructions:
          'TikTok tests every video on ~200-300 viewers first. If 70%+ stay past 3 seconds and completion rate exceeds 25% on a 65-second video, it scales to 10K-500K+ views.',
        checklist: [
          'Start with movement, visual contrast, or a provocative statement in frame 1',
          'Use dynamic burned-in captions positioned cleanly in the upper-middle frame',
          'Ensure videos meant for Creator Rewards run 62 - 90 seconds smoothly',
        ],
        deliverable: '10 Tested 65-Second Video Scripts',
        mentorPrompt:
          'Teach me Step 2: How to structure a 65-second TikTok video to maximize Completion Rate and Qualified Views.',
      },
      {
        id: 'tt-3',
        stepNumber: '03',
        title: 'Reaching 10K Followers & 100K Views (30-Day Sprint)',
        duration: 'Day 15 - 35',
        objective: 'Cross the Creator Rewards admission gate cleanly.',
        instructions:
          'Mix fast 15-30 second curiosity clips (for follower acquisition) with 65-second deep dives (for watch time & Search SEO). Use TikTok Search Insights to answer questions people actively type into TikTok.',
        checklist: [
          'Post 1-2 high-effort original videos daily at peak audience hours',
          'Include exact search keywords in voiceover, on-screen text, and caption',
          'Reply to top questions with Video Replies to spark viral series',
        ],
        deliverable: '30-Day Viral Series Execution Tracker',
        mentorPrompt:
          'Walk me through Step 3: Give me a 30-day posting strategy to hit 10K followers and 100K views.',
      },
      {
        id: 'tt-4',
        stepNumber: '04',
        title: 'Optimizing RPM & Avoiding Security/Unoriginal Strikes',
        duration: 'Day 36 - 45',
        objective: 'Push RPM above $0.80 while keeping Originality Score intact.',
        instructions:
          'RPM depends heavily on viewer geography (US/UK/DE pay highest), topic (finance/tech/business pay 3x more than memes), and Search traffic share. Never stitch/duet lazily — film or animate 100% original visuals.',
        checklist: [
          'Track RPM per video in TikTok Studio > Creator Rewards analytics',
          'Keep 100% unique visual editing (no raw movie/podcast reposts)',
          'Target Tier-1 English or high-value localized search topics',
        ],
        deliverable: 'RPM Optimization & Strike-Free Audit',
        mentorPrompt:
          'Explain Step 4: Why does TikTok RPM drop and how do I keep it high and strike-free?',
      },
      {
        id: 'tt-5',
        stepNumber: '05',
        title: 'TikTok Shop Affiliate & Product Demo Funnels',
        duration: 'Day 46 - 60',
        objective: 'Earn 15-30% product commissions directly from problem-solution videos.',
        instructions:
          'Find winning high-commission products inside TikTok Shop Marketplace with 4.5+ star reviews. Film authentic 30-second problem-agitate-demo clips showing the product solving a daily frustration.',
        checklist: [
          'Pick 3 trending products with >15% commission and fast shipping',
          'Film genuine hands-on demonstration (problem in first 3 seconds)',
          'Pin best-converting Shop videos and go Live weekly for Q&A',
        ],
        deliverable: '3 High-Converting Product Demo Scripts',
        mentorPrompt:
          'Guide me on Step 5: How does TikTok Shop Affiliate work and how do I pick winning products?',
      },
      {
        id: 'tt-6',
        stepNumber: '06',
        title: 'UGC Freelancing for TikTok Brands (Global Income)',
        duration: 'Day 60+',
        objective: 'Earn $150 - $500 per video creating TikTok-style UGC ads for D2C brands anywhere in the world.',
        instructions:
          'Even if your country does not support Creator Rewards, global e-commerce brands pay freelance UGC creators $150-$400 per 30-second TikTok ad video to run on their own Ad Manager accounts.',
        checklist: [
          'Film 3 spec UGC ad videos for products already on your desk',
          'Upload a clean portfolio page with 3 hook variations per product',
          'Pitch 15 Shopify / TikTok Shop brands daily on email and LinkedIn',
        ],
        deliverable: '3-Video UGC Ad Portfolio & Brand Outreach Pitch',
        mentorPrompt:
          'Teach me Step 6: How can I earn in USD making TikTok UGC videos for international brands from anywhere?',
      },
    ],
    blueprints: [
      {
        id: 'tt-bp-1',
        title: '65-Second Creator Rewards Script Formula',
        format: 'text',
        summary: 'Built to pass the 5-second Qualified View gate and maximize RPM.',
        content: `[0:00-0:03] VISUAL INTERRUPT: Unexpected prop or bold on-screen claim.
[0:03-0:12] THE MYSTERY: "Here is what actually happens when..." (Hold past 5s qualified mark).
[0:12-0:48] ESCALATION: 3 rapid mini-reveals, changing camera angle or graphic every 4 seconds.
[0:48-1:05] CLIMAX & QUESTION: Final reveal at 0:58 + open debate prompt in last 5s to drive comments.`,
      },
    ],
    quickPrompts: [
      'TikTok Creator Rewards aur TikTok Shop ke rules Roman Urdu mein batao',
      'If Creator Rewards is not in my country, how do I monetize TikTok?',
      'Walk me through Step 2 to make a viral 65-second script',
      'How do I avoid TikTok Unoriginal Content disqualification?',
    ],
  },
  {
    id: 'n8n',
    title: 'n8n Workflow & AI Agent Automation Engineering',
    shortName: 'n8n Automation',
    category: 'automation',
    categoryLabel: 'Automation & AI',
    level: 'Beginner to Advanced',
    timeToFirstDollar: '14 - 45 Days',
    earningModel: '$500 - $3,000+ Setup Fees + $300+/mo Retainers',
    imageUrl: '/src/assets/images/tpl_n8n_workflow_map_1795095058035.jpg',
    exampleTemplateImage: '/src/assets/images/tpl_n8n_workflow_map_1795095058035.jpg',
    exampleTemplateCaption: 'Example n8n automation architecture linking Webhooks, AI Agents, and CRM endpoints.',
    officialDocUrl: 'https://docs.n8n.io/',
    officialDocLabel: 'n8n Official Documentation & Workflow Guides',
    summary:
      'Build production-grade n8n automations connecting Webhooks, Gemini AI Agents, WhatsApp/Telegram bots, Google Sheets, and CRMs — and sell automated business systems to global clients.',
    romanUrduIntro:
      'n8n aur AI Agents seekh kar WhatsApp bots, Lead Generation, Email Automation aur CRM workflows banayein — aur international clients ko $500 se $3,000+ per project charge karein.',
    eligibility: [
      {
        metric: 'Deployment Skill',
        requirement: 'n8n Cloud or Self-Hosted VPS',
        notes: 'Self-host on Hetzner/DigitalOcean ($5/mo Docker/Coolify) for unlimited executions.',
      },
      {
        metric: 'Core Protocol',
        requirement: 'Webhooks + REST APIs + JSON',
        notes: 'Understanding HTTP Request node, OAuth2, and JSON data mapping.',
      },
      {
        metric: 'Project Pricing',
        requirement: '$400 - $3,500 per Workflow',
        notes: 'Plus $200 - $800/mo maintenance, API monitoring, and optimization retainer.',
      },
      {
        metric: 'High-Demand Use Cases',
        requirement: 'Lead Ops, AI Support, Content',
        notes: 'Real estate lead qualification, Shopify order bots, invoice OCR, social scheduling.',
      },
    ],
    revenueStreams: [
      'Custom n8n Automation Builds for Agencies, Clinics, & E-Commerce Brands',
      'Monthly Automation Maintenance & Server Hosting Retainers',
      'Selling Pre-Built n8n JSON Workflow Packs on Gumroad / LemonSqueezy',
      'High-Ticket Upwork & LinkedIn AI Automation Consulting',
    ],
    requiredTools: [
      'n8n (Cloud Starter or Self-Hosted via Docker / Coolify)',
      'Google Gemini API / OpenAI API for AI Agent & Structured JSON nodes',
      'PostgreSQL / Airtable / Google Sheets for workflow state & CRM logging',
      'Postman / cURL for testing Webhooks and HTTP API responses',
    ],
    policyWarnings: [
      'Never hardcode client API keys inside Shareable JSON exports — always use n8n Credentials Vault.',
      'Always build an Error Trigger Workflow connected to Slack/Telegram/Email so silent failures never break a client’s business.',
      'Respect WhatsApp Business API & Cold Email rate limits; use Wait/SplitInBatches nodes to avoid account throttling.',
    ],
    insightTargets: {
      primaryLabel: 'Client Demos / Proposals',
      primaryGoal: 30,
      primaryUnit: 'pitches',
      secondaryLabel: 'Workflow Builds Shipped',
      secondaryGoal: 3,
      secondaryUnit: 'builds',
    },
    weeklyMilestones: [
      {
        week: 'Week 01',
        focusTitle: 'n8n Setup, Webhooks & JSON Expressions',
        targetMetric: 'Running HTTPS n8n + 1st API Flow',
        tasks: [
          'Launch n8n Cloud or Docker VPS over HTTPS',
          'Master {{ $json }} expressions, IF/Switch routers, and HTTP Request node',
          'Test incoming Webhook payloads via cURL or Postman',
        ],
      },
      {
        week: 'Week 02',
        focusTitle: 'Build Flagship AI Lead Qualifier & CRM Bot',
        targetMetric: '1 Production Workflow + 90s Loom Demo',
        tasks: [
          'Connect Webhook -> Gemini AI JSON classifier -> Google Sheets/HubSpot',
          'Add instant Telegram/WhatsApp/Email alert notification',
          'Record a crisp 90-second Loom video demonstrating live execution',
        ],
      },
      {
        week: 'Week 03',
        focusTitle: 'AI Agent Memory, Calendar Booking & Error Trigger',
        targetMetric: '2nd Flagship Build + Error Handler',
        tasks: [
          'Wire n8n AI Agent with memory buffer + Google Calendar availability tool',
          'Configure global Error Trigger sending failure alerts',
          'Package setup fee ($750+) + care retainer ($250/mo) offer sheet',
        ],
      },
      {
        week: 'Week 04',
        focusTitle: 'Daily Client Acquisition on Upwork & LinkedIn',
        targetMetric: '25 Tailored Proposals + 1st Discovery Call',
        tasks: [
          'Apply to 5 fresh Zapier/Make-to-n8n or AI bot jobs daily with Loom demo',
          'Run 15-minute workflow audits uncovering manual bottlenecks',
          'Deliver clean documentation and lock in monthly maintenance retainer',
        ],
      },
    ],
    steps: [
      {
        id: 'n8n-1',
        stepNumber: '01',
        title: 'Setup n8n Environment (Cloud vs $5 VPS Docker)',
        duration: 'Day 1 - 2',
        objective: 'Launch your own reliable n8n workspace ready for client demos and production.',
        instructions:
          'Start immediately with n8n Cloud free trial OR deploy self-hosted n8n on a $5/month VPS using Docker Compose with HTTPS (Traefik/Caddy or Coolify). Self-hosting removes execution caps so you can run high-volume loops profitably.',
        checklist: [
          'Spin up n8n workspace and verify Webhook URL resolves over HTTPS',
          'Understand Triggers (Webhook, Schedule, App Event) vs Action nodes',
          'Configure timezone and execution log retention settings',
        ],
        deliverable: 'Running HTTPS n8n Instance',
        mentorPrompt:
          'Walk me through Step 1 of n8n: Compare n8n Cloud vs Docker self-hosting and help me launch my first instance.',
      },
      {
        id: 'n8n-2',
        stepNumber: '02',
        title: 'Mastering JSON, Expressions, Loops & HTTP Requests',
        duration: 'Day 3 - 7',
        objective: 'Move beyond basic templates by manipulating real API JSON payloads.',
        instructions:
          'Every automation runs on arrays of JSON items (`{{ $json.field }}`). Practice using the Edit Fields (Set), IF/Switch Router, Split Out, Aggregate, and HTTP Request nodes to connect ANY software that has a REST API.',
        checklist: [
          'Build a test Webhook accepting a JSON lead payload and returning 200 OK',
          'Use an IF node to route high-budget leads differently from low-budget leads',
          'Make a custom HTTP Request call using Bearer Token authentication',
        ],
        deliverable: 'Working Webhook -> Router -> HTTP API Test Flow',
        mentorPrompt:
          'Teach me Step 2 of n8n: Explain JSON items, expressions like {{ $json }}, and HTTP Request nodes simply.',
      },
      {
        id: 'n8n-3',
        stepNumber: '03',
        title: 'Build Flagship Project #1: AI Lead Qualifier & CRM Bot',
        duration: 'Day 8 - 14',
        objective: 'Create a portfolio-grade automation every local & global business immediately understands.',
        instructions:
          'Connect a Website Form / Webhook -> Gemini AI Classifier (extracts budget, urgency, summary in structured JSON) -> Google Sheets/HubSpot CRM -> Instant Personalized Email/WhatsApp reply + Slack/Telegram alert to sales team.',
        checklist: [
          'Wire Webhook trigger to Gemini AI node with Structured Output Parser',
          'Append clean row to Google Sheets or Airtable',
          'Send instant formatted notification to Telegram or Slack',
        ],
        deliverable: 'Production AI Lead Qualification Workflow (JSON)',
        mentorPrompt:
          'Walk me through Step 3: Build an AI Lead Qualifier workflow in n8n node by node.',
      },
      {
        id: 'n8n-4',
        stepNumber: '04',
        title: 'Build Flagship Project #2: AI RAG Chatbot & Error Handling',
        duration: 'Day 15 - 21',
        objective: 'Add AI Agent memory, knowledge base retrieval, and bulletproof error alerts.',
        instructions:
          'Use n8n’s AI Agent node with Window Buffer Memory + Vector/Sheet Knowledge tool so a WhatsApp or Website chat widget answers FAQs accurately and books calendar slots. Add a global Error Trigger workflow.',
        checklist: [
          'Attach Postgres/Memory buffer so the AI remembers conversation turns',
          'Connect Google Calendar check-availability tool to the Agent',
          'Set up global Error Trigger workflow sending instant failure alerts',
        ],
        deliverable: 'AI Customer Support & Booking Agent + Error Monitor',
        mentorPrompt:
          'Teach me Step 4: How do I build an n8n AI Agent with memory, tools, and Error Trigger protection?',
      },
      {
        id: 'n8n-5',
        stepNumber: '05',
        title: 'Loom Demo Portfolio & ROI Offer Packaging',
        duration: 'Day 22 - 28',
        objective: 'Package automations around hours/money saved instead of selling "nodes".',
        instructions:
          'Clients don’t buy n8n; they buy "Saving 15 hours/week on manual lead follow-up". Record three 90-second Loom screen demos showing the trigger happening live and the CRM/WhatsApp updating automatically.',
        checklist: [
          'Record 3 crisp 90-second Loom demos of your real workflows',
          'Write a 1-page Offer Sheet: Setup Fee ($600-$1,500) + Care Retainer ($250/mo)',
          'Prepare a clean client handoff SOP document',
        ],
        deliverable: '3 Live Demo Videos + Automation Offer Sheet',
        mentorPrompt:
          'Help me with Step 5: How should I price n8n projects and record Loom demos that close clients?',
      },
      {
        id: 'n8n-6',
        stepNumber: '06',
        title: 'Closing High-Ticket Automation Clients on Upwork & LinkedIn',
        duration: 'Day 29 - 45',
        objective: 'Land your first $500-$2,000 automation client and scale retainers.',
        instructions:
          'Target Upwork jobs asking for "Zapier replacement", "Make.com to n8n migration", "AI WhatsApp chatbot", or "CRM automation". Lead every proposal with a custom 3-node architecture diagram and link to your 90s demo.',
        checklist: [
          'Send 5 tailored Upwork proposals daily referencing exact client bottlenecks',
          'Offer a 15-minute Free Workflow Audit call to map their manual tasks',
          'Convert completed builds into monthly monitoring & expansion retainers',
        ],
        deliverable: 'First Signed Automation Retainer Client',
        mentorPrompt:
          'Show me Step 6: Write a winning Upwork proposal and discovery call script for an n8n automation job.',
      },
    ],
    blueprints: [
      {
        id: 'n8n-bp-1',
        title: 'AI Lead Qualifier Blueprint (Importable n8n JSON)',
        format: 'json',
        summary: 'Webhook -> Gemini Classification -> Google Sheets -> Telegram Alert.',
        content: `{
  "name": "#PGL.03 - AI Lead Qualifier",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "lead-intake",
        "responseMode": "onReceived"
      },
      "name": "Webhook Trigger",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [240, 300]
    },
    {
      "parameters": {
        "jsCode": "const body = $input.first().json.body || $input.first().json;\\nreturn [{ json: { name: body.name || 'Unknown', email: body.email || '', message: body.message || '', receivedAt: new Date().toISOString() } }];"
      },
      "name": "Normalize Lead",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [460, 300]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={{ { contents: [{ parts: [{ text: 'Classify this lead urgency (HIGH/MED/LOW) and summarize in 1 sentence: ' + $json.message }] }] } }}"
      },
      "name": "AI Lead Classifier",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [700, 300]
    }
  ],
  "connections": {
    "Webhook Trigger": { "main": [[{ "node": "Normalize Lead", "type": "main", "index": 0 }]] },
    "Normalize Lead": { "main": [[{ "node": "AI Lead Classifier", "type": "main", "index": 0 }]] }
  }
}`,
      },
      {
        id: 'n8n-bp-2',
        title: 'Client Discovery Audit Questions',
        format: 'text',
        summary: 'Use these 5 questions on client calls to uncover $1,500+ automation scopes.',
        content: `1. "Which repetitive copy-paste task does your team do every single day right now?"
2. "Where do new leads come from, and how many minutes does it take before they get a reply?"
3. "What tools already hold your data (Sheets, HubSpot, Shopify, WhatsApp, Gmail)?"
4. "If we saved your team 15 hours every week, what is that time worth to your business?"
5. "Who needs to get notified instantly if an automation ever encounters bad data?"`,
      },
    ],
    quickPrompts: [
      'n8n kya hai aur is se freelancing mein paise kaise kamate hain? (Roman Urdu)',
      'Walk me through Step 3: Build an AI Lead Qualifier in n8n',
      'Write a custom n8n JSON workflow for WhatsApp order confirmation',
      'How do I pitch a $1,000 n8n automation to a real estate or e-commerce business?',
    ],
  },
  {
    id: 'freelancing',
    title: 'Fiverr, Upwork & Direct High-Ticket Freelancing',
    shortName: 'Fiverr & Upwork',
    category: 'freelancing',
    categoryLabel: 'Freelancing & Agencies',
    level: 'All Levels',
    timeToFirstDollar: '14 - 45 Days',
    earningModel: 'Fixed Projects ($150 - $2,500) + Hourly/Monthly Retainers',
    imageUrl: '/src/assets/images/tpl_freelance_portfolio_shot_1795095058317.jpg',
    exampleTemplateImage: '/src/assets/images/tpl_freelance_portfolio_shot_1795095058317.jpg',
    exampleTemplateCaption: 'Example high-trust client proposal & case study presentation layout.',
    officialDocUrl: 'https://support.upwork.com/hc/en-us',
    officialDocLabel: 'Upwork Help & Verified Freelancer Guidelines',
    summary:
      'Complete client acquisition engine: niche positioning, SEO-ranked Fiverr gigs, high-reply Upwork proposal architecture, portfolio proof without prior clients, and clean global USD withdrawals.',
    romanUrduIntro:
      'Fiverr aur Upwork par zero reviews se pehla order lene, winning proposals likhne, saste gigs ki bajaye high-ticket clients close karne aur Payoneer/Wise se payment mangwane ka complete package.',
    eligibility: [
      {
        metric: 'Fiverr Profile',
        requirement: 'ID Verification + Niche Gigs',
        notes: 'Focus 1 clear specialty per profile rather than 7 unrelated generic gigs.',
      },
      {
        metric: 'Upwork Profile',
        requirement: '100% Complete + Specialized Profiles',
        notes: 'Include 3 concrete portfolio case studies and a 60-second Loom intro video.',
      },
      {
        metric: 'Proposal Benchmark',
        requirement: '15% - 25% Interview Rate',
        notes: 'First 2 lines must mirror the client’s exact problem, never "Dear Sir/Madam".',
      },
      {
        metric: 'Payout Channels',
        requirement: 'Payoneer / Wise / Local USD',
        notes: 'Keep matching legal CNIC/Passport names across platform and bank accounts.',
      },
    ],
    revenueStreams: [
      'Fiverr Pro / Standard 3-Tier Gig Packages (Starter, Growth, Scale)',
      'Upwork Hourly Contracts ($20 - $85/hr) & Milestone Projects',
      'Direct LinkedIn & Cold Email Retainer Clients (0% marketplace fee)',
      'Subcontracting overflow work as a boutique 2-3 person micro-agency',
    ],
    requiredTools: [
      'Upwork & Fiverr Seller Dashboard',
      'Loom / OBS for 60-second custom video proposals',
      'Notion / Framer / Behance for clean case-study portfolios',
      'Payoneer / Wise / Elevate Pay for low-fee USD payouts',
    ],
    policyWarnings: [
      'NEVER ask Fiverr or Upwork clients to pay outside the platform before contract initiation — both platforms permanently suspend accounts for fee circumvention.',
      'Never buy fake reviews on Fiverr; algorithmic fraud detection flags buyer/seller IP clusters and bans both accounts.',
      'Avoid copy-pasting the same AI-generated Upwork cover letter; clients instantly archive generic "I hope this message finds you well" pitches.',
    ],
    insightTargets: {
      primaryLabel: 'Tailored Proposals Sent',
      primaryGoal: 50,
      primaryUnit: 'proposals',
      secondaryLabel: 'Client Interviews',
      secondaryGoal: 8,
      secondaryUnit: 'calls',
    },
    weeklyMilestones: [
      {
        week: 'Week 01',
        focusTitle: 'Specialist Positioning & 3 Spec Case Studies',
        targetMetric: 'Profile 100% + 3 Portfolio Proof Pieces',
        tasks: [
          'Write 1-sentence specialist positioning headline',
          'Create 3 real Before -> After spec projects with 60s Loom walkthroughs',
          'Configure verified Payoneer/Wise payout credentials',
        ],
      },
      {
        week: 'Week 02',
        focusTitle: 'Fiverr SEO Gigs & First Upwork Sprint',
        targetMetric: '2 SEO Gigs Live + 15 Custom Proposals',
        tasks: [
          'Publish Fiverr Gig targeting long-tail buyer search terms + clean thumbnail',
          'Send 3 tailored Upwork proposals daily to fresh Payment-Verified jobs',
          'Attach 45-second Loom screen audit on $500+ job posts',
        ],
      },
      {
        week: 'Week 03',
        focusTitle: 'Proposal Conversion Audit & Discovery Calls',
        targetMetric: '30 Total Proposals + 3+ Client Replies',
        tasks: [
          'Inspect Upwork Proposal View Rate (improve opening 2 lines if < 25%)',
          'Run discovery calls using 5-question scope checklist',
          'Lock projects into clearly funded milestones',
        ],
      },
      {
        week: 'Week 04',
        focusTitle: '5-Star Delivery & Monthly Retainer Conversion',
        targetMetric: 'First Paid Contract + Retainer Pitch',
        tasks: [
          'Deliver ahead of deadline with a clear Loom handoff walkthrough',
          'Propose logical Phase 2 or monthly maintenance retainer',
          'Add real client testimonial to portfolio & LinkedIn',
        ],
      },
    ],
    steps: [
      {
        id: 'fr-1',
        stepNumber: '01',
        title: 'Skill-to-Money Niche Positioning (Zero Generic Profiles)',
        duration: 'Day 1 - 3',
        objective: 'Position yourself as a specialist solving one expensive business problem.',
        instructions:
          'Generalists ("I do graphic design, data entry, and video editing") earn $5. Specialists ("I build n8n AI lead bots for real estate agencies" or "I edit high-retention YouTube videos for finance channels") earn $500-$2,000+.',
        checklist: [
          'Define your 1-sentence positioning: I help [Target Client] achieve [Result] via [Skill]',
          'Remove unrelated hobbies/skills from your profile headline',
          'Audit top 5 earners in your exact niche on Upwork and note their rates',
        ],
        deliverable: 'Specialist Profile Headline & Bio',
        mentorPrompt:
          'Walk me through Step 1 of Freelancing: Help me turn my skill into a high-paying specialist positioning statement.',
      },
      {
        id: 'fr-2',
        stepNumber: '02',
        title: 'Build 3 Spec Case Studies Without Prior Clients',
        duration: 'Day 4 - 8',
        objective: 'Eliminate the "no portfolio" excuse by creating undeniable proof pieces.',
        instructions:
          'Pick 3 real companies or creators you admire and build an actual deliverable for them (a redesigned landing section, a 60s retention edit, or a working n8n workflow demo). Document the Before -> After in Notion or Loom.',
        checklist: [
          'Create 3 real-world spec projects matching paid client briefs',
          'Record a 60-second screen walkthrough explaining your thinking on each',
          'Upload clean thumbnails and results into Upwork Portfolio & Fiverr Gallery',
        ],
        deliverable: '3 Proof-of-Work Case Studies + Loom Walkthroughs',
        mentorPrompt:
          'Teach me Step 2: What 3 spec portfolio projects should I create this week if I have zero clients yet?',
      },
      {
        id: 'fr-3',
        stepNumber: '03',
        title: 'Fiverr SEO Gig Architecture & High-CTR Thumbnail',
        duration: 'Day 9 - 12',
        objective: 'Rank on Page 1 for buyer-intent long-tail keywords.',
        instructions:
          'Target low-competition buyer keywords ("n8n ai agent automation", "faceless youtube retention editing") in your Gig Title, URL slug, 5 search tags, and FAQ. Use clean high-contrast typography on your Gig thumbnail (max 5 words).',
        checklist: [
          'Research 5 long-tail keywords with active orders in Fiverr search bar',
          'Structure 3 distinct packages: Audit/Starter -> Core Build -> Full System',
          'Add a 45-second Gig Video (boosts conversion noticeably)',
        ],
        deliverable: 'Published SEO-Optimized Fiverr Gig',
        mentorPrompt:
          'Walk me through Step 3: Write an SEO-optimized Fiverr Gig title, 3 pricing packages, and description for my skill.',
      },
      {
        id: 'fr-4',
        stepNumber: '04',
        title: 'The 4-Part Upwork Proposal & Loom Method',
        duration: 'Day 13 - 25',
        objective: 'Stand out in the first 2 lines that appear in the client’s inbox preview.',
        instructions:
          'Only apply to fresh jobs (< 2 hours old, Payment Verified, < 15 proposals). Structure: (1) Mirror their exact problem in line 1, (2) 1-sentence relevant proof, (3) 3-step execution plan, (4) Low-friction question or 60s Loom link.',
        checklist: [
          'Set custom Upwork RSS/Search alerts for your target keywords',
          'Write personalized proposals referencing details from the client brief',
          'Attach a 45-second Loom audit on high-value ($500+) job posts',
        ],
        deliverable: '15 High-Intent Proposals Sent + Tracker',
        mentorPrompt:
          'Help me with Step 4: Teach me the 4-part Upwork proposal formula and critique my draft.',
      },
      {
        id: 'fr-5',
        stepNumber: '05',
        title: 'Discovery Call & Scope Protection SOP',
        duration: 'Day 26 - 35',
        objective: 'Run confident client calls and prevent scope creep.',
        instructions:
          'On the call, speak 30% and listen 70%. Ask about goals, timeline, and current bottlenecks. Summarize the exact deliverables, revision limits (e.g., 2 rounds), and milestones in writing BEFORE starting work.',
        checklist: [
          'Use a 5-question discovery checklist on every client call',
          'Break projects over $300 into clear funded milestones',
          'Define explicit revision limits and delivery format upfront',
        ],
        deliverable: 'Client Scope & Milestone Agreement Template',
        mentorPrompt:
          'Teach me Step 5: How do I handle a client discovery call in English confidently and lock in milestones?',
      },
      {
        id: 'fr-6',
        stepNumber: '06',
        title: '5-Star Delivery, Upsells & Monthly Retainers',
        duration: 'Day 36+',
        objective: 'Turn one-time $250 buyers into $800/mo recurring retainers.',
        instructions:
          'Deliver 24 hours early with a clear Loom walkthrough explaining every detail. Once the client is thrilled, propose a logical Phase 2 or monthly optimization retainer.',
        checklist: [
          'Include a Loom handoff video with every final delivery',
          'Pitch a natural monthly support/growth package 3 days after completion',
          'Request honest feedback & testimonial for your public profile',
        ],
        deliverable: 'Retainer Transition Script & Delivery SOP',
        mentorPrompt:
          'Guide me on Step 6: How do I turn a one-time client into a monthly retainer client?',
      },
    ],
    blueprints: [
      {
        id: 'fr-bp-1',
        title: 'High-Reply Upwork Proposal Framework',
        format: 'text',
        summary: 'Proven 120-word structure optimized for the 2-line preview window.',
        content: `Hi [Client Name if found in reviews],

Saw you need [exact outcome from job post] without [main pain point they mentioned] — I just built a very similar setup for a [similar industry] client that cut manual work by 12 hrs/week.

Here is how I would handle this in 3 steps:
1. Audit your current [tool/channel] and map the exact bottleneck (Day 1).
2. Build & test [core deliverable] in a staging environment (Day 2-4).
3. Record a full walkthrough video + hand over clean documentation (Day 5).

Quick question before we jump on a call: are you currently using [Tool A] or [Tool B] for this?

Best,
[Your Name]`,
      },
    ],
    quickPrompts: [
      'Fiverr aur Upwork par zero se pehla client kaise lein? (Roman Urdu)',
      'Write a complete Fiverr Gig for my chosen skill',
      'Help me write a winning Upwork proposal for a client job post',
      'How do I build a portfolio without any previous clients?',
    ],
  },
  {
    id: 'video-ugc',
    title: 'Retention Video Editing, Shorts & UGC Studio',
    shortName: 'Video & UGC',
    category: 'freelancing',
    categoryLabel: 'Freelancing & Agencies',
    level: 'Beginner to Pro',
    timeToFirstDollar: '14 - 30 Days',
    earningModel: '$30 - $150/Short · $150 - $600/Long Video · $1,500+/mo Retainer',
    imageUrl: '/src/assets/images/dept_social_monetization_1795091707708.jpg',
    exampleTemplateImage: '/src/assets/images/tpl_facebook_reel_layout_1795095057768.jpg',
    exampleTemplateCaption: 'Example crisp desk UGC & vertical Short production lighting layout.',
    officialDocUrl: 'https://www.blackmagicdesign.com/products/davinciresolve/training',
    officialDocLabel: 'DaVinci Resolve Official Editing Training',
    summary:
      'Learn modern retention editing (Premiere/CapCut/DaVinci), sound design, motion typography, and UGC ad creation — the fastest-selling creative skill for YouTubers, podcasters, and D2C brands.',
    romanUrduIntro:
      'Retention Video Editing, YouTube Shorts, Reels aur UGC Ads banana seekhein — yeh freelancing ki sab se tez bikne wali skill hai jismein clients monthly retainers dete hain.',
    eligibility: [
      {
        metric: 'Short-Form Editing',
        requirement: '$25 - $100 per Reel/Short',
        notes: 'Monthly packages of 20-30 Shorts sell for $600 - $2,000/mo per client.',
      },
      {
        metric: 'Long-Form YouTube',
        requirement: '$100 - $500+ per Video',
        notes: 'Documentary, SaaS, and talking-head retention editing.',
      },
      {
        metric: 'UGC Brand Ads',
        requirement: '$150 - $400 per Ad Video',
        notes: '30-45s product scripts filmed on smartphone for Meta/TikTok ads.',
      },
      {
        metric: 'Hardware Requirement',
        requirement: 'PC/Mac or High-End Mobile',
        notes: 'CapCut Desktop, Premiere Pro, or DaVinci Resolve (Free).',
      },
    ],
    revenueStreams: [
      'Monthly Short-Form Content Repurposing Retainers for Podcasters & Founders',
      'Dedicated YouTube Channel Editor Contracts (4-8 videos/month)',
      'UGC Product Ad Creation Packages (3 Hooks + 1 Body + 1 CTA)',
      'Selling Custom Sound Packs, LUTs, and Premiere/CapCut Motion Presets',
    ],
    requiredTools: [
      'CapCut Desktop / Adobe Premiere Pro / DaVinci Resolve',
      'Sound Effects Library (Whooshes, Risers, Subtle UI Clicks)',
      'Frame.io or Google Drive for timestamped client review',
      'Notion / Trello for raw footage to final cut tracking',
    ],
    policyWarnings: [
      'Never deliver client edits with unlicensed music that triggers Content ID claims on their monetized YouTube channel.',
      'Avoid over-editing with chaotic flashing transitions every half-second; match pacing to the speaker’s tone and narrative clarity.',
      'Always keep organized project backups for 30 days in case a client requests aspect-ratio repurposing.',
    ],
    insightTargets: {
      primaryLabel: 'Sample Pitches Sent',
      primaryGoal: 30,
      primaryUnit: 'pitches',
      secondaryLabel: 'Edited Portfolio Pieces',
      secondaryGoal: 5,
      secondaryUnit: 'edits',
    },
    weeklyMilestones: [
      {
        week: 'Week 01',
        focusTitle: 'Retention Pacing & -14 LUFS Audio Mastering',
        targetMetric: '2 Clean 45s Sample Edits',
        tasks: [
          'Master J-cuts, L-cuts, and clean dead-air removal',
          'Build balanced SFX & music bed preset (-26dB music, -14 LUFS voice)',
          'Keep burned-in captions inside mobile safe zones',
        ],
      },
      {
        week: 'Week 02',
        focusTitle: '3-Style Portfolio Showcase',
        targetMetric: '3 Niche Portfolio Edits Live',
        tasks: [
          'Edit 1 Podcast Short, 1 Documentary Explainer, and 1 UGC Product Ad',
          'Organize showcase page in Notion or clean Drive link',
          'Write clear turnaround & pricing packages',
        ],
      },
      {
        week: 'Week 03',
        focusTitle: 'Free 30-Second Custom Sample Outreach',
        targetMetric: '15 Custom Creator Edits Sent',
        tasks: [
          'Pick 15 active YouTubers (10K-200K subs) not posting Reels/Shorts',
          'Cut 1 ready-to-post 35s vertical clip from their latest video',
          'Email/DM them the MP4 directly with zero strings attached',
        ],
      },
      {
        week: 'Week 04',
        focusTitle: 'Retainer Closing & Delivery SOP',
        targetMetric: 'First Monthly Retainer Client ($500+)',
        tasks: [
          'Set up shared Drive intake folders & Frame.io revision flow',
          'Pitch monthly 16-Short or 4-Long-Video bundle',
          'Maintain consistent 48-hour delivery turnaround',
        ],
      },
    ],
    steps: [
      {
        id: 'vid-1',
        stepNumber: '01',
        title: 'Retention Pacing & Visual Hierarchy Fundamentals',
        duration: 'Day 1 - 4',
        objective: 'Understand why viewers keep watching instead of just adding random effects.',
        instructions:
          'Master the 3-layer rule: (1) Clean jump cuts removing dead air/breaths, (2) Intentional J-cuts & L-cuts so audio leads visuals smoothly, (3) Visual anchors (zoom-ins, B-roll, motion callouts) whenever a new point starts.',
        checklist: [
          'Practice removing all dead pauses cleanly without jarring audio pops',
          'Use subtle 105-115% scale punch-ins on key sentences',
          'Keep text captions high-contrast, clean font, and strictly inside safe margins',
        ],
        deliverable: '1 Crisp 45-Second Retention Sample Edit',
        mentorPrompt:
          'Walk me through Step 1 of Retention Editing: Teach me J-cuts, pacing, and clean caption styling.',
      },
      {
        id: 'vid-2',
        stepNumber: '02',
        title: 'Sound Design & Audio Mastering (-14 LUFS)',
        duration: 'Day 5 - 8',
        objective: 'Make smartphone or podcast audio sound like a studio broadcast.',
        instructions:
          'Great audio retains viewers twice as long as flashy visuals. Apply EQ (cut mud around 250Hz, slight air boost), gentle compression, de-essing, subtle background bed (-24dB to -28dB), and soft tactile SFX on text popups.',
        checklist: [
          'Balance voiceover clearly above background music at all times',
          'Layer 3 subtle SFX types: soft pop, subtle whoosh, ambient riser',
          'Verify audio sounds clean on cheap phone speakers',
        ],
        deliverable: 'Studio-Mastered Audio Preset',
        mentorPrompt:
          'Teach me Step 2: How do I mix voice, music, and sound effects like top YouTube editors?',
      },
      {
        id: 'vid-3',
        stepNumber: '03',
        title: 'Build a 3-Style Spec Edit Portfolio',
        duration: 'Day 9 - 14',
        objective: 'Show clients the exact 3 styles they actually buy.',
        instructions:
          'Download public Creative Commons / podcast clips and edit 3 distinct portfolio samples: (1) Fast-paced Business/Podcast Short, (2) Clean Documentary/Motion Graphics Explainer, (3) High-converting UGC Product Ad.',
        checklist: [
          'Edit 3 polished 30-60s showcase pieces in 3 distinct niches',
          'Create a clean 1-page showcase page (Carrd/Notion/Google Drive folder)',
          'Label each sample with the editing style and turnaround time',
        ],
        deliverable: '3-Piece Video Editing Showcase',
        mentorPrompt:
          'Walk me through Step 3: Give me 3 exact portfolio sample ideas I can edit this week to attract clients.',
      },
      {
        id: 'vid-4',
        stepNumber: '04',
        title: 'The Free 30-Second Custom Sample Outreach Method',
        duration: 'Day 15 - 25',
        objective: 'Bypass crowded job boards by pitching creators directly with proof.',
        instructions:
          'Find 20 YouTubers or podcasters (10k - 200k subs) who upload long videos without high-retention Shorts. Take 45 seconds of their latest video, edit an incredible Short for them, and send it via Email/Twitter/IG DM with zero strings attached.',
        checklist: [
          'Identify 20 active creators who clearly monetize their audience',
          'Edit a custom 30-45s vertical clip from their recent episode',
          'Send a short 3-sentence email attaching the ready-to-post MP4',
        ],
        deliverable: '10 Custom Sample Pitches Sent',
        mentorPrompt:
          'Teach me Step 4: Write the exact DM/email outreach message to send a free sample edit to a YouTuber.',
      },
      {
        id: 'vid-5',
        stepNumber: '05',
        title: 'Client Workflow, Frame.io Reviews & Turnaround SOP',
        duration: 'Day 26 - 35',
        objective: 'Deliver cleanly so clients never stress about revisions or deadlines.',
        instructions:
          'Set up shared Google Drive intake folders (`01_Raw`, `02_Assets`, `03_Final`), deliver review links via Frame.io or Google Drive with timecoded notes, and enforce a predictable 48-hour turnaround.',
        checklist: [
          'Create standardized Drive folder template for every client',
          'Send v1 exports at 1080p MP4 with clear filename versioning (`v1`, `v2_final`)',
          'Limit included revisions to 2 rounds per video',
        ],
        deliverable: 'Client Delivery & Revision SOP',
        mentorPrompt:
          'Show me Step 5: How should I organize client footage, revisions, and fast turnarounds?',
      },
      {
        id: 'vid-6',
        stepNumber: '06',
        title: 'Retainer Packaging & Scaling an Editing Pod',
        duration: 'Day 36+',
        objective: 'Lock in $1,000-$3,000/mo recurring client packages.',
        instructions:
          'Move away from per-video billing into monthly bundles (e.g., "16 Vertical Reels + 4 YouTube Videos = $1,200/month"). Once you exceed 3 retainers, train a junior cutter for rough assembly while you handle creative polish.',
        checklist: [
          'Offer 3 tiered monthly retainer bundles instead of single edits',
          'Set recurring monthly billing upfront on the 1st of each month',
          'Document your style guide so junior editors match your quality',
        ],
        deliverable: 'Monthly Video Agency Retainer Pricing Sheet',
        mentorPrompt:
          'Guide me on Step 6: How do I price monthly video editing retainers and scale past $2,000/month?',
      },
    ],
    blueprints: [
      {
        id: 'vid-bp-1',
        title: 'Custom Sample Pitch Email to Creators',
        format: 'text',
        summary: 'Highest-converting cold outreach for video editors.',
        content: `Subject: Turned your latest episode into a viral Short (free to post)

Hey [Creator Name],

Loved your breakdown on [Topic] in yesterday's video — especially the point at [Timestamp].

I noticed you aren't repurposing many clips to Shorts/Reels right now, so I edited a 38-second high-retention vertical clip from that segment for you to post however you like: [Google Drive / Frame.io Link].

If you like the pacing, I'd love to handle 15-20 Shorts a month for you on a simple monthly package. Zero pressure either way!

Best,
[Your Name]`,
      },
    ],
    quickPrompts: [
      'Video editing aur UGC se freelancing mein jaldi earning kaise shuru karein? (Roman Urdu)',
      'Walk me through Step 1: How do top creators edit high-retention Shorts?',
      'Write a 3-hook UGC ad script for a skincare or tech product',
      'How should I price a monthly YouTube + Shorts editing retainer?',
    ],
  },
  {
    id: 'digital-commerce',
    title: 'Digital Products, Shopify & AI Micro-SaaS',
    shortName: 'Digital & Shopify',
    category: 'freelancing',
    categoryLabel: 'Freelancing & Agencies',
    level: 'Intermediate',
    timeToFirstDollar: '21 - 60 Days',
    earningModel: '90%+ Margin Digital Downloads + E-Commerce Retainers',
    imageUrl: '/src/assets/images/dept_automation_systems_1795091708539.jpg',
    exampleTemplateImage: '/src/assets/images/tpl_freelance_portfolio_shot_1795095058317.jpg',
    exampleTemplateCaption: 'Example digital product landing overview and automated checkout flow.',
    officialDocUrl: 'https://help.shopify.com/en',
    officialDocLabel: 'Shopify Official Partner & Store Documentation',
    summary:
      'Create once and sell infinitely: build Notion systems, n8n template packs, Shopify conversion stores, and micro-tools sold via LemonSqueezy/Gumroad/Shopify with automated delivery.',
    romanUrduIntro:
      'Aik baar digital product (Notion templates, n8n workflows, prompt packs, ya Shopify store) bana kar bar bar automate tareeqe se bechne aur Shopify store setup service dene ka complete system.',
    eligibility: [
      {
        metric: 'Merchant of Record',
        requirement: 'LemonSqueezy / Gumroad / Payhip',
        notes: 'Handles global VAT/Sales Tax automatically and pays out to Payoneer/Wise/Bank.',
      },
      {
        metric: 'Shopify Store Build',
        requirement: '$400 - $2,000 Client Fee',
        notes: 'High-demand freelance service: store setup, speed, CRO, and email flows.',
      },
      {
        metric: 'Product Pricing',
        requirement: '$19 - $149 Digital Asset',
        notes: 'Zero inventory cost, instant automated fulfillment, 90%+ net margin.',
      },
      {
        metric: 'Traffic Engine',
        requirement: 'Organic Short-Form + SEO',
        notes: 'Reels/YouTube tutorials demonstrating the exact problem your template solves.',
      },
    ],
    revenueStreams: [
      'Selling Notion Operating Systems, n8n Workflow Packs, and Creator Kits',
      'Shopify Store Design & Conversion Rate Optimization (CRO) for Brands',
      'Klaviyo / Automated Cart Recovery Email Flows Setup',
      'Affiliate & Referral Bundles embedded inside free starter templates',
    ],
    requiredTools: [
      'Gumroad / LemonSqueezy / Shopify Partner Account',
      'Notion / Figma / Canva for clean product assets & mockups',
      'n8n / Zapier for automated customer onboarding & license delivery',
      'Klaviyo or Brevo for automated abandoned cart & upsell emails',
    ],
    policyWarnings: [
      'Never resell copyrighted courses or stolen PLR packs — build genuinely original templates and tools you own 100%.',
      'Ensure transparent refund terms and accurate product screenshots so Stripe/LemonSqueezy chargeback rates stay below 0.5%.',
      'For Shopify client stores, never install 25 heavy bloated apps; keep store speed fast using native OS 2.0 theme blocks.',
    ],
    insightTargets: {
      primaryLabel: 'Product Page Visits',
      primaryGoal: 1000,
      primaryUnit: 'visits',
      secondaryLabel: 'Paid Orders',
      secondaryGoal: 20,
      secondaryUnit: 'sales',
    },
    weeklyMilestones: [
      {
        week: 'Week 01',
        focusTitle: 'Validate Micro-Problem & Build Core Digital Asset',
        targetMetric: 'Validated Spec + Core Template Built',
        tasks: [
          'Research 3 active competing templates in Gumroad/Shopify ecosystem',
          'Build clean original template + 5-minute Loom quickstart guide',
          'Prepare 4 high-contrast product preview mockups',
        ],
      },
      {
        week: 'Week 02',
        focusTitle: 'Checkout, Payouts & Free-to-Pro Email Funnel',
        targetMetric: 'Live Checkout + Free Lead Magnet',
        tasks: [
          'Publish Free Lite + Paid Pro tiers on LemonSqueezy/Gumroad',
          'Connect Payoneer/Wise payout credentials',
          'Run 100% discount test purchase to verify automated delivery email',
        ],
      },
      {
        week: 'Week 03',
        focusTitle: 'Tutorial Traffic Engine',
        targetMetric: '4 Tutorial Videos Linking to Funnel',
        tasks: [
          'Publish 2 YouTube tutorials + 4 Reels showing the problem solved live',
          'Place tracked UTM link in bio & pinned comments',
          'Track free downloads -> paid conversion rate',
        ],
      },
      {
        week: 'Week 04',
        focusTitle: 'Done-For-You Shopify / Setup Service Upsell',
        targetMetric: 'Service Offer Live + 1st High-Ticket Lead',
        tasks: [
          'Add "Book Done-For-You Setup" CTA inside template Quickstart',
          'Create Shopify Partner dev store demo showcasing CRO speed',
          'Pitch e-commerce brands on store speed & Klaviyo email flows',
        ],
      },
    ],
    steps: [
      {
        id: 'dc-1',
        stepNumber: '01',
        title: 'Pick a Painful Micro-Problem & Validate Demand',
        duration: 'Day 1 - 3',
        objective: 'Design a digital product people already search for and gladly pay $19-$79 to shortcut.',
        instructions:
          'Never invent a solution nobody asked for. Browse Gumroad/ProductHunt/Shopify App reviews for recurring complaints ("Hard to track freelance taxes", "Need ready n8n WhatsApp bots") and build the cleanest shortcut.',
        checklist: [
          'List 5 specific workflow pains from your own daily work or niche',
          'Verify at least 3 competitors are actively making sales in that category',
          'Define one crisp promise: "Save 10 hours setting up [X] in 15 minutes"',
        ],
        deliverable: 'Validated Digital Product Spec',
        mentorPrompt:
          'Walk me through Step 1 of Digital Products: Help me validate a profitable $29-$79 digital product idea.',
      },
      {
        id: 'dc-2',
        stepNumber: '02',
        title: 'Build the Asset + 10-Minute Quickstart Guide',
        duration: 'Day 4 - 10',
        objective: 'Deliver a polished product that guarantees zero refund requests.',
        instructions:
          'Build your template, n8n JSON bundle, or Shopify section pack cleanly. Include a 5-minute Loom setup video and a clean 1-page Quickstart PDF so buyers succeed on their very first try.',
        checklist: [
          'Organize template/files with crystal-clear naming and sample demo data',
          'Record a 5-minute Loom walkthrough showing installation step by step',
          'Design 4 crisp preview mockups showing real use cases',
        ],
        deliverable: 'Packaged Digital Product + Quickstart Video',
        mentorPrompt:
          'Teach me Step 2: How should I structure and package my digital template so buyers love it?',
      },
      {
        id: 'dc-3',
        stepNumber: '03',
        title: 'Checkout, Global Tax & Automated Delivery Setup',
        duration: 'Day 11 - 14',
        objective: 'Accept global cards/Apple Pay/PayPal seamlessly via Merchant of Record.',
        instructions:
          'Publish on LemonSqueezy, Gumroad, or Payhip so global sales tax/VAT is handled automatically. Configure an instant automated welcome email delivering the download link + bonus resource.',
        checklist: [
          'Create product listing with benefit-driven bullet points & FAQ',
          'Connect Payoneer/Wise/Bank payout details and verify ID',
          'Run a 100% discount test checkout to verify instant delivery email',
        ],
        deliverable: 'Live Checkout Page & Automated Delivery',
        mentorPrompt:
          'Walk me through Step 3: Compare Gumroad, LemonSqueezy, and Shopify for global payouts and tax handling.',
      },
      {
        id: 'dc-4',
        stepNumber: '04',
        title: 'Lead Magnet Funnel (Free Lite Version -> Paid Pro)',
        duration: 'Day 15 - 22',
        objective: 'Build an email list of warm buyers using a genuinely useful free starter.',
        instructions:
          'Offer a 100% free "Starter Checklist / Lite Template" on your landing page. On the thank-you page and in Email #2, present a time-limited upgrade to the full Pro System.',
        checklist: [
          'Publish free Starter version at $0+ to collect email leads',
          'Write a 3-email automated sequence: Deliver Freebie -> Case Study -> Pro Offer',
          'Track free-to-paid conversion rate (aim for 3% - 8%)',
        ],
        deliverable: 'Free-to-Pro Email Funnel',
        mentorPrompt:
          'Show me Step 4: Write a 3-email sequence converting free template downloaders into paying customers.',
      },
      {
        id: 'dc-5',
        stepNumber: '05',
        title: 'Content-Driven Traffic (YouTube Tutorials & Reels)',
        duration: 'Day 23 - 45',
        objective: 'Drive free daily organic buyer traffic without burning ad budget.',
        instructions:
          'Film "How I automated X" or "How I built this clean Shopify section" tutorials on YouTube, Instagram, and TikTok. Show the tool working live — then link the ready-to-use template in description/DM.',
        checklist: [
          'Publish 3 tutorial videos demonstrating the problem your product solves',
          'Link directly to your free Starter or Pro checkout page',
          'Add UTM tracking tags to measure which platform drives real sales',
        ],
        deliverable: 'Organic Tutorial Traffic Engine',
        mentorPrompt:
          'Teach me Step 5: Give me 5 YouTube/Reel tutorial ideas that naturally sell a digital product.',
      },
      {
        id: 'dc-6',
        stepNumber: '06',
        title: 'Shopify CRO & E-Commerce Agency Upsell',
        duration: 'Day 45+',
        objective: 'Offer Done-For-You Shopify & Automation setup at $500-$2,000 per store.',
        instructions:
          'Many business owners buy your template and immediately ask "Can you just set this up for my store?" Add a clear "Book Done-For-You Setup ($750)" button inside every template.',
        checklist: [
          'Add a "Need Custom Setup?" booking link inside your product Quickstart',
          'Build a Shopify Partner account to create unlimited dev preview stores for clients',
          'Package store design + Klaviyo flows + speed optimization into one offer',
        ],
        deliverable: 'Done-For-You Shopify & Setup Service Offer',
        mentorPrompt:
          'Guide me on Step 6: How do I sell Shopify store setup and CRO as a high-ticket freelance service?',
      },
    ],
    blueprints: [
      {
        id: 'dc-bp-1',
        title: 'High-Converting Digital Product Page Outline',
        format: 'text',
        summary: 'Proven structure for Gumroad / LemonSqueezy / Landing Pages.',
        content: `1. HEADLINE: "[Exact Outcome] without [Biggest Frustration] in [Timeframe]"
2. SUBHEAD: Who this is built for + 1-sentence proof.
3. VISUAL PREVIEW: Crisp screenshot or 45-second Loom demo gif.
4. WHAT'S INSIDE: Bullet list with concrete file counts & formats (not vague hype).
5. WHO THIS IS NOT FOR: Builds instant trust and filters bad-fit refunds.
6. FAQ: Compatibility, updates, support email, and license terms.`,
      },
    ],
    quickPrompts: [
      'Digital products aur Shopify se online earning kaise shuru karein? (Roman Urdu)',
      'Give me 5 digital product ideas I can build this weekend',
      'Walk me through Step 3: Which payment gateway works best globally?',
      'Write a product landing page copy for my Notion/n8n template pack',
    ],
  },
];
