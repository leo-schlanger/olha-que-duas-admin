import { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, Pencil, PlusCircle, RefreshCw, Trash2 } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { EmptyState, NativeSelect } from './shared';
import { describeActivity, type FinActivity } from '../../lib/financeActivity';
import type { FinanceApi } from '../../hooks/useFinance';

const TONE = {
  create: { icon: PlusCircle, color: 'text-sky-600' },
  update: { icon: Pencil, color: 'text-amber-600' },
  delete: { icon: Trash2, color: 'text-red-600' },
  paid: { icon: CheckCircle2, color: 'text-green-600' },
} as const;

const dateTime = new Intl.DateTimeFormat('pt-PT', {
  timeZone: 'Europe/Lisbon',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

/** Histórico de alterações: quem criou, alterou ou apagou o quê, e quando. */
export function ActivityTab({ api }: { api: FinanceApi }) {
  const [rows, setRows] = useState<FinActivity[] | null>(null);
  const [who, setWho] = useState('');
  const { loadActivity } = api;

  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let alive = true;
    loadActivity().then((r) => alive && setRows(r));
    return () => {
      alive = false;
    };
  }, [loadActivity, reloadKey]);

  const load = () => {
    setRows(null);
    setReloadKey((k) => k + 1);
  };

  const people = [...new Set((rows ?? []).map((r) => r.user_email ?? ''))];
  const visible = (rows ?? []).filter((r) => !who || (r.user_email ?? '') === who);

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Cada alteração fica registada com o autor e a hora. O histórico não pode ser editado.
          </p>
          <div className="flex items-center gap-2">
            <NativeSelect value={who} onChange={(e) => setWho(e.target.value)} className="w-48">
              <option value="">Todas as pessoas</option>
              {people.map((p) => (
                <option key={p || 'auto'} value={p}>
                  {p ? p.split('@')[0] : 'Automático'}
                </option>
              ))}
            </NativeSelect>
            <Button variant="outline" size="icon" onClick={load} title="Atualizar">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {rows === null ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 text-vermelho animate-spin" />
          </div>
        ) : visible.length === 0 ? (
          <EmptyState>Sem alterações registadas ainda</EmptyState>
        ) : (
          <ol className="divide-y divide-beige-medium">
            {visible.map((a) => {
              const line = describeActivity(a, api.data);
              const { icon: Icon, color } = TONE[line.tone];
              return (
                <li key={a.id} className="flex gap-3 py-3">
                  <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${color}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-charcoal">
                      <span className="font-semibold">{line.who}</span> {line.text}
                    </p>
                    {line.changes.length > 0 && (
                      <ul className="mt-1 space-y-0.5">
                        {line.changes.map((c) => (
                          <li key={c} className="text-xs text-muted-foreground">
                            {c}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <time className="text-xs text-muted-foreground whitespace-nowrap tabular-nums">
                    {dateTime.format(new Date(a.at))}
                  </time>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
