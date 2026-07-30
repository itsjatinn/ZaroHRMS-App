import type { Announcement, CommentRow } from '../../api/announcements';

/**
 * Sample announcements used only on the offline demo session, where there is
 * no bearer token to fetch real ones with. Between them they exercise every
 * block the web composer can author — hero/inline/thumbnail/gallery/video
 * media, attachments, CTAs, events, polls, reactions, acknowledgement,
 * comments and contacts — plus the read/unread and archive states.
 *
 * A live backend session never sees these.
 */

/**
 * Flip to `true` to render the sample set even on a live backend session.
 *
 * Useful for previewing the screen on a simulator that *can* reach the backend
 * (so it gets a real session) while the database has no announcements for the
 * signed-in employee yet. While forced, the screen makes no network calls at
 * all, so nothing here can touch real data. Leave it `false` for normal use.
 */
export const FORCE_DEMO_ANNOUNCEMENTS = false;

const HOUR = 3600_000;
const DAY = 24 * HOUR;

/** ISO timestamp `ms` in the past, so relative labels stay sensible. */
const ago = (ms: number) => new Date(Date.now() - ms).toISOString();

/** Public placeholder images — they need connectivity to load. */
const img = (seed: string, w = 800, h = 450) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;

export const DEMO_ANNOUNCEMENTS: Announcement[] = [
  // 1. Featured hero — hero image, rich body, CTAs, reactions, comments.
  {
    id: 'demo-featured',
    title: 'Zaro is moving to a four-day work week pilot',
    summary:
      'Starting next month we are trialling a four-day week across Platform and Design. Here is what changes and what stays the same.',
    badge: 'Company',
    featured: true,
    postedBy: 'Ananya Iyer · Chief People Officer',
    sentAt: ago(2 * HOUR),
    media: { kind: 'image', display: 'hero', url: img('fourday'), alt: 'Team at work' },
    bodyHtml: `
      <p>Team, we are excited to announce a <strong>three-month pilot</strong> of the
      four-day work week, beginning the first Monday of next month.</p>
      <h3>What changes</h3>
      <ul>
        <li>Fridays are non-working days for Platform and Design</li>
        <li>Core hours move to <strong>9:30am – 6:00pm</strong>, Monday to Thursday</li>
        <li>No reduction in salary or leave entitlement</li>
      </ul>
      <h3>What stays the same</h3>
      <p>Client commitments, on-call rotations and payroll dates are unchanged.
      Read the <a href="https://zaro.in/handbook/four-day-week">full policy in the handbook</a>
      before the briefing.</p>
      <blockquote>We will review the pilot together in week ten and decide as a company.</blockquote>
    `,
    ctas: [
      { id: 'cta-1', label: 'Read the policy', url: 'https://zaro.in/handbook', variant: 'primary' },
      { id: 'cta-2', label: 'Join the AMA', url: 'https://zaro.in/ama', variant: 'ghost' },
    ],
    reactionsEnabled: true,
    commentsEnabled: true,
    reactionCounts: { LIKE: 42, CLAP: 18, PARTY: 27, HEART: 9 },
    totalReactions: 96,
    myReaction: null,
    commentCount: 3,
  },

  // 2. Acknowledgement required — attachments of every icon type.
  {
    id: 'demo-policy',
    title: 'Updated information security policy — acknowledgement required',
    summary:
      'All employees must read and acknowledge the revised policy before the 15th.',
    badge: 'Policy',
    postedBy: 'Rahul Menon · IT & Security',
    sentAt: ago(26 * HOUR),
    bodyHtml: `
      <p>We have refreshed our information security policy to cover
      <strong>personal device usage</strong> and the new SSO rollout.</p>
      <ol>
        <li>Enable two-factor authentication on your Zaro account</li>
        <li>Install the device management profile on any phone used for work email</li>
        <li>Acknowledge this announcement below</li>
      </ol>
      <p>Non-acknowledgement after the 15th will temporarily suspend VPN access.</p>
    `,
    attachments: [
      { id: 'att-1', name: 'InfoSec-Policy-v4.pdf', url: 'https://zaro.in/files/infosec.pdf', type: 'pdf', sizeKb: 842 },
      { id: 'att-2', name: 'Device-Enrolment-Guide.docx', url: 'https://zaro.in/files/guide.docx', type: 'docx', sizeKb: 210 },
      { id: 'att-3', name: 'Compliance-Checklist.xlsx', url: 'https://zaro.in/files/checklist.xlsx', type: 'xlsx', sizeKb: 96 },
      { id: 'att-4', name: 'Onboarding-Deck.pptx', url: 'https://zaro.in/files/deck.pptx', type: 'pptx', sizeKb: 3400 },
      { id: 'att-5', name: 'policy-archive.zip', url: 'https://zaro.in/files/archive.zip', type: 'zip', sizeKb: 12800 },
    ],
    requiresAcknowledgement: true,
    ackedByMe: false,
    ackCount: 128,
    reactionsEnabled: true,
    reactionCounts: { LIKE: 11 },
    totalReactions: 11,
  },

  // 3. Event — full event block with RSVP, plus inline media.
  {
    id: 'demo-event',
    title: 'Q3 All-Hands: results, roadmap and a look at FY27',
    summary: 'Friday 4:00pm in the main hall, with a live stream for remote folks.',
    badge: 'Event',
    postedBy: 'Priya Nair · Operations',
    sentAt: ago(5 * HOUR),
    media: { kind: 'image', display: 'inline', url: img('allhands'), alt: 'Main hall' },
    bodyHtml: `
      <p>Join us for the quarterly review. We will cover revenue against plan, the
      product roadmap through FY27, and take questions live.</p>
      <p><em>Snacks provided. Please RSVP so we can plan seating.</em></p>
    `,
    event: {
      start: new Date(Date.now() + 3 * DAY).toISOString(),
      end: new Date(Date.now() + 3 * DAY + 2 * HOUR).toISOString(),
      venue: 'Main Hall, 4th Floor, Prestige Tech Park',
      meetingUrl: 'https://meet.google.com/abc-defg-hij',
      organizer: 'Priya Nair',
      rsvp: true,
    },
    ctas: [{ id: 'cta-3', label: 'Add the agenda', url: 'https://zaro.in/agenda', variant: 'ghost' }],
    reactionsEnabled: true,
    reactionCounts: { PARTY: 31, LIKE: 14 },
    totalReactions: 45,
    myReaction: 'PARTY',
    commentsEnabled: true,
    commentCount: 2,
  },

  // 4. Poll — pre-seeded tallies, not yet voted.
  {
    id: 'demo-poll',
    title: 'Help us pick the venue for the annual offsite',
    summary: 'Voting closes Friday. One choice per person.',
    badge: 'Culture',
    postedBy: 'Divya Gopal · People Team',
    sentAt: ago(9 * HOUR),
    bodyHtml: `<p>We have shortlisted four options within a four-hour drive. Costs are
      comparable, so this comes down to what the team actually wants.</p>`,
    poll: {
      id: 'poll-offsite',
      question: 'Where should we hold the FY27 offsite?',
      singleChoice: true,
      options: [
        { id: 'opt-1', label: 'Coorg — coffee estate resort', votes: 0 },
        { id: 'opt-2', label: 'Goa — beachside villas', votes: 0 },
        { id: 'opt-3', label: 'Chikmagalur — hill retreat', votes: 0 },
        { id: 'opt-4', label: 'Pondicherry — heritage quarter', votes: 0 },
      ],
    },
    pollVotes: { 'poll-offsite': { 'opt-1': 24, 'opt-2': 41, 'opt-3': 17, 'opt-4': 9 } },
    myPollVotes: {},
    commentsEnabled: true,
    commentCount: 1,
  },

  // 5. Video media — renders as a tappable poster.
  {
    id: 'demo-video',
    title: 'Watch: our new brand film',
    summary: 'Ninety seconds on where Zaro is headed. Please share externally.',
    badge: 'Brand',
    postedBy: 'Zara Khan · Marketing',
    sentAt: ago(2 * DAY),
    media: {
      kind: 'video',
      display: 'hero',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      videoProvider: 'youtube',
      poster: img('brandfilm'),
    },
    message:
      'The film goes live on our channels on Monday. Feel free to share it with your networks once it does — assets and captions are in the brand folder.',
    reactionsEnabled: true,
    reactionCounts: { HEART: 22, CLAP: 15 },
    totalReactions: 37,
  },

  // 6. Gallery media — multi-image grid.
  {
    id: 'demo-gallery',
    title: 'Photos from the Wellness Week step challenge',
    summary: 'Nine thousand kilometres walked between us. Some highlights.',
    badge: 'Culture',
    postedBy: 'Divya Gopal · People Team',
    sentAt: ago(3 * DAY),
    media: {
      kind: 'image',
      display: 'gallery',
      url: img('wellness1'),
      gallery: [
        { url: img('wellness1'), alt: 'Morning walk' },
        { url: img('wellness2'), alt: 'Yoga session' },
        { url: img('wellness3'), alt: 'Step challenge board' },
        { url: img('wellness4'), alt: 'Team photo' },
      ],
    },
    bodyHtml: `<p>Thank you to everyone who took part. Platform edged out Sales by
      <strong>just 40km</strong> — a rematch is already being negotiated.</p>`,
    reactionsEnabled: true,
    reactionCounts: { LIKE: 30, SMILE: 12, HEART: 8 },
    totalReactions: 50,
  },

  // 7. Contacts block.
  {
    id: 'demo-contacts',
    title: 'Open enrolment for the new health insurance plan',
    summary:
      'Dependent coverage is now included. Enrolment closes at the end of the month.',
    badge: 'Benefits',
    postedBy: 'Nisha Patel · Finance',
    sentAt: ago(4 * DAY),
    bodyHtml: `
      <p>Our new plan raises the family floater to <strong>₹8,00,000</strong> and adds
      parents as eligible dependents at no extra premium.</p>
      <p>You must confirm your dependents before enrolment closes, or the previous
      year's list carries over.</p>
    `,
    attachments: [
      { id: 'att-6', name: 'Plan-Summary-FY27.pdf', url: 'https://zaro.in/files/plan.pdf', type: 'pdf', sizeKb: 640 },
    ],
    contacts: [
      { name: 'Nisha Patel', role: 'Finance Analyst', email: 'nisha@zaro.in', phone: '+91 98450 11223' },
      { name: 'Benefits Helpdesk', role: 'Insurance partner', email: 'help@insurer.example', chatUrl: 'https://zaro.in/chat' },
    ],
    reactionsEnabled: true,
    reactionCounts: { LIKE: 19 },
    totalReactions: 19,
  },

  // 8. Plain — no body, no extras, so the card has no expand affordance.
  {
    id: 'demo-plain',
    title: 'Reminder: office closed Monday for Independence Day',
    summary: 'Normal operations resume Tuesday morning.',
    postedBy: 'Facilities',
    sentAt: ago(6 * DAY),
  },

  // 9. Already read — populates the Read filter and the Archive view.
  {
    id: 'demo-read',
    title: 'New expense reimbursement limits are live',
    summary: 'Per-diem and travel caps have been revised upward for FY27.',
    badge: 'Finance',
    postedBy: 'Nisha Patel · Finance',
    sentAt: ago(8 * DAY),
    readAt: ago(30 * HOUR),
    bodyHtml: `<p>Domestic per-diem rises to <strong>₹2,500</strong> and intercity travel
      may now be booked in premium economy for flights over four hours.</p>`,
    reactionsEnabled: true,
    reactionCounts: { LIKE: 25, CLAP: 6 },
    totalReactions: 31,
    myReaction: 'LIKE',
  },

  // 10. Read + acknowledged — shows the completed acknowledgement state, and a
  //     thumbnail-display image.
  {
    id: 'demo-acked',
    title: 'Code of conduct refresher — completed',
    summary: 'Thank you for acknowledging the annual refresher.',
    badge: 'Policy',
    postedBy: 'Ananya Iyer · Chief People Officer',
    sentAt: ago(10 * DAY),
    readAt: ago(2 * DAY),
    media: { kind: 'image', display: 'thumbnail', url: img('conduct', 600, 340), alt: 'Handbook' },
    bodyHtml: `<p>Our code of conduct is reviewed every year. You have already
      acknowledged this year's version — no further action is needed.</p>`,
    requiresAcknowledgement: true,
    ackedByMe: true,
    ackCount: 214,
  },
];

/** Seeded comment threads so the comments block reads as populated. */
const DEMO_COMMENTS: Record<string, CommentRow[]> = {
  'demo-featured': [
    {
      id: 'dc-1',
      announcementId: 'demo-featured',
      userId: 'Meera Rao',
      body: 'This is brilliant news. Will on-call weeks be compensated with a different day off?',
      createdAt: ago(90 * 60_000),
    },
    {
      id: 'dc-2',
      announcementId: 'demo-featured',
      userId: 'Vikram Kulkarni',
      body: 'Same question here — otherwise the rotation lands unevenly across the quarter.',
      createdAt: ago(70 * 60_000),
    },
    {
      id: 'dc-3',
      announcementId: 'demo-featured',
      userId: 'Ananya Iyer',
      body: 'Yes — on-call weeks get a floating day, claimable the following month. Details in the AMA.',
      createdAt: ago(40 * 60_000),
    },
  ],
  'demo-event': [
    {
      id: 'dc-4',
      announcementId: 'demo-event',
      userId: 'Karan Verma',
      body: 'Will the stream be recorded for the Singapore team?',
      createdAt: ago(3 * HOUR),
    },
    {
      id: 'dc-5',
      announcementId: 'demo-event',
      userId: 'Priya Nair',
      body: 'It will — the recording goes out the same evening.',
      createdAt: ago(2 * HOUR),
    },
  ],
  'demo-poll': [
    {
      id: 'dc-6',
      announcementId: 'demo-poll',
      userId: 'Arjun Thomas',
      body: 'Coorg was fantastic two years ago, but somewhere new would be nice.',
      createdAt: ago(6 * HOUR),
    },
  ],
};

export function demoCommentsFor(id: string): CommentRow[] {
  return DEMO_COMMENTS[id] ?? [];
}
