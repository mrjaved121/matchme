const UPDATED = "July 27, 2026";

const SECTIONS: { heading: string; body: string }[] = [
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

export default function PrivacyPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-16">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-foreground">Privacy Policy</h1>
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
