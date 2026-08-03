export const GENDER_OPTIONS = [
  { label: "Women", value: "female" },
  { label: "Men", value: "male" },
  { label: "Non-binary", value: "nonbinary" },
  { label: "Other", value: "other" },
];

export const LOOKING_FOR_OPTIONS = [
  { label: "Casual", value: "casual" },
  { label: "Long-term", value: "long_term" },
  { label: "Friends", value: "friends" },
  { label: "Not sure yet", value: "not_sure" },
];

export const ORIENTATION_OPTIONS = [
  "Straight", "Gay", "Lesbian", "Bisexual", "Pansexual", "Asexual", "Other",
].map((label) => ({ label, value: label.toLowerCase() }));

export const RELIGION_OPTIONS = [
  "Agnostic", "Atheist", "Buddhist", "Christian", "Hindu", "Jewish",
  "Muslim", "Sikh", "Spiritual", "Other", "Prefer not to say",
].map((label) => ({ label, value: label.toLowerCase().replace(/\s+/g, "_") }));

export const LANGUAGE_OPTIONS = [
  "English", "Spanish", "French", "German", "Portuguese", "Mandarin",
  "Arabic", "Hindi", "Urdu", "Japanese", "Korean", "Italian",
].map((label) => ({ label, value: label.toLowerCase() }));

export const INTEREST_OPTIONS = [
  "Travel", "Music", "Fitness", "Foodie", "Movies", "Reading",
  "Gaming", "Outdoors", "Art", "Dancing", "Coffee", "Pets",
].map((label) => ({ label, value: label.toLowerCase() }));

export const ICEBREAKER_PROMPTS = [
  "What's your most controversial food opinion?",
  "Window seat or aisle seat, and why does it matter so much to you?",
  "What's a skill you'd love to master but haven't started yet?",
  "Beach vacation or mountain cabin?",
  "What's the last thing that made you laugh out loud?",
  "Coffee person or tea person — defend your answer.",
  "What's a small thing that instantly makes your day better?",
  "If you could only eat one cuisine for the rest of your life, what is it?",
  "What's a movie or show you could rewatch endlessly?",
  "Early bird or night owl?",
  "What's something you're weirdly good at?",
  "Dream travel destination you haven't been to yet?",
];
