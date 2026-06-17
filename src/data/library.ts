export type Kind = "skill" | "role" | "project" | "achievement" | "cert";
export interface Track { id: string; title: string; subtitle: string; kind: Kind; durationSec: number; plays: number; detail: string; gradient: string; }
export interface Playlist { id: string; title: string; kind: "EP" | "LP" | "Playlist"; description: string; gradient: string; trackIds: string[]; }
export interface Genre { id: string; title: string; gradient: string; }

const G = {
  green: "linear-gradient(135deg,#1ed760,#0a5)", pink: "linear-gradient(135deg,#ff4d6d,#7b2ff7)",
  blue: "linear-gradient(135deg,#36c6ff,#2536ff)", gold: "linear-gradient(135deg,#f7971e,#ffd200)",
  purple: "linear-gradient(135deg,#8e2de2,#4a00e0)", liked: "linear-gradient(160deg,#4a00e0,#b3b3ff)",
};

export const artist = {
  name: "Darshil Jain", tagline: "Strategy & Operations · BBA (B&I) · CGPA 9.39",
  monthlyListeners: 98_400, gradient: G.green,
  about: "Business, consulting and operations builder. Three internships, four consulting/analytics projects, founder of an 80+ member club, and a national-level case competitor. Maharaja Surajmal Institute, GGSIPU.",
};

export const tracks: Track[] = [
  { id: "s1", title: "Market Research", subtitle: "Top Skills", kind: "skill", durationSec: 232, plays: 920000, detail: "Primary & secondary research, sizing, synthesis.", gradient: G.pink },
  { id: "s2", title: "Competitive Analysis", subtitle: "Top Skills", kind: "skill", durationSec: 215, plays: 900000, detail: "Benchmarking, positioning, teardown.", gradient: G.pink },
  { id: "s3", title: "Strategic Analysis", subtitle: "Top Skills", kind: "skill", durationSec: 248, plays: 880000, detail: "Frameworks to recommendations.", gradient: G.pink },
  { id: "s4", title: "Stakeholder Management", subtitle: "Top Skills", kind: "skill", durationSec: 201, plays: 870000, detail: "Leadership comms, alignment.", gradient: G.pink },
  { id: "s5", title: "Excel · Notion", subtitle: "Top Skills", kind: "skill", durationSec: 190, plays: 900000, detail: "Dashboards, trackers, ops systems.", gradient: G.pink },
  { id: "s6", title: "Business Development", subtitle: "Top Skills", kind: "skill", durationSec: 205, plays: 850000, detail: "Upsell, renewals, monetization.", gradient: G.pink },
  { id: "r1", title: "Operations Intern", subtitle: "Figmenta · Jan–Feb 2026", kind: "role", durationSec: 260, plays: 500000, detail: "Centralized tracker for 35+ projects / 15+ members across Asia; screened 500+ resumes, onboarded 5+.", gradient: G.blue },
  { id: "r2", title: "Operations Intern", subtitle: "PSR Compliance · 2025", kind: "role", durationSec: 244, plays: 320000, detail: "Compliance for 70+ clients during a transition; consulting + upsell improving retention.", gradient: G.blue },
  { id: "r3", title: "Human Resource Intern", subtitle: "MJ Marketing · 2025", kind: "role", durationSec: 236, plays: 300000, detail: "Analyzed 500+ candidates; ran 100+ interviews, assessed 300+.", gradient: G.blue },
  { id: "p1", title: "ZautoAI Consulting", subtitle: "Projects", kind: "project", durationSec: 268, plays: 410000, detail: "GTM/pricing/positioning for an AI health startup; finalist at IIHMR Saamarthya 5.0.", gradient: G.purple },
  { id: "p2", title: "IIT-G Capstone", subtitle: "Projects", kind: "project", durationSec: 255, plays: 390000, detail: "Telemedicine no-show intervention; Top 10%.", gradient: G.purple },
  { id: "p3", title: "Haldiram's Expansion", subtitle: "Projects", kind: "project", durationSec: 242, plays: 350000, detail: "International market-entry case; publication-ready.", gradient: G.purple },
  { id: "p4", title: "Zomato Dashboard", subtitle: "Projects", kind: "project", durationSec: 228, plays: 330000, detail: "Looker Studio dashboard, 5+ metrics.", gradient: G.purple },
  { id: "a1", title: "IIM-B BPlan Finalist", subtitle: "Achievements", kind: "achievement", durationSec: 210, plays: 270000, detail: "National Business Plan Championship — IIM Bangalore × MakeIntern.", gradient: G.gold },
  { id: "a2", title: "IIM-C Product Decode — 4th", subtitle: "Achievements", kind: "achievement", durationSec: 198, plays: 250000, detail: "4th nationally — IIM Calcutta.", gradient: G.gold },
  { id: "a3", title: "BPlan Showdown — Winner", subtitle: "Achievements", kind: "achievement", durationSec: 205, plays: 260000, detail: "1st place.", gradient: G.gold },
  { id: "a4", title: "IIT-G Consulting — Top 10%", subtitle: "Achievements", kind: "achievement", durationSec: 192, plays: 240000, detail: "Winter Consulting Program.", gradient: G.gold },
  { id: "c1", title: "Hult Prize Bootcamp", subtitle: "Certifications", kind: "cert", durationSec: 180, plays: 120000, detail: "Global Entrepreneurship Bootcamp, IIT Bombay — 2026.", gradient: G.green },
  { id: "c2", title: "Winter Consulting Program", subtitle: "Certifications", kind: "cert", durationSec: 175, plays: 110000, detail: "2025.", gradient: G.green },
  { id: "c3", title: "BI & Data Analysis", subtitle: "Certifications", kind: "cert", durationSec: 185, plays: 130000, detail: "IIM Bangalore — 2024.", gradient: G.green },
];

export const playlists: Playlist[] = [
  { id: "experience", title: "Experience", kind: "EP", description: "Internships on heavy rotation.", gradient: G.blue, trackIds: ["r1", "r2", "r3"] },
  { id: "projects", title: "Projects", kind: "LP", description: "Consulting & analytics, full length.", gradient: G.purple, trackIds: ["p1", "p2", "p3", "p4"] },
  { id: "skills", title: "Top Skills", kind: "Playlist", description: "The greatest hits.", gradient: G.pink, trackIds: ["s1", "s2", "s3", "s4", "s5", "s6"] },
  { id: "certs", title: "Certifications", kind: "EP", description: "Bonus tracks.", gradient: G.green, trackIds: ["c1", "c2", "c3"] },
];

export const likedTrackIds = ["a1", "a2", "a3", "a4"];

export const genres: Genre[] = [
  { id: "skills", title: "Skills", gradient: G.pink },
  { id: "experience", title: "Experience", gradient: G.blue },
  { id: "projects", title: "Projects", gradient: G.purple },
  { id: "certs", title: "Certifications", gradient: G.green },
  { id: "liked", title: "Achievements", gradient: G.liked },
];

const map = new Map(tracks.map((t) => [t.id, t]));
export const trackById = (id: string): Track | undefined => map.get(id);

export const contact = { email: "darshijain0809@gmail.com", phone: "+91 9268264843", linkedin: "https://www.linkedin.com/in/darshil-jain08/" };
