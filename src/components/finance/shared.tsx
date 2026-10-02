import type { ReactNode, SelectHTMLAttributes } from 'react';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { cn } from '../../lib/utils';
import type { FinKind, FinTransaction } from '../../types/finance';
import { isOverdue } from '../../lib/finance';
import { lisbonToday } from '../../lib/scheduleDates';

/** Select nativo com o mesmo visual do Input (aceita opção vazia, ao contrário do Radix). */
export function NativeSelect({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Field({
  label,
  htmlFor,
  required,
  hint,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={htmlFor} className="text-charcoal font-medium">
        {label} {required && <span className="text-vermelho">*</span>}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function FormDialog({
  open,
  onOpenChange,
  title,
  saving,
  error,
  onSubmit,
  children,
  wide,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  saving: boolean;
  error?: string | null;
  onSubmit: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn('bg-cream border-beige-medium max-h-[90vh] overflow-y-auto', wide ? 'sm:max-w-[640px]' : 'sm:max-w-[480px]')}
      >
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-charcoal">{title}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          className="space-y-4 mt-2"
        >
          {children}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>
          )}
          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
              className="border-beige-medium hover:bg-beige-light"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving} className="bg-vermelho hover:bg-vermelho-dark text-white">
              {saving ? 'A guardar...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function KindBadge({ kind }: { kind: FinKind }) {
  return kind === 'income' ? (
    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Receita</span>
  ) : (
    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Despesa</span>
  );
}

export function StatusBadge({ tx }: { tx: FinTransaction }) {
  if (tx.status === 'paid') {
    return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-beige text-charcoal">Pago</span>;
  }
  if (isOverdue(tx)) {
    return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Em atraso</span>;
  }
  return tx.tx_date > lisbonToday() ? (
    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-sky-700">Previsto</span>
  ) : (
    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Vence hoje</span>
  );
}

/** Botões de escolha única, grandes e legíveis (em vez de um select). */
export function Choice<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string; tone?: 'pos' | 'neg' }[];
  className?: string;
}) {
  return (
    <div
      className={cn('grid gap-2', className)}
      // Uma coluna por opção, salvo se o className já definir as colunas.
      style={className?.includes('grid-cols') ? undefined : { gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((o) => {
        const active = o.value === value;
        const activeColor =
          o.tone === 'pos' ? 'bg-green-700 border-green-700' : o.tone === 'neg' ? 'bg-red-600 border-red-600' : 'bg-vermelho border-vermelho';
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.value)}
            className={cn(
              'min-h-10 rounded-lg border px-2 py-2 text-sm font-medium transition-colors',
              active ? `${activeColor} text-white` : 'border-beige-medium bg-white text-charcoal hover:bg-beige-light'
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="py-10 text-center text-sm text-muted-foreground">{children}</p>;
}
