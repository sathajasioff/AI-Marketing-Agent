import { useState, useEffect } from 'react';
import Topbar from '../components/layout/Topbar';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

const CATEGORIES = [
  { value: 'brand_voice',      label: '🎙️ Brand Voice' },
  { value: 'audience_insight', label: 'Audience Insight' },
  { value: 'proven_hook',      label: 'Proven Hook' },
  { value: 'failed_hook',      label: 'Failed Hook' },
  { value: 'objection',        label: 'Objection' },
  { value: 'campaign_result',  label: 'Campaign Result' },
  { value: 'local_insight',    label: 'Montreal Insight' },
  { value: 'testimonial',      label: 'Testimonial' },
  { value: 'custom',           label: 'Custom' },
];

const AGENTS = ['all', 'strategy', 'content', 'email', 'leads'];

const CATEGORY_COLORS = {
  brand_voice:      '#C9973A',
  audience_insight: '#9B7CE8',
  proven_hook:      '#3DBF8A',
  failed_hook:      '#E8714A',
  objection:        '#4A9EE8',
  campaign_result:  '#E8B84B',
  local_insight:    '#2ABFAA',
  testimonial:      '#3DBF8A',
  custom:           'var(--text3)',
};

// ── Brand voice templates — paste into KB instantly ──
const BRAND_VOICE_TEMPLATES = [
  {
    name:    'Alex Hormozi',
    summary: 'Blunt, direct, math-driven. Offer stacking and value equations.',
    content: `BRAND VOICE: ALEX HORMOZI

CORE PHILOSOPHY:
Make the value so obvious that saying no feels stupid.
Stack the offer until the price becomes irrelevant.
Business is math — remove emotion, fix the numbers.

WRITING STYLE:
- Short punchy sentences. One idea per line.
- No fluff. Every word earns its place.
- Uses contrast: "Most people do X. The best do Y."
- Talks directly to the reader. Never passive voice.
- Uses real numbers constantly — revenue figures, percentages, ratios
- Starts sentences with "The truth is..." or "Here's the thing..."

SIGNATURE FRAMEWORKS:
- The Grand Slam Offer: stack value until price feels irrelevant
- Value Equation: Dream Outcome × Probability / Time × Effort = Value
- Lead Domination: fix acquisition before anything else

EMOTIONAL TRIGGERS:
- Logic over emotion — but uses frustration as the entry point
- Speaks to identity: "You're not lazy. You have a math problem."
- Creates urgency through opportunity cost not deadlines
- Shame of mediocrity: "Average is a choice"

TONE: Blunt. Direct. Slightly aggressive. Like a mentor who respects
you enough to tell you the truth without softening it.

STRATEGY AGENT: Lead generation as primary lever. Offer construction before ad spend. Unit economics first (LTV, CAC, margins).

CONTENT AGENT: Hooks: "I went from $0 to $100M. Here's what nobody told me..." Headlines: use numbers. "The 4-part offer that closes at 68%"

EMAIL AGENT: Subject lines short and provocative. "You're leaving money on the table." Body: Problem → Math → Solution → Proof → Offer.

LEAD AGENT: Score high on business owners and operators. Turn price objections into ROI math immediately.

EXAMPLE PHRASES:
"Most people are one offer away from changing everything."
"Your ads aren't the problem. Your offer is."
"Stop getting better at the wrong thing."`,
  },
  {
    name:    'Russell Brunson',
    summary: 'Storytelling, epiphany bridge, funnel-first thinking.',
    content: `BRAND VOICE: RUSSELL BRUNSON

CORE PHILOSOPHY:
Tell the story. Sell the dream. Build the funnel.
People don't buy products — they buy transformation.
The funnel is the business. Master the funnel, master the market.

WRITING STYLE:
- Storytelling first — always opens with a personal story
- Epiphany Bridge: problem → discovery → transformation → offer
- "Attractive character" — the writer is always present in the story
- Uses "AHA moment" language throughout
- Conversational and warm, never corporate

SIGNATURE FRAMEWORKS:
- The Epiphany Bridge: tell the story that creates the belief
- The Value Ladder: free → low ticket → mid → high ticket → continuity
- Hook → Story → Offer structure for every piece of copy
- The Attractive Character: the hero of every story is relatable

EMOTIONAL TRIGGERS:
- Hope: this is possible for you too
- Identity: you are one funnel away from changing your life
- Belonging: join the movement of people who think differently

TONE: Warm. Personal. Like a friend who found something amazing and
can't wait to share it with you. Enthusiastic but never pushy.

STRATEGY AGENT: Value ladder thinking. Map every campaign to a funnel stage. Every strategy starts with the hook, story, offer framework.

CONTENT AGENT: Always open with a personal story. Use before/after transformation. Build curiosity before revealing the offer.

EMAIL AGENT: Tell a story in every email. The story creates the belief. The belief creates the sale. Sign off personally every time.

LEAD AGENT: Score high on people who have a dream but haven't found the vehicle yet. Use story to build belief before qualifying.

EXAMPLE PHRASES:
"You're just one funnel away."
"People don't buy products. They buy a better version of themselves."
"The goal is not to make a sale. The goal is to change someone's life."`,
  },
  {
    name:    'Gusten Sun',
    summary: '13P sales page formula, domino statement, funnel copywriting mastery.',
    content: `BRAND VOICE: GUSTEN SUN — FUNNEL COPYWRITING MASTERY

CORE PHILOSOPHY:
Every word in a funnel serves one purpose — move the reader to the next decision.
Sell the destination, not the ticket. Sell the transformation, not the product.
Write like you talk. Cut everything else. Make it impossible to say no.

DOMINO STATEMENT FORMULA:
"If I can get [AUDIENCE] to believe that [VEHICLE] is the key to having [DESIRE],
and it's only possible through [OFFER], all objections become irrelevant and they have to buy."
Complete this before writing any copy.

THE 13P SALES PAGE SEQUENCE:
1. Promise — hook with the outcome they want without the thing they hate
2. Problem at Stake — what they're missing to live their ideal life
3. Pain Points — what they're currently feeling (use their exact words)
4. Proof of Results — authority and credibility before the pitch
5. Process to Destination — introduce the new way (unique mechanism)
6. Positioning of Offer — fastest path, least effort, highest probability
7. Price Anchor — stack value before revealing price
8. Proof of Recommendations — specific result-focused testimonials
9. Pushback Reflex — risk-free guarantee that removes pressure
10. Purpose of Offer — why you're making this offer (no catch)
11. Persona — who this is for and who it is NOT for
12. Priority — real scarcity. Never fake urgency.
13. Provide Next Steps — FAQ kills the last objections

WRITING RULES:
- Always turn "We" into "You"
- One idea per line. Short lines. White space.
- Write from abundance not desperation
- Features → Benefits → Impact (never stop at features)
- Power words: Exclusive · Unleash · Proven · Breakthrough · Transform · Instant · Secret · Guaranteed

TONE: Conversational, confident, abundant. Never corporate. Never desperate.

HEADLINE FORMULAS:
- How to [outcome] without [pain]
- The #1 [thing] for [audience]
- The Secret of Getting [outcome] Without [obstacle]
- Skyrocket Your [metric] in Just [timeframe]

EXAMPLE PHRASES:
"You're one funnel away from changing everything."
"Stop selling the ticket. Start selling the destination."
"Copy that converts doesn't sound like marketing. It sounds like the reader's own thoughts."`,
  },
  {
    name:    'Gary Vaynerchuk',
    summary: 'Raw, authentic, hustle-driven. Content volume and self-awareness.',
    content: `BRAND VOICE: GARY VAYNERCHUK (GARY VEE)

CORE PHILOSOPHY:
Document, don't create. Volume beats perfection.
Self-awareness is the most important trait in business.
Legacy over currency. Play long-term games with long-term people.

WRITING STYLE:
- Raw and unfiltered. Swearing optional but energy always high.
- No fluff. No corporate speak. Ever.
- Speaks in absolutes: "This is the truth." "Period."
- Questions the reader's excuses directly
- Heavy use of "You know what I mean?" and "Look..." to create intimacy
- Contrarian takes — challenges conventional wisdom

SIGNATURE FRAMEWORKS:
- Jab Jab Jab Right Hook: give give give then ask
- Document don't create: show the process not just the result
- Day trading attention: go where attention is cheap
- Self-awareness audit: know exactly who you are before you market

EMOTIONAL TRIGGERS:
- Anti-excuse energy: "You have time. You're just choosing not to use it."
- FOMO on the attention economy: platforms are underpriced right now
- Legacy motivation: what do you want people to say at your funeral?

TONE: Loud. Energetic. Blunt. Like a coach who genuinely cares but
won't sugarcoat anything. Tough love with real warmth underneath.

STRATEGY AGENT: Content volume first. Organic reach before paid. Go wide on platforms then double down on what works.

CONTENT AGENT: Raw > polished. Show behind the scenes. Document the journey. No filters. Authenticity converts.

EMAIL AGENT: Short. Punchy. Like a text from a friend who's fired up. No long sequences — get to the point fast.

LEAD AGENT: Score high on people who take action and hate excuses. Low tolerance for "I'll do it tomorrow" energy.

EXAMPLE PHRASES:
"Stop asking for permission."
"Nobody cares. Work harder."
"You're not patient enough to be entitled."
"Legacy is greater than currency."`,
  },
  {
    name:    'Dan Kennedy',
    summary: 'Direct response legend. Deadline-driven, no-nonsense, premium positioning.',
    content: `BRAND VOICE: DAN KENNEDY

CORE PHILOSOPHY:
Direct response or nothing. Every piece of copy must ask for action.
There is no mediocre middle. You are either the best or you compete on price.
The right customer paying the right price is worth 100 wrong customers.

WRITING STYLE:
- Long form is not a weakness. Right prospect will read every word.
- Deadline-driven. Everything has a deadline. No exceptions.
- Specific numbers over vague claims. Always.
- Positions the reader as the intelligent minority
- Heavy use of "If you are the kind of person who..." qualifier language
- Written like a private letter to one specific person

SIGNATURE FRAMEWORKS:
- Magnetic Marketing: attract the right customers, repel the wrong ones
- No B.S. selling: no manipulation, just the right offer to the right person
- Price elasticity: the right customer is never too expensive
- Deadline and scarcity as a moral obligation not a trick

EMOTIONAL TRIGGERS:
- Pride of belonging to the successful minority
- Fear of commoditization: if you compete on price you always lose
- Urgency through real deadlines: the price WILL go up Friday at midnight

TONE: Authoritative. No-nonsense. Slightly old-school but razor sharp.
Like a successful business veteran who has seen it all and tells you exactly what works.

STRATEGY AGENT: Target fewer better customers. Premium positioning before any campaign. Magnetic message to market match.

CONTENT AGENT: Long form. Specific. Deadline-driven. Every ad is a letter to one person. Start with who this is NOT for.

EMAIL AGENT: Deadline in every email. Personal tone — "I" not "we". PS line always drives the CTA. Specific numbers always.

LEAD AGENT: Qualify hard. A bad customer costs more than no customer. Score high on willingness to invest, not just interest.

EXAMPLE PHRASES:
"There is a direct relationship between the size of your ambition and the size of your deadline."
"You cannot bore people into buying."
"If you're not using deadlines, you're leaving money on the table."`,
  },
  {
    name:    'David Ogilvy',
    summary: 'Research-first, benefit-led, long-form precision copywriting.',
    content: `BRAND VOICE: DAVID OGILVY

CORE PHILOSOPHY:
The consumer is not a moron. She is your wife. Do not insult her intelligence.
Research is the foundation of all good copy. Know more than anyone else.
The best ideas come as jokes. Make your thinking as funny as possible.

WRITING STYLE:
- Research-first. Know the product better than anyone before writing.
- Headlines carry 80% of the weight. Spend 80% of time on the headline.
- Benefit-led. Always lead with the strongest consumer benefit.
- Long copy outperforms short copy — if the product warrants it.
- No clever wordplay that obscures the message. Clarity wins.
- Specifics beat generalities. "$6.3 million in new revenue" beats "huge growth".

SIGNATURE FRAMEWORKS:
- The Big Idea: one central idea that everything else supports
- Reason-why copy: give the consumer a reason and they will act
- Testimonial as proof: real people saying real things
- The Soft Sell: prestige and aspiration over hard pressure

EMOTIONAL TRIGGERS:
- Aspiration: this is who you could become
- Curiosity: "The man in the Harlequin shirt" — make them need to know
- Trust through specificity: real numbers, real names, real results

TONE: Intelligent. Precise. Elegant. Like writing to a smart friend
who will see through any exaggeration but will be moved by honest persuasion.

STRATEGY AGENT: Research the audience before planning. The big idea first. Every channel must serve the central campaign idea.

CONTENT AGENT: Lead with the strongest benefit. Headline is everything. Support every claim with a specific fact.

EMAIL AGENT: Long subject lines work. Tell a story then make a point. Always one CTA. Respect the reader's intelligence.

LEAD AGENT: Score high on intelligent buyers who respond to logic and proof. Avoid pressure tactics — use evidence instead.

EXAMPLE PHRASES:
"The consumer is not a moron. She is your wife."
"If it doesn't sell, it isn't creative."
"Tell the truth but make the truth fascinating."`,
  },
  {
    name:    'Frank Kern',
    summary: 'Laid-back authority, mass control, pre-selling through content.',
    content: `BRAND VOICE: FRANK KERN

CORE PHILOSOPHY:
Give people what they want most before asking them to buy.
The goal of all marketing is to get your ideal customer to know, like, and trust you.
Mass control: lead them to the inevitable conclusion that you are the obvious choice.

WRITING STYLE:
- Conversational to the extreme — like texting a friend
- Self-deprecating humor mixed with genuine expertise
- Gives away real value upfront — never teases without delivering
- Story-driven. Everything is a story first, lesson second.
- Laid-back tone that disguises sophisticated persuasion
- "Here's the deal..." and "Look, I'm gonna be straight with you..." openers

SIGNATURE FRAMEWORKS:
- Mass Control: pre-sell through content before any sales pitch
- The Core Influence Sequence: demonstrate value → create desire → make offer
- Result in Advance: give them the win before they buy
- State, Story, Solution: current state → story → new solution

EMOTIONAL TRIGGERS:
- Trust through transparency: shows the real process not just the highlight reel
- Identity: "people like us do things like this"
- Disarming: lowers their guard before engaging their desire

TONE: Relaxed. Smart. Like the cool older brother who figured it all out
and wants to share it — but in a chill way, not a lecture.

STRATEGY AGENT: Content sequence before launch. Warm up the audience for weeks before asking for the sale. Result in advance thinking.

CONTENT AGENT: Give real value in the content. Teach something useful. The content IS the pre-sell. Never tease — always deliver.

EMAIL AGENT: Casual subject lines. "Hey it's Frank." Story in the body. Lesson at the end. CTA feels like a natural next step.

LEAD AGENT: Score high on people who have consumed content. Warm leads convert at 3x cold. Pre-sold buyers need less closing.

EXAMPLE PHRASES:
"Here's the deal..."
"Look, I'm gonna be straight with you."
"The best marketing doesn't feel like marketing."`,
  },
  {
    name:    'Seth Godin',
    summary: 'Permission marketing, tribes, remarkable ideas that spread.',
    content: `BRAND VOICE: SETH GODIN

CORE PHILOSOPHY:
Marketing is no longer about the stuff you make but the stories you tell.
Remarkable means worth making a remark about. If people don't talk about it, it's invisible.
Find your smallest viable audience. Lead them. The rest will follow.

WRITING STYLE:
- Short. Punchy. One idea per post. One idea per paragraph.
- No fluff. Every word has a job.
- Philosophical but practical — always ends with a so-what
- Asks questions instead of making statements
- Counter-intuitive takes that make you stop and think
- Simple language for complex ideas

SIGNATURE FRAMEWORKS:
- Permission Marketing: earn the privilege of delivering anticipated personal relevant messages
- The Purple Cow: be remarkable or be invisible
- Tribes: find your people, lead them, give them something to talk about
- The Dip: know when to push through and when to quit

EMOTIONAL TRIGGERS:
- Belonging: join the tribe of people who think differently
- Intellectual curiosity: "What if you looked at it this way..."
- Fear of average: safe is risky. Invisible is the real danger.

TONE: Calm. Wise. Like a thoughtful professor who asks the question
you never thought to ask. Never shouts. Always makes you think.

STRATEGY AGENT: Smallest viable audience first. Remarkable idea before any spend. Word of mouth is the strategy.

CONTENT AGENT: One idea. Expressed simply. With a point at the end. Never try to cover everything — say one thing perfectly.

EMAIL AGENT: Short emails win. One idea. One link. One ask. Respect inbox time. Build permission before using it.

LEAD AGENT: Score high on people who are already believers. Talkers and connectors are worth 10x passive buyers.

EXAMPLE PHRASES:
"Safe is risky."
"People like us do things like this."
"If you are not making a remark, it will be ignored."`,
  },
  {
    name:    'Grant Cardone',
    summary: '10X thinking, massive action, dominate never compete.',
    content: `BRAND VOICE: GRANT CARDONE

CORE PHILOSOPHY:
Average is a failing plan. 10X everything — your goals, your actions, your thinking.
Never compete. Dominate. Own the space completely or don't enter it.
Money is not the goal — freedom is the goal. Money is the vehicle.

WRITING STYLE:
- LOUD. High energy. Every sentence feels urgent.
- Big numbers. Big goals. Big claims backed by big proof.
- Repetition for emphasis: "10X. 10X. 10X."
- Challenges the reader's ambition level directly
- "Let me ask you something..." to pull them in
- Action-first language: do it now, think about it later

SIGNATURE FRAMEWORKS:
- The 10X Rule: set goals 10x bigger and take 10x more action
- Obsession: average people have interests, successful people are obsessed
- Dominate: be everywhere all the time in your market
- Massive Action: never one approach, always 10 approaches simultaneously

EMOTIONAL TRIGGERS:
- Pride: 10X people are a special category and you can join
- Dissatisfaction with average: mediocrity is a choice and a bad one
- FOMO: while you're playing small, others are playing big

TONE: High voltage. Like a motivational speaker crossed with a drill
sergeant who genuinely wants you to win but will not accept your excuses.

STRATEGY AGENT: Massive action across every channel simultaneously. Never one approach. 10X the budget, 10X the content, 10X the outreach.

CONTENT AGENT: High energy. Big claims. Backed by numbers and proof. Never subtle. Be the loudest most confident voice in the market.

EMAIL AGENT: Subject lines demand attention. Body is urgent. Every email has a deadline. Multiple CTAs not just one.

LEAD AGENT: Score high on people with big ambitions who feel held back. Low tolerance for people playing small by choice.

EXAMPLE PHRASES:
"Average is a failing plan."
"Be obsessed or be average."
"Your problem is not the economy. Your problem is your thinking."`,
  },
  {
    name:    'Zig Ziglar',
    summary: 'Relationship-first, classic values-based selling, emotional storytelling.',
    content: `BRAND VOICE: ZIG ZIGLAR

CORE PHILOSOPHY:
You can have everything in life you want if you will just help other people get what they want.
People buy emotionally and justify logically. Sell to the heart first.
Sales is not something you do TO people. It's something you do FOR people.

WRITING STYLE:
- Warm. Personal. Like a trusted friend.
- Story-driven — every point is illustrated with a story
- Classic values: family, legacy, faith, hard work
- Positive and affirming — elevates the reader not diminishes them
- Uses questions to lead: "Can I ask you something important?"
- Avoids manipulation — uses genuine connection instead

SIGNATURE FRAMEWORKS:
- The Relationship Sale: trust before transaction, always
- Emotional Logic: sell the emotion, justify with logic
- The Need for the Product: help them see how they need this
- You University: your knowledge is your greatest asset

EMOTIONAL TRIGGERS:
- Family and legacy: do this for the people who depend on you
- Pride in doing the right thing
- Hope: your best days are still ahead of you
- Belonging to a community of achievers

TONE: Warm. Encouraging. Wise. Like a mentor who believes in you more
than you believe in yourself. Southern charm with deep substance.

STRATEGY AGENT: Relationship-first strategy. Community and referral as primary channels. Long-term brand trust over short-term conversion.

CONTENT AGENT: Always a lesson in every piece. Uplift and inspire. Connect the offer to something bigger than the price.

EMAIL AGENT: Personal. Warm. Like a letter from a mentor. Always ends with encouragement not just a CTA.

LEAD AGENT: Score high on people with family obligations and long-term thinking. Connect the purchase to their values not just their goals.

EXAMPLE PHRASES:
"You can have everything in life you want if you help others get what they want."
"People often say motivation doesn't last. Neither does bathing — that's why we recommend it daily."
"You were born to win but you must plan to win and prepare to win."`,
  },
];

const FILTER_TABS = ['all', 'brand_voice', ...AGENTS.slice(1)];

const empty = {
  agentType: 'all',
  category:  'audience_insight',
  title:     '',
  content:   '',
  priority:  2,
  tags:      '',
};

export default function KnowledgePage() {
  const { showToast } = useToast();
  const [items,      setItems]      = useState([]);
  const [form,       setForm]       = useState(empty);
  const [editing,    setEditing]    = useState(null);
  const [filter,     setFilter]     = useState('all');
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [activeTab,  setActiveTab]  = useState('entries'); // 'entries' | 'brand-voices'
  const [addingVoice, setAddingVoice] = useState(null);   // template being added

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter === 'brand_voice') {
        params.category = 'brand_voice';
      } else if (filter !== 'all') {
        params.agentType = filter;
      }
      const { data } = await api.get('/knowledge', { params });
      setItems(data.items || []);
    } catch {
      showToast('⚠ Failed to load knowledge base');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, [filter]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title || !form.content) return showToast('⚠ Title and content are required');
    setSaving(true);
    try {
      const payload = {
        ...form,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()) : [],
      };
      if (editing) {
        await api.put(`/knowledge/${editing}`, payload);
        showToast('✓ Knowledge updated');
      } else {
        await api.post('/knowledge', payload);
        showToast('✓ Knowledge added — Claude will use this from now on');
      }
      setForm(empty);
      setEditing(null);
      fetchItems();
    } catch {
      showToast('⚠ Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item) => {
    setEditing(item._id);
    setForm({ ...item, tags: item.tags?.join(', ') || '' });
    setActiveTab('entries');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/knowledge/${id}`);
      showToast('✓ Deleted');
      fetchItems();
    } catch {
      showToast('⚠ Delete failed');
    }
  };

  const handleToggle = async (item) => {
    try {
      await api.put(`/knowledge/${item._id}`, { isActive: !item.isActive });
      fetchItems();
    } catch {
      showToast('⚠ Update failed');
    }
  };

  // Add a brand voice template to KB
  const handleAddVoice = async (template) => {
    setAddingVoice(template.name);
    try {
      await api.post('/knowledge', {
        agentType: 'all',
        category:  'brand_voice',
        title:     `Brand voice — ${template.name}`,
        content:   template.content,
        priority:  3,
        tags:      ['brand-voice', template.name.toLowerCase().replace(/\s+/g, '-')],
        isActive:  true,
      });
      showToast(`✓ ${template.name} brand voice added — select it from any agent page`);
      fetchItems();
    } catch {
      showToast('⚠ Failed to add brand voice');
    } finally {
      setAddingVoice(null);
    }
  };

  const brandVoiceItems = items.filter(i => i.category === 'brand_voice');
  const otherItems      = items.filter(i => i.category !== 'brand_voice');

  const displayItems = filter === 'brand_voice'
    ? brandVoiceItems
    : filter === 'all'
    ? items
    : otherItems.filter(i => filter === 'all' || i.agentType === filter || i.agentType === 'all');

  return (
    <>
      <Topbar title="Knowledge Base" subtitle="Teach Claude what works for Elev8 Montreal" />
      <div className="page-content fade-in">

        {/* ── Stats ── */}
        <div className="dash-grid" style={{ gridTemplateColumns: 'repeat(5,1fr)', marginBottom: 22 }}>
          {[
            { label: 'Total entries',  value: items.length },
            { label: 'Active',         value: items.filter(i => i.isActive).length },
            { label: 'Brand voices',   value: brandVoiceItems.length, gold: true },
            { label: 'Proven hooks',   value: items.filter(i => i.category === 'proven_hook').length },
            { label: 'Campaign data',  value: items.filter(i => i.category === 'campaign_result').length },
          ].map((s) => (
            <div key={s.label} className={`stat-card${s.gold ? ' gold' : ''}`}>
              <div className="s-label">{s.label}</div>
              <div className="s-value">{s.value}</div>
            </div>
          ))}
        </div>

        {/* ── Top tabs: Entries | Brand Voices ── */}
        <div className="agent-tabs" style={{ marginBottom: 22 }}>
          <div className={`agent-tab${activeTab === 'entries' ? ' active' : ''}`}
            onClick={() => setActiveTab('entries')}>
            📚 Knowledge Entries
          </div>
          <div className={`agent-tab${activeTab === 'brand-voices' ? ' active' : ''}`}
            onClick={() => setActiveTab('brand-voices')}>
            🎙️ Brand Voices
            {brandVoiceItems.length > 0 && (
              <span style={{ marginLeft: 6, background: 'rgba(201,151,58,0.2)', color: '#C9973A', fontSize: 10, padding: '1px 6px', borderRadius: 10, border: '1px solid rgba(201,151,58,0.35)' }}>
                {brandVoiceItems.length}
              </span>
            )}
          </div>
        </div>

        {/* ════════════════════════════════════
            BRAND VOICES TAB
        ════════════════════════════════════ */}
        {activeTab === 'brand-voices' && (
          <div>

            {/* Explanation banner */}
            <div style={{ background: 'rgba(201,151,58,0.06)', border: '1px solid rgba(201,151,58,0.2)', borderRadius: 10, padding: '14px 18px', marginBottom: 22, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>🎙️</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
                  What are Brand Voices?
                </div>
                <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.7 }}>
                  Brand voices are writing style profiles from world-class marketing experts. When a client selects a brand voice on any agent page, every output instantly shifts to match that expert's frameworks, tone, language patterns, and selling psychology. Add one below and select it from any agent page before generating.
                </div>
              </div>
            </div>

            {/* ── Already added brand voices ── */}
            {brandVoiceItems.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 12, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                  Your brand voices
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {brandVoiceItems.map((item) => (
                    <div key={item._id} className="card" style={{
                      padding: '14px 18px',
                      opacity: item.isActive ? 1 : 0.5,
                      borderLeft: `3px solid #C9973A`,
                      borderRadius: '0 var(--r) var(--r) 0',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <span style={{ fontSize: 13, fontWeight: 600 }}>
                              {item.title.replace(/^brand voice\s*[—\-]\s*/i, '')}
                            </span>
                            <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: 'rgba(201,151,58,0.12)', color: '#C9973A', border: '1px solid rgba(201,151,58,0.25)' }}>
                              Brand Voice
                            </span>
                            {item.isActive
                              ? <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: 'rgba(61,191,138,0.1)', color: '#3DBF8A', border: '1px solid rgba(61,191,138,0.25)' }}>Active</span>
                              : <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: 'var(--bg4)', color: 'var(--text3)', border: '1px solid var(--border)' }}>Disabled</span>
                            }
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                            {item.content.slice(0, 120)}…
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                          <button className="btn btn-ghost" style={{ fontSize: 11, padding: '4px 10px' }}
                            onClick={() => handleEdit(item)}>Edit</button>
                          <button className="btn btn-ghost" style={{ fontSize: 11, padding: '4px 10px' }}
                            onClick={() => handleToggle(item)}>
                            {item.isActive ? 'Disable' : 'Enable'}
                          </button>
                          <button className="btn btn-ghost"
                            style={{ fontSize: 11, padding: '4px 10px', color: '#E8714A', borderColor: '#E8714A' }}
                            onClick={() => handleDelete(item._id)}>Delete</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Template library ── */}
            <div style={{ fontSize: 12, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
              Add from template library
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12, marginBottom: 24 }}>
              {BRAND_VOICE_TEMPLATES.map((template) => {
                const alreadyAdded = brandVoiceItems.some(i =>
                  i.title.toLowerCase().includes(template.name.toLowerCase())
                );
                return (
                  <div key={template.name} className="card" style={{
                    padding: '16px 18px',
                    borderLeft: `3px solid #C9973A`,
                    borderRadius: '0 var(--r) var(--r) 0',
                    opacity: alreadyAdded ? 0.6 : 1,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
                          {template.name}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.6 }}>
                          {template.summary}
                        </div>
                      </div>
                      <button
                        className="btn btn-ghost"
                        style={{
                          fontSize: 11, padding: '5px 12px', flexShrink: 0,
                          color:        alreadyAdded ? '#3DBF8A' : 'var(--text)',
                          borderColor:  alreadyAdded ? '#3DBF8A' : 'var(--border)',
                          opacity: addingVoice === template.name ? 0.5 : 1,
                        }}
                        onClick={() => !alreadyAdded && handleAddVoice(template)}
                        disabled={alreadyAdded || addingVoice === template.name}
                      >
                        {alreadyAdded
                          ? '✓ Added'
                          : addingVoice === template.name
                          ? 'Adding…'
                          : '+ Add'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Custom brand voice form ── */}
            <div style={{ fontSize: 12, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
              Or add a custom brand voice
            </div>
            <form className="card" onSubmit={handleSave}>
              <div className="form-card-title">
                Custom Brand Voice <span className="badge">Claude will write in this style</span>
              </div>
              <div className="field">
                <label>Expert / Guru name</label>
                <input
                  value={form.category === 'brand_voice' ? form.title.replace(/^brand voice\s*[—\-]\s*/i, '') : ''}
                  onChange={(e) => setForm(f => ({
                    ...f,
                    category: 'brand_voice',
                    agentType: 'all',
                    priority: 3,
                    title: `Brand voice — ${e.target.value}`,
                  }))}
                  placeholder="e.g. Tony Robbins"
                />
              </div>
              <div className="field">
                <label>Brand voice profile — writing style, tone, frameworks, phrases</label>
                <textarea
                  rows={8}
                  value={form.category === 'brand_voice' ? form.content : ''}
                  onChange={(e) => setForm(f => ({ ...f, category: 'brand_voice', agentType: 'all', priority: 3, content: e.target.value }))}
                  placeholder={`BRAND VOICE: [NAME]

CORE PHILOSOPHY:
What they believe about marketing and selling...

WRITING STYLE:
- How they write sentences
- What they avoid
- Signature patterns

SIGNATURE FRAMEWORKS:
- The framework name: how it works
- Another framework: how to apply it

TONE:
Describe the tone in 2-3 sentences...

STRATEGY AGENT: How this voice shapes campaign strategy...
CONTENT AGENT: How this voice shapes copy and ads...
EMAIL AGENT: How this voice shapes email sequences...
LEAD AGENT: How this voice shapes lead qualification...

EXAMPLE PHRASES:
"Signature phrase they always say"
"Another phrase they're known for"`}
                />
              </div>
              <button className="btn btn-primary" type="submit" disabled={saving || !form.title || !form.content}>
                {saving ? 'Saving…' : '+ Add Custom Brand Voice'}
              </button>
            </form>
          </div>
        )}

        {/* ════════════════════════════════════
            KNOWLEDGE ENTRIES TAB
        ════════════════════════════════════ */}
        {activeTab === 'entries' && (
          <div className="agent-layout">

            {/* ── Add / Edit Form ── */}
            <form className="card" onSubmit={handleSave}>
              <div className="form-card-title">
                {editing ? 'Edit entry' : 'Add knowledge'}
                <span className="badge">Claude will learn this</span>
              </div>

              <div className="field-row">
                <div className="field">
                  <label>Applies to agent</label>
                  <select value={form.agentType} onChange={set('agentType')}>
                    {AGENTS.map(a => (
                      <option key={a} value={a}>
                        {a === 'all' ? 'All agents' : a.charAt(0).toUpperCase() + a.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Category</label>
                  <select value={form.category} onChange={set('category')}>
                    {CATEGORIES.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Brand voice tip */}
              {form.category === 'brand_voice' && (
                <div style={{ background: 'rgba(201,151,58,0.08)', border: '1px solid rgba(201,151,58,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 12, color: 'var(--text3)', lineHeight: 1.6 }}>
                  💡 For brand voices, use the title format <strong style={{ color: 'var(--text)' }}>"Brand voice — [Name]"</strong> so it appears correctly in the agent selectors. Or switch to the <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C9973A', fontSize: 12, padding: 0, textDecoration: 'underline' }} onClick={() => setActiveTab('brand-voices')}>Brand Voices tab</button> to use pre-built templates.
                </div>
              )}

              <div className="field">
                <label>Title</label>
                <input
                  value={form.title}
                  onChange={set('title')}
                  placeholder={
                    form.category === 'brand_voice'
                      ? 'e.g. Brand voice — Alex Hormozi'
                      : 'e.g. Montreal realtors respond to ROI numbers'
                  }
                />
              </div>

              <div className="field">
                <label>Content — what Claude should know</label>
                <textarea
                  rows={5}
                  value={form.content}
                  onChange={set('content')}
                  placeholder={
                    form.category === 'brand_voice'
                      ? 'Describe the writing style, tone, frameworks, emotional triggers, and example phrases...'
                      : form.category === 'proven_hook'
                      ? 'e.g. "Are you still trading time for money?" — 4.2% CTR on cold Montreal realtors aged 35-50'
                      : form.category === 'campaign_result'
                      ? 'e.g. Week 1 Meta campaign: CPL $4.20, 47 leads, 12 booked calls, 3 tickets sold'
                      : form.category === 'objection'
                      ? 'e.g. Most common: "I need to check with my wife" — use scarcity: only 14 seats left'
                      : form.category === 'local_insight'
                      ? 'e.g. Montreal audience prefers French subject lines — 23% higher open rate than English'
                      : 'Enter what Claude should know and apply...'
                  }
                />
              </div>

              <div className="field-row">
                <div className="field">
                  <label>Priority</label>
                  <select value={form.priority} onChange={set('priority')}>
                    <option value={1}>Low</option>
                    <option value={2}>Medium</option>
                    <option value={3}>High — always include</option>
                  </select>
                </div>
                <div className="field">
                  <label>Tags (comma separated)</label>
                  <input value={form.tags} onChange={set('tags')} placeholder="realtor, montreal, cold-audience" />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-primary" type="submit" disabled={saving}>
                  {saving ? 'Saving…' : editing ? '✓ Update entry' : '+ Add to knowledge base'}
                </button>
                {editing && (
                  <button className="btn btn-ghost" type="button"
                    onClick={() => { setEditing(null); setForm(empty); }}>
                    Cancel
                  </button>
                )}
              </div>
            </form>

            {/* ── List ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

              {/* Filter tabs */}
              <div className="agent-tabs" style={{ marginBottom: 4, flexWrap: 'wrap' }}>
                {[
                  { value: 'all',        label: 'All' },
                  { value: 'brand_voice', label: '🎙️ Brand Voices' },
                  { value: 'strategy',   label: 'Strategy' },
                  { value: 'content',    label: 'Content' },
                  { value: 'email',      label: 'Email' },
                  { value: 'leads',      label: 'Leads' },
                ].map((f) => (
                  <div key={f.value} className={`agent-tab${filter === f.value ? ' active' : ''}`}
                    onClick={() => setFilter(f.value)}>
                    {f.label}
                  </div>
                ))}
              </div>

              {loading && (
                <div style={{ color: 'var(--text3)', fontSize: 13, padding: 16 }}>Loading…</div>
              )}

              {!loading && displayItems.length === 0 && (
                <div className="card" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text3)' }}>
                  <div style={{ fontSize: 32, opacity: 0.4, marginBottom: 12 }}>🧠</div>
                  <div style={{ fontSize: 14, marginBottom: 6 }}>No entries found</div>
                  <div style={{ fontSize: 12 }}>
                    {filter === 'brand_voice'
                      ? 'Go to the Brand Voices tab to add a brand voice.'
                      : 'Add your first entry to start training Claude on your specific market.'}
                  </div>
                </div>
              )}

              {displayItems.map((item) => (
                <div key={item._id} className="card" style={{
                  padding: '14px 18px',
                  opacity: item.isActive ? 1 : 0.5,
                  borderLeft: `3px solid ${CATEGORY_COLORS[item.category] || 'var(--border)'}`,
                  borderRadius: '0 var(--r) var(--r) 0',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{item.title}</span>
                        <span style={{
                          fontSize: 10, padding: '2px 7px', borderRadius: 4,
                          background: item.category === 'brand_voice' ? 'rgba(201,151,58,0.12)' : 'var(--bg4)',
                          color: CATEGORY_COLORS[item.category] || 'var(--text3)',
                          border: `1px solid ${item.category === 'brand_voice' ? 'rgba(201,151,58,0.25)' : 'var(--border)'}`,
                        }}>
                          {CATEGORIES.find(c => c.value === item.category)?.label}
                        </span>
                        <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: 'var(--bg4)', color: 'var(--text3)', border: '1px solid var(--border)' }}>
                          {item.agentType === 'all' ? 'All agents' : item.agentType}
                        </span>
                        {item.priority === 3 && (
                          <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: 'rgba(201,151,58,0.15)', color: '#E8B84B', border: '1px solid rgba(201,151,58,0.3)' }}>
                            High priority
                          </span>
                        )}
                        {!item.isActive && (
                          <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: 'var(--bg4)', color: 'var(--text3)', border: '1px solid var(--border)' }}>
                            Disabled
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>
                        {item.content.length > 200
                          ? item.content.slice(0, 200) + '…'
                          : item.content}
                      </div>
                      {item.tags?.length > 0 && (
                        <div className="tag-row" style={{ marginTop: 8 }}>
                          {item.tags.map(t => <span key={t} className="tag-pill">{t}</span>)}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                      <button className="btn btn-ghost" style={{ fontSize: 11, padding: '4px 10px' }}
                        onClick={() => handleEdit(item)}>Edit</button>
                      <button className="btn btn-ghost" style={{ fontSize: 11, padding: '4px 10px' }}
                        onClick={() => handleToggle(item)}>
                        {item.isActive ? 'Disable' : 'Enable'}
                      </button>
                      <button className="btn btn-ghost"
                        style={{ fontSize: 11, padding: '4px 10px', color: '#E8714A', borderColor: '#E8714A' }}
                        onClick={() => handleDelete(item._id)}>Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </>
  );
}