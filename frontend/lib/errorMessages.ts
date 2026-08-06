// Backend error strings (Postgres constraint violations, RLS denials, etc.)
// are not something a user should ever see verbatim — they're meant for
// logs, not warm onboarding copy. Screens should catch the real error for
// their own logging/telemetry needs but show one of these instead.
export const SAVE_ERROR_MESSAGE = "Couldn't save that — please try again.";
export const LOAD_ERROR_MESSAGE = "Couldn't load that — please try again.";
export const ACTION_ERROR_MESSAGE = "Something went wrong — please try again.";
