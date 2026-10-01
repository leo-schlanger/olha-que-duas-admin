import { useState } from 'react';
import { Pencil, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { Field, FormDialog } from './shared';
import type { FinanceApi } from '../../hooks/useFinance';
import type { FinCategory, FinKind } from '../../types/finance';

export function CategoriesTab({ api }: { api: FinanceApi }) {
  const [dialog, setDialog] = useState<{ kind: FinKind; category: FinCategory | null } | null>(null);

  const column = (kind: FinKind, title: string) => (
    <Card>
      <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">{title}</CardTitle>
        <Button size="sm" variant="outline" onClick={() => setDialog({ kind, category: null })}>
          <Plus className="h-4 w-4 mr-1" /> Nova
        </Button>
      </CardHeader>
      <CardContent className="divide-y divide-beige-medium">
        {api.data.categories
          .filter((c) => c.kind === kind)
          .map((c) => (
            <div key={c.id} className={`flex items-center gap-3 py-2 ${c.is_active ? '' : 'opacity-50'}`}>
              <span className="w-3 h-3 rounded-full shrink-0" style={{ background: c.color }} />
              <span className="flex-1 text-sm text-charcoal">{c.name}</span>
              <Switch
                checked={c.is_active}
                onCheckedChange={(v) => api.save('fin_categories', { id: c.id, is_active: v })}
                title={c.is_active ? 'Desativar' : 'Ativar'}
              />
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setDialog({ kind, category: c })}>
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
          ))}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Categorias desativadas deixam de aparecer nos formulários, mas os lançamentos antigos mantêm-nas.
      </p>
      <div className="grid md:grid-cols-2 gap-4">
        {column('income', 'Categorias de receita')}
        {column('expense', 'Categorias de despesa')}
      </div>
      {dialog && <CategoryDialog api={api} kind={dialog.kind} category={dialog.category} onClose={() => setDialog(null)} />}
    </div>
  );
}

function CategoryDialog({
  api,
  kind,
  category,
  onClose,
}: {
  api: FinanceApi;
  kind: FinKind;
  category: FinCategory | null;
  onClose: () => void;
}) {
  const [name, setName] = useState(category?.name ?? '');
  const [color, setColor] = useState(category?.color ?? '#c0392b');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!name.trim()) return setError('Indique o nome');
    setSaving(true);
    const ok = await api.save('fin_categories', { id: category?.id, kind, name: name.trim(), color });
    setSaving(false);
    if (ok) onClose();
    else setError('Não foi possível guardar (já existe uma categoria com este nome?)');
  };

  return (
    <FormDialog open onOpenChange={(o) => !o && onClose()} title={category ? 'Editar categoria' : 'Nova categoria'} saving={saving} error={error} onSubmit={submit}>
      <Field label="Nome" htmlFor="cat-name" required>
        <Input id="cat-name" value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label="Cor" htmlFor="cat-color">
        <Input id="cat-color" type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-20 p-1" />
      </Field>
    </FormDialog>
  );
}
