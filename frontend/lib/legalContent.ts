// Single source of truth for the in-app legal screens. Keep this in sync
// with dashboard/src/app/privacy/page.tsx and dashboard/src/app/terms/page.tsx
// (duplicated there since frontend/dashboard don't share a package).

export const LEGAL_UPDATED = "July 27, 2026";

export const PRIVACY_SECTIONS: { heading: string; body: string }[] = [
  {
    heading: "What we collect",
    body:
      "Account basics: your email address, first name, and birthdate (to confirm you're 18+). " +
      "Profile details: gender, who you're interested in, your orientation (optional), a bio, city, " +
      "interest tags, what you're looking for, and optional details like height, job, education, and " +
      "smoking/drinking habits. Photos: your profile photos, and a verification selfie if you choose to " +
      "verify your account. Activity: messages you send during a timed date or in an ongoing match chat, " +
      "when you join the matching queue, and reports or blocks you file. Device info: a push notification " +
      "token, once you enable notifications.",
  },
  {
    heading: "Why we collect it",
    body:
      "To create your profile and match you with compatible people. To run the live queue and timed date " +
      "sessions. To deliver messages between you and your matches in real time. To review reports, verify " +
      "photos, and keep the community safe. To send you notifications you've opted into. We do not sell " +
      "your personal data, and we do not use your data to train third-party AI models.",
  },
  {
    heading: "Who can see what",
    body:
      "Your profile photos, first name, bio, and interest tags are visible to other active users you're " +
      "matched or queued with. Your messages are only visible to you and the specific match you sent them " +
      "to. Your verification selfie is private — only you and our moderation team can see it, and it's " +
      "never shown to other users. Your email, birthdate, and account status are never shown to other " +
      "users.",
  },
  {
    heading: "How long we keep it",
    body:
      "We keep your data for as long as your account is active. If you delete your account, your profile, " +
      "photos, matches, and messages are permanently deleted. Reports you've filed or been the subject of " +
      "may be retained in an anonymized form for safety and legal-compliance purposes.",
  },
  {
    heading: "Your choices",
    body:
      "You can edit or remove most profile details at any time from your profile and settings. You can " +
      "pause your account to hide it from new matchmaking without deleting it. You can delete your account " +
      "and all associated data at any time from Settings → Privacy & account — this is immediate and " +
      "irreversible. You can turn notification categories on or off individually.",
  },
  {
    heading: "Where your data lives",
    body:
      "Your data is stored with our infrastructure provider (Supabase) using industry-standard encryption " +
      "in transit and at rest. Access to raw account data is restricted to essential team members handling " +
      "safety, support, and moderation.",
  },
  {
    heading: "Contact",
    body:
      "Questions about this policy or your data can be sent through the in-app report/support flow, or to " +
      "the contact address listed on your app store listing.",
  },
];

export const TERMS_SECTIONS: { heading: string; body: string }[] = [
  {
    heading: "Eligibility",
    body:
      "You must be at least 18 years old to create a Spark account. By signing up you confirm the " +
      "birthdate you provide is accurate. We may suspend or ban accounts we reasonably believe belong to " +
      "someone under 18.",
  },
  {
    heading: "Your account",
    body:
      "You're responsible for the activity on your account and for keeping your sign-in access secure. " +
      "Profile photos must be real, recent photos of you — impersonation, stolen photos, and catfishing " +
      "are not allowed and will result in a ban. One account per person.",
  },
  {
    heading: "How Spark works",
    body:
      "You join a live queue and are matched instantly with a compatible person for a short, timed text " +
      "chat. At the end of the timer, both people privately decide yes or no — a mutual yes unlocks an " +
      "ongoing chat. We don't guarantee a match, a response time, or the accuracy of any other user's " +
      "profile.",
  },
  {
    heading: "Conduct",
    body:
      "Harassment, hate speech, threats, nudity, spam, and soliciting money or services are prohibited and " +
      "may result in immediate suspension or a ban. Report anything that violates these terms — we review " +
      "every report. Blocking a user immediately ends any active session with them and prevents future " +
      "matching.",
  },
  {
    heading: "Verification",
    body:
      "Photo verification is optional and reviewed manually by our team, comparing a live selfie to your " +
      "profile photo. A verified badge indicates the selfie matched at the time of review — it is not a " +
      "background check or an endorsement of the user's identity, intentions, or safety.",
  },
  {
    heading: "Termination",
    body:
      "You can delete your account at any time from Settings. We may suspend or terminate accounts that " +
      "violate these terms, engage in fraud or abuse, or pose a safety risk to other users, with or without " +
      "notice.",
  },
  {
    heading: "Disclaimer",
    body:
      "Spark is provided \"as is.\" We work to keep the platform safe and available but don't guarantee " +
      "uninterrupted service, and we're not responsible for the conduct of other users on or off the app. " +
      "Meeting people always carries inherent risk — use good judgment, especially before meeting someone " +
      "in person.",
  },
  {
    heading: "Changes",
    body:
      "We may update these terms as the product changes. Continued use of Spark after an update means " +
      "you accept the revised terms.",
  },
];
