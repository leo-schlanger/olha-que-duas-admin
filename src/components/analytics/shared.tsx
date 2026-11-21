import type { ReactNode } from 'react';
import { ArrowDown, ArrowUp, Info } from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatChange, percentChange } from '../../lib/pecasAnalytics';

import { fmt } from './format';

/** ↑/↓ % against the previous period; «novo» when there was nothing before. */
export function ChangeBadge({ current, previous, className }: { current: number; previous: number; className?: string }) {
  const change = percentChange(current, previous);
  const text = formatChange(current, previous);
  if (change === null || Math.round(change) === 0) {
    return <span className={cn('text-xs text-muted-foreground whitespace-nowrap', className)}>{text}</span>;
  }
  const up = change > 0;
  const Icon = up ? ArrowUp : ArrowDown;
  return (
    <span
      className={cn('inline-flex items-center gap-0.5 text-xs font-medium whitespace-nowrap', up ? 'text-green-700' : 'text-red-700', className)}
      title={`Antes: ${fmt(previous)}`}
    >
      <Icon className="w-3 h-3" aria-hidden="true" />
      {text}
    </span>
  );
}

export function Hint({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
      <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="text-sm text-muted-foreground text-center py-6 px-2">{children}</p>;
}

export function ErrorState({ children, onRetry }: { children: ReactNode; onRetry?: () => void }) {
  return (
    <div className="text-sm text-center py-6 px-2 space-y-2">
      <p className="text-red-700">{children}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="text-vermelho underline underline-offset-2">
          Tentar de novo
        </button>
      )}
    </div>
  );
}

export function SkeletonRows({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3 animate-pulse" aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-5 bg-beige-medium rounded" />
      ))}
    </div>
  );
}

export function Bar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="h-2 bg-beige-medium rounded-full overflow-hidden">
      <div className="h-full bg-gradient-to-r from-vermelho to-vermelho-soft rounded-full" style={{ width: `${pct}%` }} />
    </div>
  );
}
