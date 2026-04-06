import { useState } from 'react';
import { useDailySchedule } from '../hooks/useDailySchedule';
import { PERIODS } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import {
  Sun, Sunset, Moon, CloudMoon, Plus, Trash2, Pencil, Clock, Loader2, Music,
} from 'lucide-react';

const PERIOD_ICONS: Record<string, typeof Sun> = {
  manha: Sun,
  tarde: Sunset,
  noite: Moon,
  madrugada: CloudMoon,
};

const PERIOD_COLORS: Record<string, string> = {
  manha: 'border-amber-300 bg-amber-50',
  tarde: 'border-orange-300 bg-orange-50',
  noite: 'border-indigo-300 bg-indigo-50',
  madrugada: 'border-purple-300 bg-purple-50',
};

interface SlotForm {
  period: string;
  slot_time: string;
  slot_name: string;
  sort_order: number;
}

export function DailySchedule() {
  const {
    slots, loading, error, addSlot, updateSlot, removeSlot, toggleActive, getSlotsByPeriod, clearError,
  } = useDailySchedule();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SlotForm>({
    period: 'manha',
    slot_time: '',
    slot_name: '',
    sort_order: 0,
  });
  const [saving, setSaving] = useState(false);

  const openAdd = (periodKey: string) => {
    const periodSlots = getSlotsByPeriod(periodKey);
    setEditingId(null);
    setForm({
      period: periodKey,
      slot_time: '',
      slot_name: '',
      sort_order: periodSlots.length + 1,
    });
    setIsDialogOpen(true);
  };

  const openEdit = (id: string) => {
    const slot = slots.find((s) => s.id === id);
    if (!slot) return;
    setEditingId(id);
    setForm({
      period: slot.period,
      slot_time: slot.slot_time,
      slot_name: slot.slot_name,
      sort_order: slot.sort_order,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.slot_time.trim() || !form.slot_name.trim()) return;
    setSaving(true);

    if (editingId) {
      await updateSlot(editingId, {
        slot_time: form.slot_time,
        slot_name: form.slot_name,
        sort_order: form.sort_order,
      });
    } else {
      const period = PERIODS.find((p) => p.key === form.period);
      if (!period) return;
      await addSlot({
        period: period.key,
        period_label: period.label,
        time_range: period.range,
        slot_time: form.slot_time,
        slot_name: form.slot_name,
        sort_order: form.sort_order,
      });
    }

    setSaving(false);
    setIsDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tens a certeza que queres remover este slot?')) {
      await removeSlot(id);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-vermelho" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-vermelho/10 flex items-center justify-center">
            <Music className="w-5 h-5 text-vermelho" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-charcoal">Programação Diária</h2>
            <p className="text-sm text-muted-foreground">A Tua Soundtrack do Dia — 24H Non-Stop</p>
          </div>
        </div>
        <span className="text-sm text-muted-foreground">{slots.length} slots</span>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md flex justify-between items-center">
          <span>{error}</span>
          <button onClick={clearError} className="text-sm underline hover:no-underline">Fechar</button>
        </div>
      )}

      {/* Period Blocks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PERIODS.map((period) => {
          const Icon = PERIOD_ICONS[period.key];
          const periodSlots = getSlotsByPeriod(period.key);
          const colors = PERIOD_COLORS[period.key];

          return (
            <Card key={period.key} className={`border-2 ${colors}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="w-5 h-5" />
                    <CardTitle className="text-lg">{period.label}</CardTitle>
                    <span className="text-xs text-muted-foreground">{period.range}</span>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => openAdd(period.key)} className="h-8">
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Adicionar
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {periodSlots.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Sem slots neste período</p>
                ) : (
                  <div className="space-y-2">
                    {periodSlots.map((slot) => (
                      <div
                        key={slot.id}
                        className={`flex items-center justify-between p-3 rounded-lg bg-white/80 border transition-opacity ${
                          slot.is_active ? 'opacity-100' : 'opacity-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 text-sm font-mono bg-charcoal/5 px-2.5 py-1 rounded-md">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            {slot.slot_time}
                          </div>
                          <span className="font-medium text-sm">{slot.slot_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={slot.is_active}
                            onCheckedChange={(checked) => toggleActive(slot.id, checked)}
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => openEdit(slot.id)}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(slot.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Editar Slot' : 'Adicionar Slot'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {!editingId && (
              <div className="space-y-2">
                <Label>Período</Label>
                <Select value={form.period} onValueChange={(v) => setForm({ ...form, period: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PERIODS.map((p) => (
                      <SelectItem key={p.key} value={p.key}>
                        {p.label} ({p.range})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Horário</Label>
              <Input
                placeholder="Ex: 07h, 10h30, 14h"
                value={form.slot_time}
                onChange={(e) => setForm({ ...form, slot_time: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Nome do Programa</Label>
              <Input
                placeholder="Ex: Wake Up Mix, Lunch Beats"
                value={form.slot_name}
                onChange={(e) => setForm({ ...form, slot_name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Ordem</Label>
              <Input
                type="number"
                min={0}
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !form.slot_time.trim() || !form.slot_name.trim()}
              className="bg-vermelho hover:bg-vermelho/90 text-white"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {editingId ? 'Guardar' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
