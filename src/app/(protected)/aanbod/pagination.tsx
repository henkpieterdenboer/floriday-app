import Link from "next/link";
import type { SearchFilters } from "@/features/supply-search/filters";
import { PAGE_SIZE } from "@/features/supply-search/queries";
import { buildHref, type ViewState } from "@/features/supply-search/view";
import { formatInteger } from "@/features/supply-search/format";
import { cn } from "@/lib/utils";

export function Pagination({ filters, view, total }: { filters: SearchFilters; view: ViewState; total: number }) {
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(filters.page, totalPages);

  const firstRow = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const lastRow = Math.min(page * PAGE_SIZE, total);

  function hrefFor(targetPage: number): string {
    return buildHref({ ...filters, page: targetPage }, view);
  }

  return (
    <div className="flex items-center justify-between text-sm text-muted-foreground">
      <span>
        Regel {formatInteger(firstRow)} t/m {formatInteger(lastRow)} van {formatInteger(total)}
      </span>
      <div className="flex items-center gap-2">
        <PageLink href={hrefFor(page - 1)} disabled={page <= 1}>
          Vorige
        </PageLink>
        <span>
          Pagina {formatInteger(page)} van {formatInteger(totalPages)}
        </span>
        <PageLink href={hrefFor(page + 1)} disabled={page >= totalPages}>
          Volgende
        </PageLink>
      </div>
    </div>
  );
}

function PageLink({ href, disabled, children }: { href: string; disabled: boolean; children: React.ReactNode }) {
  if (disabled) {
    return <span className="cursor-not-allowed rounded-lg border border-input px-2.5 py-1 opacity-50">{children}</span>;
  }
  return (
    <Link href={href} className={cn("rounded-lg border border-input px-2.5 py-1 hover:bg-muted")}>
      {children}
    </Link>
  );
}
