import { Ionicons } from "@expo/vector-icons";

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

// Matches design/stitch_just_spark_ui_kit/onboarding_interests/code.html's
// 17-option list and icons exactly.
export const INTEREST_OPTIONS: { label: string; value: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: "Travel", value: "travel", icon: "airplane-outline" },
  { label: "Coffee", value: "coffee", icon: "cafe-outline" },
  { label: "Music", value: "music", icon: "musical-notes-outline" },
  { label: "Fitness", value: "fitness", icon: "barbell-outline" },
  { label: "Food", value: "food", icon: "restaurant-outline" },
  { label: "Art", value: "art", icon: "color-palette-outline" },
  { label: "Gaming", value: "gaming", icon: "game-controller-outline" },
  { label: "Movies", value: "movies", icon: "film-outline" },
  { label: "Reading", value: "reading", icon: "book-outline" },
  { label: "Nature", value: "nature", icon: "leaf-outline" },
  { label: "Pets", value: "pets", icon: "paw-outline" },
  { label: "Photography", value: "photo", icon: "camera-outline" },
  { label: "Sports", value: "sports", icon: "baseball-outline" },
  { label: "Cooking", value: "cooking", icon: "flame-outline" },
  { label: "Wine", value: "wine", icon: "wine-outline" },
  { label: "Yoga", value: "yoga", icon: "body-outline" },
  { label: "Hiking", value: "hiking", icon: "walk-outline" },
];

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
