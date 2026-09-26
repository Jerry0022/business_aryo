const MESSAGES: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "E-Mail oder Passwort ist falsch.",
  INVALID_PASSWORD: "Das aktuelle Passwort ist falsch.",
  INVALID_EMAIL: "Bitte geben Sie eine gültige E-Mail-Adresse ein.",
  USER_ALREADY_EXISTS: "Für diese E-Mail-Adresse existiert bereits ein Konto.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "Für diese E-Mail-Adresse existiert bereits ein Konto.",
  PASSWORD_TOO_SHORT: "Das Passwort ist zu kurz (mindestens 10 Zeichen).",
  PASSWORD_TOO_LONG: "Das Passwort ist zu lang.",
  BANNED_USER: "Dieses Konto ist gesperrt. Bitte wenden Sie sich an den Administrator.",
  YOU_CANNOT_BAN_YOURSELF: "Sie können sich nicht selbst sperren.",
  YOU_CANNOT_REMOVE_YOURSELF: "Sie können Ihr eigenes Konto nicht löschen.",
  TOO_MANY_REQUESTS: "Zu viele Versuche. Bitte warten Sie einen Moment.",
};

/** Maps a Better Auth error (code/status/message) to a German, user-facing message. */
export function authErrorMessage(error: { code?: string; message?: string; status?: number } | null | undefined): string {
  if (!error) return "Unbekannter Fehler.";
  if (error.code && MESSAGES[error.code]) return MESSAGES[error.code]!;
  if (error.status === 429) return MESSAGES.TOO_MANY_REQUESTS!;
  if (error.status === 403 && error.message) return error.message;
  return error.message || "Die Aktion ist fehlgeschlagen. Bitte versuchen Sie es erneut.";
}
