import { WakingUpNotice } from "./waking-up-notice";

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted ${className ?? ""}`} />;
}

/**
 * Route-level Suspense fallback: Next.js shows this automatically while page.tsx's async
 * Server Component is fetching, for both the first load of /aanbod and any navigation that
 * changes the URL (a new preset, a page turn, a sort). A skeleton in place of a blank area,
 * per the spec, plus a message that only appears after three seconds - Neon's cold start
 * after five minutes idle can take seconds, and a bare spinner that never explains itself
 * reads as broken.
 */
export default function AanbodLoading() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <div>
        <SkeletonBlock className="h-6 w-32" />
        <SkeletonBlock className="mt-2 h-4 w-96" />
      </div>

      <SkeletonBlock className="h-10 w-full" />

      <SkeletonBlock className="h-24 w-full" />

      <SkeletonBlock className="h-8 w-64" />

      <div className="overflow-hidden rounded-lg border">
        <SkeletonBlock className="h-9 w-full rounded-none" />
        {Array.from({ length: 10 }).map((_, index) => (
          <div key={index} className="border-t p-2">
            <SkeletonBlock className="h-6 w-full rounded-md" />
          </div>
        ))}
      </div>

      <WakingUpNotice />
    </div>
  );
}
