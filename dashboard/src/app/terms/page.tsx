const UPDATED = "July 27, 2026";

const SECTIONS: { heading: string; body: string }[] = [
  {
    heading: "Eligibility",
    body:
      "You must be at least 18 years old to create a MatchMe account. By signing up you confirm the " +
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
    heading: "How MatchMe works",
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
      "MatchMe is provided \"as is.\" We work to keep the platform safe and available but don't guarantee " +
      "uninterrupted service, and we're not responsible for the conduct of other users on or off the app. " +
      "Meeting people always carries inherent risk — use good judgment, especially before meeting someone " +
      "in person.",
  },
  {
    heading: "Changes",
    body:
      "We may update these terms as the product changes. Continued use of MatchMe after an update means " +
      "you accept the revised terms.",
  },
];

export default function TermsPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-16">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-foreground">Terms of Service</h1>
        <p className="text-sm text-foreground-secondary">Last updated {UPDATED}</p>
      </div>
      {SECTIONS.map((section) => (
        <div key={section.heading} className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-foreground">{section.heading}</h2>
          <p className="leading-7 text-foreground-secondary">{section.body}</p>
        </div>
      ))}
    </div>
  );
}
