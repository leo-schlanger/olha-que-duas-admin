import { useState } from 'react';
import { Users, Mail, RefreshCw, CheckCircle, XCircle, Plus, Trash2, UserPlus } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
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
  groups: SubscriberGroup[];
  onRefresh: () => void;
  onAdd: (email: string, nome?: string, listId?: number) => Promise<boolean>;
  onRemove: (email: string) => Promise<boolean>;
}

export function SubscriberList({
  subscribers,
  total,
  loading,
  adding,
  removing,
  groups,
  onRefresh,
  onAdd,
  onRemove,
}: SubscriberListProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState('');
  const [newNome, setNewNome] = useState('');
  const [addToGroupId, setAddToGroupId] = useState<string>('');
  const [emailError, setEmailError] = useState('');

  const activeCount = subscribers.filter((s) => s.isActive).length;

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

    const listId = addToGroupId && addToGroupId !== 'default' ? parseInt(addToGroupId) : undefined;
    const success = await onAdd(newEmail.trim(), newNome.trim() || undefined, listId);
    if (success) {
      setShowAddDialog(false);
      setNewEmail('');
      setNewNome('');
      setAddToGroupId('');
      onRefresh();
    }
  };

  const handleDelete = async (email: string) => {
    const success = await onRemove(email);
    if (success) {
      setShowDeleteDialog(null);
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
            onClick={onRefresh}
            className="border-beige-medium"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

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

      {/* Subscriber List */}
      {subscribers.length === 0 ? (
        <Card className="bg-cream border-beige-medium">
          <CardContent className="py-16 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-beige-medium mb-4">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-display text-xl font-semibold text-charcoal mb-2">
              Nenhum subscritor ainda
            </h3>
            <p className="text-muted-foreground mb-4">
              Os subscritores aparecerão aqui quando se inscreverem na newsletter.
            </p>
            <Button
              onClick={() => setShowAddDialog(true)}
              className="bg-vermelho hover:bg-vermelho/90"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Adicionar primeiro subscritor
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-cream border-beige-medium overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-beige-medium bg-beige-light/50">
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
                    }`}
                  >
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
                    <SelectValue placeholder="Lista principal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Lista principal</SelectItem>
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
    </div>
  );
}
