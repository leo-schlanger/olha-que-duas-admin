import { useState } from 'react';
import {
  FolderPlus,
  Pencil,
  Trash2,
  Users,
  RefreshCw,
  Plus,
  Save,
  X,
} from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '../ui/dialog';
import type { SubscriberGroup } from '../../types';

interface GroupManagerProps {
  groups: SubscriberGroup[];
  loading: boolean;
  saving: boolean;
  onRefresh: () => void;
  onCreate: (name: string) => Promise<boolean>;
  onUpdate: (id: number, name: string) => Promise<boolean>;
  onDelete: (id: number) => Promise<boolean>;
}

export function GroupManager({
  groups,
  loading,
  saving,
  onRefresh,
  onCreate,
  onUpdate,
  onDelete,
}: GroupManagerProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<SubscriberGroup | null>(null);
  const [editingGroup, setEditingGroup] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [nameError, setNameError] = useState('');

  const totalAllSubscribers = groups.reduce((sum, g) => sum + g.totalSubscribers, 0);

  const handleCreate = async () => {
    setNameError('');
    if (!newGroupName.trim()) {
      setNameError('Nome do grupo é obrigatório');
      return;
    }
    const success = await onCreate(newGroupName.trim());
    if (success) {
      setShowCreateDialog(false);
      setNewGroupName('');
    }
  };

  const handleStartEdit = (group: SubscriberGroup) => {
    setEditingGroup(group.id);
    setEditName(group.name);
  };

  const handleSaveEdit = async (id: number) => {
    if (!editName.trim()) return;
    const success = await onUpdate(id, editName.trim());
    if (success) {
      setEditingGroup(null);
      setEditName('');
    }
  };

  const handleCancelEdit = () => {
    setEditingGroup(null);
    setEditName('');
  };

  const handleDelete = async (group: SubscriberGroup) => {
    const success = await onDelete(group.id);
    if (success) {
      setShowDeleteDialog(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-12 h-12 border-4 border-vermelho/20 border-t-vermelho rounded-full animate-spin mb-4" />
        <p className="text-muted-foreground">Carregando grupos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-charcoal">
            Grupos
          </h2>
          <p className="text-muted-foreground mt-1">
            {groups.length} grupo{groups.length !== 1 ? 's' : ''} &bull; {totalAllSubscribers} subscritores no total
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-vermelho hover:bg-vermelho/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Criar Grupo
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

      {/* Groups List */}
      {groups.length === 0 ? (
        <Card className="bg-cream border-beige-medium">
          <CardContent className="py-16 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-beige-medium mb-4">
              <FolderPlus className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-display text-xl font-semibold text-charcoal mb-2">
              Nenhum grupo criado
            </h3>
            <p className="text-muted-foreground mb-4">
              Cria grupos para organizar os subscritores da newsletter.
            </p>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-vermelho hover:bg-vermelho/90"
            >
              <FolderPlus className="h-4 w-4 mr-2" />
              Criar primeiro grupo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <Card key={group.id} className="bg-cream border-beige-medium">
              <CardContent className="p-5">
                {editingGroup === group.id ? (
                  <div className="space-y-3">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Nome do grupo"
                      className="bg-white"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit(group.id);
                        if (e.key === 'Escape') handleCancelEdit();
                      }}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleSaveEdit(group.id)}
                        disabled={saving || !editName.trim()}
                        className="bg-vermelho hover:bg-vermelho/90"
                      >
                        {saving ? (
                          <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancelEdit}
                        className="border-beige-medium"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-vermelho/10 flex items-center justify-center">
                          <Users className="h-5 w-5 text-vermelho" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-charcoal text-lg leading-tight">
                            {group.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {group.totalSubscribers} subscritor{group.totalSubscribers !== 1 ? 'es' : ''}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground mb-4">
                      Criado em {new Date(group.createdAt).toLocaleDateString('pt-PT')}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStartEdit(group)}
                        className="flex-1 border-beige-medium"
                      >
                        <Pencil className="h-3.5 w-3.5 mr-1.5" />
                        Renomear
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowDeleteDialog(group)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Group Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-cream border-beige-medium">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-charcoal">
              Criar Novo Grupo
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="group-name">Nome do Grupo *</Label>
              <Input
                id="group-name"
                type="text"
                placeholder="Ex: VIPs, Parceiros, Equipa..."
                value={newGroupName}
                onChange={(e) => {
                  setNewGroupName(e.target.value);
                  setNameError('');
                }}
                className={nameError ? 'border-destructive' : ''}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreate();
                }}
              />
              {nameError && (
                <p className="text-sm text-destructive">{nameError}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" className="border-beige-medium">
                Cancelar
              </Button>
            </DialogClose>
            <Button
              onClick={handleCreate}
              disabled={saving}
              className="bg-vermelho hover:bg-vermelho/90"
            >
              {saving ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Criando...
                </>
              ) : (
                <>
                  <FolderPlus className="h-4 w-4 mr-2" />
                  Criar Grupo
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
              Eliminar Grupo
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <p className="text-muted-foreground">
              Tens a certeza que queres eliminar o grupo{' '}
              <strong className="text-charcoal">&quot;{showDeleteDialog?.name}&quot;</strong>?
            </p>
            {showDeleteDialog && showDeleteDialog.totalSubscribers > 0 && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm">
                Este grupo contém <strong>{showDeleteDialog.totalSubscribers}</strong> subscritor(es).
                Os contactos não serão eliminados, apenas removidos deste grupo.
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              Esta ação não pode ser desfeita.
            </p>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" className="border-beige-medium">
                Cancelar
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => showDeleteDialog && handleDelete(showDeleteDialog)}
              disabled={saving}
            >
              {saving ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
