import { useState, useEffect } from 'react';
import {
  Users,
  Mail,
  RefreshCw,
  CheckCircle,
  XCircle,
  Plus,
  Trash2,
  UserPlus,
  ArrowRightLeft,
  Filter,
} from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '../ui/dialog';
import type { Subscriber, SubscriberGroup } from '../../types';

interface SubscriberListProps {
  subscribers: Subscriber[];
  total: number;
  loading: boolean;
  adding: boolean;
  removing: string | null;
  movingSubscribers: boolean;
  groups: SubscriberGroup[];
  selectedGroupId: number | null;
  onRefresh: (listId?: number) => void;
  onAdd: (email: string, nome?: string, listId?: number) => Promise<boolean>;
  onRemove: (email: string) => Promise<boolean>;
  onMoveSubscribers: (emails: string[], fromListId: number, toListId: number) => Promise<boolean>;
  onRemoveFromGroup: (emails: string[], listId: number) => Promise<boolean>;
  onGroupChange: (groupId: number | null) => void;
}

export function SubscriberList({
  subscribers,
  total,
  loading,
  adding,
  removing,
  movingSubscribers,
  groups,
  selectedGroupId,
  onRefresh,
  onAdd,
  onRemove,
  onMoveSubscribers,
  onRemoveFromGroup,
  onGroupChange,
}: SubscriberListProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newNome, setNewNome] = useState('');
  const [addToGroupId, setAddToGroupId] = useState<string>('');
  const [emailError, setEmailError] = useState('');
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [moveTargetGroupId, setMoveTargetGroupId] = useState<string>('');

  const activeCount = subscribers.filter((s) => s.isActive).length;
  const selectedGroup = groups.find((g) => g.id === selectedGroupId);

  // Reset selections when group changes
  useEffect(() => {
    setSelectedEmails(new Set());
  }, [selectedGroupId]);

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleAdd = async () => {
    setEmailError('');

    if (!newEmail.trim()) {
      setEmailError('Email é obrigatório');
      return;
    }

    if (!validateEmail(newEmail)) {
      setEmailError('Email inválido');
      return;
    }

    const listId = addToGroupId ? parseInt(addToGroupId) : undefined;
    const success = await onAdd(newEmail.trim(), newNome.trim() || undefined, listId);
    if (success) {
      setShowAddDialog(false);
      setNewEmail('');
      setNewNome('');
      setAddToGroupId('');
    }
  };

  const handleDelete = async (email: string) => {
    const success = await onRemove(email);
    if (success) {
      setShowDeleteDialog(null);
    }
  };

  const toggleSelectEmail = (email: string) => {
    setSelectedEmails((prev) => {
      const next = new Set(prev);
      if (next.has(email)) {
        next.delete(email);
      } else {
        next.add(email);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedEmails.size === subscribers.length) {
      setSelectedEmails(new Set());
    } else {
      setSelectedEmails(new Set(subscribers.map((s) => s.email)));
    }
  };

  const handleMove = async () => {
    if (!moveTargetGroupId || !selectedGroupId || selectedEmails.size === 0) return;

    const success = await onMoveSubscribers(
      Array.from(selectedEmails),
      selectedGroupId,
      parseInt(moveTargetGroupId)
    );

    if (success) {
      setShowMoveDialog(false);
      setSelectedEmails(new Set());
      setMoveTargetGroupId('');
      onRefresh(selectedGroupId);
    }
  };

  const handleRemoveFromGroup = async () => {
    if (!selectedGroupId || selectedEmails.size === 0) return;

    const success = await onRemoveFromGroup(
      Array.from(selectedEmails),
      selectedGroupId
    );

    if (success) {
      setSelectedEmails(new Set());
      onRefresh(selectedGroupId);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-12 h-12 border-4 border-vermelho/20 border-t-vermelho rounded-full animate-spin mb-4" />
        <p className="text-muted-foreground">Carregando subscritores...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-charcoal">
            Subscritores
          </h2>
          <p className="text-muted-foreground mt-1">
            {total} total &bull; {activeCount} ativos
            {selectedGroup && (
              <span className="ml-1">
                &bull; Grupo: <strong>{selectedGroup.name}</strong>
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowAddDialog(true)}
            className="bg-vermelho hover:bg-vermelho/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar
          </Button>
          <Button
            variant="outline"
            onClick={() => onRefresh(selectedGroupId ?? undefined)}
            className="border-beige-medium"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Group Filter */}
      {groups.length > 0 && (
        <Card className="bg-cream border-beige-medium">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-medium whitespace-nowrap">Filtrar por grupo:</Label>
              <Select
                value={selectedGroupId?.toString() ?? 'all'}
                onValueChange={(value) => {
                  const groupId = value === 'all' ? null : parseInt(value);
                  onGroupChange(groupId);
                }}
              >
                <SelectTrigger className="w-[260px] bg-white">
                  <SelectValue placeholder="Todos os grupos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os grupos</SelectItem>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id.toString()}>
                      {group.name} ({group.totalSubscribers})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="bg-cream border-beige-medium">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-vermelho/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-vermelho" />
            </div>
            <div>
              <p className="text-2xl font-bold text-charcoal">{total}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-cream border-beige-medium">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-charcoal">{activeCount}</p>
              <p className="text-sm text-muted-foreground">Ativos</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-cream border-beige-medium">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amarelo/20 flex items-center justify-center">
              <Mail className="h-6 w-6 text-charcoal" />
            </div>
            <div>
              <p className="text-2xl font-bold text-charcoal">300</p>
              <p className="text-sm text-muted-foreground">Limite diário</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Actions */}
      {selectedEmails.size > 0 && selectedGroupId && (
        <Card className="bg-vermelho/5 border-vermelho/20">
          <CardContent className="p-3 flex items-center justify-between">
            <span className="text-sm font-medium text-charcoal">
              {selectedEmails.size} subscritor{selectedEmails.size > 1 ? 'es' : ''} selecionado{selectedEmails.size > 1 ? 's' : ''}
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowMoveDialog(true)}
                disabled={movingSubscribers}
                className="border-beige-medium"
              >
                <ArrowRightLeft className="h-3.5 w-3.5 mr-1.5" />
                Mover para...
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleRemoveFromGroup}
                disabled={movingSubscribers}
                className="border-destructive/30 text-destructive hover:bg-destructive/10"
              >
                {movingSubscribers ? (
                  <div className="h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full animate-spin mr-1.5" />
                ) : (
                  <XCircle className="h-3.5 w-3.5 mr-1.5" />
                )}
                Remover do grupo
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subscriber List */}
      {subscribers.length === 0 ? (
        <Card className="bg-cream border-beige-medium">
          <CardContent className="py-16 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-beige-medium mb-4">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-display text-xl font-semibold text-charcoal mb-2">
              {selectedGroupId
                ? 'Nenhum subscritor neste grupo'
                : 'Nenhum subscritor ainda'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {selectedGroupId
                ? 'Adiciona subscritores a este grupo ou muda o filtro.'
                : 'Os subscritores aparecerão aqui quando se inscreverem na newsletter.'}
            </p>
            <Button
              onClick={() => setShowAddDialog(true)}
              className="bg-vermelho hover:bg-vermelho/90"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Adicionar subscritor
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-cream border-beige-medium overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-beige-medium bg-beige-light/50">
                  {selectedGroupId && (
                    <th className="w-10 px-4 py-3">
                      <Checkbox
                        checked={selectedEmails.size === subscribers.length && subscribers.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </th>
                  )}
                  <th className="text-left px-4 py-3 text-sm font-semibold text-charcoal">
                    Email
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-charcoal">
                    Nome
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-charcoal">
                    Data
                  </th>
                  <th className="text-center px-4 py-3 text-sm font-semibold text-charcoal">
                    Estado
                  </th>
                  <th className="text-center px-4 py-3 text-sm font-semibold text-charcoal">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((subscriber, index) => (
                  <tr
                    key={subscriber.id}
                    className={`border-b border-beige-medium/50 ${
                      index % 2 === 0 ? 'bg-white' : 'bg-cream'
                    } ${selectedEmails.has(subscriber.email) ? 'bg-vermelho/5' : ''}`}
                  >
                    {selectedGroupId && (
                      <td className="w-10 px-4 py-3">
                        <Checkbox
                          checked={selectedEmails.has(subscriber.email)}
                          onCheckedChange={() => toggleSelectEmail(subscriber.email)}
                        />
                      </td>
                    )}
                    <td className="px-4 py-3 text-sm text-charcoal">
                      {subscriber.email}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {subscriber.nome || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {new Date(subscriber.createdAt).toLocaleDateString('pt-PT')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {subscriber.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          <CheckCircle className="h-3 w-3" />
                          Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          <XCircle className="h-3 w-3" />
                          Inativo
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowDeleteDialog(subscriber.email)}
                        disabled={removing === subscriber.email}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        {removing === subscriber.email ? (
                          <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Add Subscriber Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-cream border-beige-medium">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-charcoal">
              Adicionar Subscritor
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@exemplo.com"
                value={newEmail}
                onChange={(e) => {
                  setNewEmail(e.target.value);
                  setEmailError('');
                }}
                className={emailError ? 'border-destructive' : ''}
              />
              {emailError && (
                <p className="text-sm text-destructive">{emailError}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="nome">Nome (opcional)</Label>
              <Input
                id="nome"
                type="text"
                placeholder="Nome do subscritor"
                value={newNome}
                onChange={(e) => setNewNome(e.target.value)}
              />
            </div>
            {groups.length > 0 && (
              <div className="space-y-2">
                <Label>Adicionar ao grupo (opcional)</Label>
                <Select value={addToGroupId} onValueChange={setAddToGroupId}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Grupo padrão" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Grupo padrão</SelectItem>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.id.toString()}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" className="border-beige-medium">
                Cancelar
              </Button>
            </DialogClose>
            <Button
              onClick={handleAdd}
              disabled={adding}
              className="bg-vermelho hover:bg-vermelho/90"
            >
              {adding ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Adicionando...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Adicionar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!showDeleteDialog} onOpenChange={() => setShowDeleteDialog(null)}>
        <DialogContent className="bg-cream border-beige-medium">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-charcoal">
              Remover Subscritor
            </DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground py-4">
            Tens a certeza que queres remover <strong className="text-charcoal">{showDeleteDialog}</strong> da lista de subscritores?
          </p>
          <p className="text-sm text-muted-foreground">
            Esta ação não pode ser desfeita. O email será removido permanentemente do Brevo.
          </p>
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button variant="outline" className="border-beige-medium">
                Cancelar
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => showDeleteDialog && handleDelete(showDeleteDialog)}
              disabled={!!removing}
            >
              {removing ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Removendo...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remover
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move Subscribers Dialog */}
      <Dialog open={showMoveDialog} onOpenChange={setShowMoveDialog}>
        <DialogContent className="bg-cream border-beige-medium">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-charcoal">
              Mover Subscritores
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-muted-foreground">
              Mover <strong className="text-charcoal">{selectedEmails.size}</strong> subscritor{selectedEmails.size > 1 ? 'es' : ''} de{' '}
              <strong className="text-charcoal">{selectedGroup?.name}</strong> para:
            </p>
            <div className="space-y-2">
              <Label>Grupo de destino</Label>
              <Select value={moveTargetGroupId} onValueChange={setMoveTargetGroupId}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Selecionar grupo..." />
                </SelectTrigger>
                <SelectContent>
                  {groups
                    .filter((g) => g.id !== selectedGroupId)
                    .map((group) => (
                      <SelectItem key={group.id} value={group.id.toString()}>
                        {group.name} ({group.totalSubscribers})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" className="border-beige-medium">
                Cancelar
              </Button>
            </DialogClose>
            <Button
              onClick={handleMove}
              disabled={!moveTargetGroupId || movingSubscribers}
              className="bg-vermelho hover:bg-vermelho/90"
            >
              {movingSubscribers ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Movendo...
                </>
              ) : (
                <>
                  <ArrowRightLeft className="h-4 w-4 mr-2" />
                  Mover
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
