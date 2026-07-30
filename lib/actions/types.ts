// Every Server Action returns this shape rather than throwing, so client
// components can show a generic, user-facing error message while the real
// error (query failure, constraint violation) is logged server-side only --
// never surfaced to the browser.
export type ActionResult = { success: true } | { success: false; error: string };
