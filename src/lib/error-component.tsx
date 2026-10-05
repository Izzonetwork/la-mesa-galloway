import type { ErrorComponentProps } from "@tanstack/react-router";

export function AppErrorComponent({ error }: ErrorComponentProps) {
  const message =
    error instanceof Error && error.message
      ? error.message
      : "An unexpected error occurred. Try reloading the page.";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-bg px-6 text-center text-fg">
      <h1 className="font-display text-3xl">Something went wrong</h1>
      <p className="max-w-md text-sm break-words text-muted">{message}</p>
      <a href="/" className="btn btn-fill mt-4">
        Back to La Mesa
      </a>
    </main>
  );
}
