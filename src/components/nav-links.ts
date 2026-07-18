/**
 * The canonical route list.
 *
 * Shared by the navigation, the 404 recovery page, and the sitemap so those three can
 * never drift out of sync and leave an unreachable or unlisted route.
 */

export interface NavLink {
  href: string;
  label: string;
  description: string;
  /** Which capability of the problem this route addresses. */
  group: "Nudges" | "Tracking" | "Coaching" | "Support";
}

export const NAV_LINKS: NavLink[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    description: "Your numbers, recent urges, and what would help now",
    group: "Tracking",
  },
  {
    href: "/airlock",
    label: "Airlock",
    description: "Route an urge through a deliberate pause",
    group: "Nudges",
  },
  {
    href: "/sos",
    label: "Craving SOS",
    description: "A spoken, guided session to ride out a craving",
    group: "Support",
  },
  {
    href: "/plans",
    label: "Plans",
    description: "Your if-then plans and how well each one works",
    group: "Coaching",
  },
  {
    href: "/checkin",
    label: "Daily check-in",
    description: "Mood, sleep, stress, and minutes",
    group: "Tracking",
  },
  {
    href: "/journal",
    label: "Journal",
    description: "Every urge you have logged, filterable",
    group: "Tracking",
  },
  {
    href: "/insights",
    label: "Insights",
    description: "Which triggers beat you, and at which hours",
    group: "Tracking",
  },
  {
    href: "/coach",
    label: "Coach",
    description: "Talk it through with a motivational-interviewing coach",
    group: "Coaching",
  },
  {
    href: "/future-self",
    label: "Future self",
    description: "A letter from you, five years on",
    group: "Coaching",
  },
  {
    href: "/settings",
    label: "Settings",
    description: "Your profile, data export, and reset",
    group: "Support",
  },
  {
    href: "/help",
    label: "Help & safety",
    description: "Crisis resources, limits, and the research behind each feature",
    group: "Support",
  },
];
