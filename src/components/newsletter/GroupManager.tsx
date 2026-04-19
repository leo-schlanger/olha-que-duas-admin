import { useState, useEffect } from 'react';
import {
  FolderPlus,
  Pencil,
  Trash2,
  Users,
  RefreshCw,
  Plus,
  Save,
  X,
  ArrowLeft,
  ArrowRightLeft,
  UserPlus,
  CheckCircle,
  XCircle,
  ChevronRight,
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

interface GroupManagerProps {
  groups: SubscriberGroup[];
  groupSubscribers: Subscriber[];
  totalGroupSubscribers: number;
  loading: boolean;
  loadingSubscribers: boolean;
  saving: boolean;
  moving: boolean;
  adding: boolean;
  removing: string | null;
  groupError: string | null;
  onRefreshGroups: () => void;
  onFetchGroupSubscribers: (listId: number) => void;
  onClearGroupSubscribers: () => void;
  onCreate: (name: string) => Promise<boolean>;
  onUpdate: (id: number, name: string) => Promise<boolean>;
  onDelete: (id: number) => Promise<boolean>;
  onAddSubscriber: (email: string, nome?: string, listId?: number) => Promise<boolean>;
  onRemoveSubscriber: (email: string) => Promise<boolean>;
  onMoveSubscribers: (emails: string[], fromListId: number, toListId: number) => Promise<boolean>;
  onRemoveFromGroup: (emails: string[], listId: number) => Promise<boolean>;
}

export function GroupManager({
  groups,
  groupSubscribers,
  totalGroupSubscribers,
  loading,
  loadingSubscribers,
  saving,
  moving,
  adding,
  removing,
  groupError,
  onRefreshGroups,
  onFetchGroupSubscribers,
  onClearGroupSubscribers,
  onCreate,
  onUpdate,
  onDelete,
  onAddSubscriber,
  onRemoveSubscriber,
  onMoveSubscribers,
  onRemoveFromGroup,
}: GroupManagerProps) {
  const [activeGroup, setActiveGroup] = useState<SubscriberGroup | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<SubscriberGroup | null>(null);
  const [showAddSubscriberDialog, setShowAddSubscriberDialog] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [showRemoveFromGroupDialog, setShowRemoveFromGroupDialog] = useState(false);
  const [showDeleteSubscriberDialog, setShowDeleteSubscriberDialog] = useState<string | null>(null);
  const [editingGroup, setEditingGroup] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [nameError, setNameError] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newNome, setNewNome] = useState('');
  const [emailError, setEmailError] = useState('');
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [moveTargetGroupId, setMoveTargetGroupId] = useState<string>('');

  // When a group is selected, fetch its subscribers
  useEffect(() => {
    if (activeGroup) {
      onFetchGroupSubscribers(activeGroup.id);
      setSelectedEmails(new Set());
    } else {
      onClearGroupSubscribers();
    }
  }, [activeGroup?.id]);

  // Sync active group data when groups list refreshes
  useEffect(() => {
    if (activeGroup) {
      const updated = groups.find((g) => g.id === activeGroup.id);
      if (updated) {
        setActiveGroup(updated);
      } else {
        setActiveGroup(null);
      }
    }
  }, [groups]);

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

  const handleStartEdit = (e: React.MouseEvent, group: SubscriberGroup) => {
    e.stopPropagation();
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
      if (activeGroup?.id === group.id) {
        setActiveGroup(null);
      }
    }
  };

  const handleOpenGroup = (group: SubscriberGroup) => {
    if (editingGroup === group.id) return;
    setActiveGroup(group);
  };

  const handleBackToList = () => {
    setActiveGroup(null);
    setSelectedEmails(new Set());
    onRefreshGroups();
  };

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleAddSubscriber = async () => {
    setEmailError('');
    if (!newEmail.trim()) {
      setEmailError('Email é obrigatório');
      return;
    }
    if (!validateEmail(newEmail)) {
      setEmailError('Email inválido');
      return;
    }
    if (!activeGroup) return;

    const success = await onAddSubscriber(newEmail.trim(), newNome.trim() || undefined, activeGroup.id);
    if (success) {
      setShowAddSubscriberDialog(false);
      setNewEmail('');
      setNewNome('');
      onFetchGroupSubscribers(activeGroup.id);
      onRefreshGroups();
    }
  };

  const handleDeleteSubscriber = async (email: string) => {
    const success = await onRemoveSubscriber(email);
    if (success) {
      setShowDeleteSubscriberDialog(null);
      if (activeGroup) {
        onFetchGroupSubscribers(activeGroup.id);
        onRefreshGroups();
      }
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
    if (selectedEmails.size === groupSubscribers.length) {
      setSelectedEmails(new Set());
    } else {
      setSelectedEmails(new Set(groupSubscribers.map((s) => s.email)));
    }
  };

  const handleMove = async () => {
    if (!moveTargetGroupId || !activeGroup || selectedEmails.size === 0) return;

    const success = await onMoveSubscribers(
      Array.from(selectedEmails),
      activeGroup.id,
      parseInt(moveTargetGroupId)
    );

    if (success) {
      setShowMoveDialog(false);
      setSelectedEmails(new Set());
      setMoveTargetGroupId('');
      onFetchGroupSubscribers(activeGroup.id);
      onRefreshGroups();
    }
  };

  const handleRemoveFromGroup = async () => {
    if (!activeGroup || selectedEmails.size === 0) return;

    const success = await onRemoveFromGroup(
      Array.from(selectedEmails),
      activeGroup.id
    );

    if (success) {
      setShowRemoveFromGroupDialog(false);
      setSelectedEmails(new Set());
      onFetchGroupSubscribers(activeGroup.id);
      onRefreshGroups();
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

  // ===== GROUP DETAIL VIEW =====
  if (activeGroup) {
    return (
      <div className="space-y-6">
        {/* Group Error */}
        {groupError && (
          <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
            {groupError}
          </div>
        )}

        {/* Header with back button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToList}
              className="text-muted-foreground hover:text-charcoal -ml-2"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Voltar
            </Button>
            <div className="h-6 w-px bg-beige-medium" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-vermelho/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-vermelho" />
              </div>
              <div>
                <h2 className="font-display text-2xl font-bold text-charcoal">
                  {activeGroup.name}
                </h2>
                <p className="text-muted-foreground text-sm">
                  {totalGroupSubscribers} subscritor{totalGroupSubscribers !== 1 ? 'es' : ''}
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowAddSubscriberDialog(true)}
              className="bg-vermelho hover:bg-vermelho/90"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
            <Button
              variant="outline"
              onClick={() => onFetchGroupSubscribers(activeGroup.id)}
              className="border-beige-medium"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedEmails.size > 0 && (
          <Card className="bg-vermelho/5 border-vermelho/20">
            <CardContent className="p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <span className="text-sm font-medium text-charcoal">
                {selectedEmails.size} selecionado{selectedEmails.size > 1 ? 's' : ''}
              </span>
              <div className="flex gap-2">
                {groups.length > 1 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowMoveDialog(true)}
                    disabled={moving}
                    className="border-beige-medium"
                  >
                    <ArrowRightLeft className="h-3.5 w-3.5 mr-1.5" />
                    Mover para...
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowRemoveFromGroupDialog(true)}
                  disabled={moving}
                  className="border-destructive/30 text-destructive hover:bg-destructive/10"
                >
                  <XCircle className="h-3.5 w-3.5 mr-1.5" />
                  Remover do grupo
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Subscribers Table */}
        {loadingSubscribers ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-10 h-10 border-4 border-vermelho/20 border-t-vermelho rounded-full animate-spin mb-3" />
            <p className="text-muted-foreground text-sm">Carregando subscritores...</p>
          </div>
        ) : groupSubscribers.length === 0 ? (
          <Card className="bg-cream border-beige-medium">
            <CardContent className="py-12 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-beige-medium mb-4">
                <Users className="h-7 w-7 text-muted-foreground" />
              </div>
              <h3 className="font-display text-lg font-semibold text-charcoal mb-2">
                Grupo vazio
              </h3>
              <p className="text-muted-foreground mb-4 text-sm">
                Este grupo ainda não tem subscritores. Adiciona o primeiro.
              </p>
              <Button
                onClick={() => setShowAddSubscriberDialog(true)}
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
                    <th className="w-10 px-4 py-3">
                      <Checkbox
                        checked={selectedEmails.size === groupSubscribers.length && groupSubscribers.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-charcoal">Email</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-charcoal">Nome</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-charcoal">Data</th>
                    <th className="text-center px-4 py-3 text-sm font-semibold text-charcoal">Estado</th>
                    <th className="text-center px-4 py-3 text-sm font-semibold text-charcoal">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {groupSubscribers.map((subscriber, index) => (
                    <tr
                      key={subscriber.id}
                      className={`border-b border-beige-medium/50 transition-colors ${
                        selectedEmails.has(subscriber.email)
                          ? 'bg-vermelho/5'
                          : index % 2 === 0
                            ? 'bg-white'
                            : 'bg-cream'
                      }`}
                    >
                      <td className="w-10 px-4 py-3">
                        <Checkbox
                          checked={selectedEmails.has(subscriber.email)}
                          onCheckedChange={() => toggleSelectEmail(subscriber.email)}
                        />
                      </td>
                      <td className="px-4 py-3 text-sm text-charcoal">{subscriber.email}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{subscriber.nome || '-'}</td>
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
                          onClick={() => setShowDeleteSubscriberDialog(subscriber.email)}
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

        {/* Add Subscriber to Group Dialog */}
        <Dialog open={showAddSubscriberDialog} onOpenChange={setShowAddSubscriberDialog}>
          <DialogContent className="bg-cream border-beige-medium">
            <DialogHeader>
              <DialogTitle className="font-display text-xl text-charcoal">
                Adicionar a &quot;{activeGroup.name}&quot;
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="group-email">Email *</Label>
                <Input
                  id="group-email"
                  type="email"
                  placeholder="email@exemplo.com"
                  value={newEmail}
                  onChange={(e) => { setNewEmail(e.target.value); setEmailError(''); }}
                  className={emailError ? 'border-destructive' : ''}
                />
                {emailError && <p className="text-sm text-destructive">{emailError}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="group-nome">Nome (opcional)</Label>
                <Input
                  id="group-nome"
                  type="text"
                  placeholder="Nome do subscritor"
                  value={newNome}
                  onChange={(e) => setNewNome(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" className="border-beige-medium">Cancelar</Button>
              </DialogClose>
              <Button onClick={handleAddSubscriber} disabled={adding} className="bg-vermelho hover:bg-vermelho/90">
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

        {/* Delete Subscriber Dialog */}
        <Dialog open={!!showDeleteSubscriberDialog} onOpenChange={() => setShowDeleteSubscriberDialog(null)}>
          <DialogContent className="bg-cream border-beige-medium">
            <DialogHeader>
              <DialogTitle className="font-display text-xl text-charcoal">Remover Subscritor</DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground py-4">
              Tens a certeza que queres remover <strong className="text-charcoal">{showDeleteSubscriberDialog}</strong> permanentemente?
            </p>
            <p className="text-sm text-muted-foreground">
              O contacto será eliminado de todos os grupos e do Brevo.
            </p>
            <DialogFooter className="mt-4">
              <DialogClose asChild>
                <Button variant="outline" className="border-beige-medium">Cancelar</Button>
              </DialogClose>
              <Button
                variant="destructive"
                onClick={() => showDeleteSubscriberDialog && handleDeleteSubscriber(showDeleteSubscriberDialog)}
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
              <DialogTitle className="font-display text-xl text-charcoal">Mover Subscritores</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-muted-foreground">
                Mover <strong className="text-charcoal">{selectedEmails.size}</strong> subscritor{selectedEmails.size > 1 ? 'es' : ''} de{' '}
                <strong className="text-charcoal">{activeGroup.name}</strong> para:
              </p>
              <div className="space-y-2">
                <Label>Grupo de destino</Label>
                <Select value={moveTargetGroupId} onValueChange={setMoveTargetGroupId}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Selecionar grupo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {groups
                      .filter((g) => g.id !== activeGroup.id)
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
                <Button variant="outline" className="border-beige-medium">Cancelar</Button>
              </DialogClose>
              <Button onClick={handleMove} disabled={!moveTargetGroupId || moving} className="bg-vermelho hover:bg-vermelho/90">
                {moving ? (
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

        {/* Remove from Group Confirmation Dialog */}
        <Dialog open={showRemoveFromGroupDialog} onOpenChange={setShowRemoveFromGroupDialog}>
          <DialogContent className="bg-cream border-beige-medium">
            <DialogHeader>
              <DialogTitle className="font-display text-xl text-charcoal">Remover do Grupo</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-3">
              <p className="text-muted-foreground">
                Remover <strong className="text-charcoal">{selectedEmails.size}</strong> subscritor{selectedEmails.size > 1 ? 'es' : ''} do grupo{' '}
                <strong className="text-charcoal">&quot;{activeGroup.name}&quot;</strong>?
              </p>
              <p className="text-sm text-muted-foreground">
                Os contactos não serão eliminados, apenas removidos deste grupo.
              </p>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" className="border-beige-medium">Cancelar</Button>
              </DialogClose>
              <Button
                variant="destructive"
                onClick={handleRemoveFromGroup}
                disabled={moving}
              >
                {moving ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Removendo...
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    Remover do grupo
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ===== GROUP LIST VIEW =====
  return (
    <div className="space-y-6">
      {/* Group Error */}
      {groupError && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm">
          {groupError}
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefreshGroups}
            className="ml-2 text-amber-800 hover:text-amber-900 underline p-0 h-auto"
          >
            Tentar novamente
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-charcoal">
            Grupos
          </h2>
          <p className="text-muted-foreground mt-1">
            Cria e gere grupos para organizar os subscritores e enviar newsletters segmentadas.
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
            onClick={onRefreshGroups}
            className="border-beige-medium"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Groups List */}
      {groups.length === 0 && !groupError ? (
        <Card className="bg-cream border-beige-medium">
          <CardContent className="py-16 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-beige-medium mb-4">
              <FolderPlus className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-display text-xl font-semibold text-charcoal mb-2">
              Nenhum grupo criado
            </h3>
            <p className="text-muted-foreground mb-4">
              Cria grupos como &quot;VIPs&quot;, &quot;Administração&quot; ou &quot;Parceiros&quot; para organizar os subscritores.
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
        <div className="space-y-3">
          {groups.map((group) => (
            <Card
              key={group.id}
              className="bg-cream border-beige-medium hover:border-vermelho/30 transition-colors cursor-pointer"
              onClick={() => handleOpenGroup(group)}
            >
              <CardContent className="p-4">
                {editingGroup === group.id ? (
                  <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Nome do grupo"
                      className="bg-white flex-1"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit(group.id);
                        if (e.key === 'Escape') handleCancelEdit();
                      }}
                    />
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
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-vermelho/10 flex items-center justify-center shrink-0">
                        <Users className="h-5 w-5 text-vermelho" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-charcoal text-base">
                          {group.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {group.totalSubscribers} subscritor{group.totalSubscribers !== 1 ? 'es' : ''} &bull; Criado em {new Date(group.createdAt).toLocaleDateString('pt-PT')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleStartEdit(e, group)}
                        className="text-muted-foreground hover:text-charcoal"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDeleteDialog(group);
                        }}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <ChevronRight className="h-5 w-5 text-muted-foreground ml-1" />
                    </div>
                  </div>
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
                placeholder="Ex: VIPs, Parceiros, Administração..."
                value={newGroupName}
                onChange={(e) => { setNewGroupName(e.target.value); setNameError(''); }}
                className={nameError ? 'border-destructive' : ''}
                onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
              />
              {nameError && <p className="text-sm text-destructive">{nameError}</p>}
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" className="border-beige-medium">Cancelar</Button>
            </DialogClose>
            <Button onClick={handleCreate} disabled={saving} className="bg-vermelho hover:bg-vermelho/90">
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

      {/* Delete Group Dialog */}
      <Dialog open={!!showDeleteDialog} onOpenChange={() => setShowDeleteDialog(null)}>
        <DialogContent className="bg-cream border-beige-medium">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-charcoal">Eliminar Grupo</DialogTitle>
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
            <p className="text-sm text-muted-foreground">Esta ação não pode ser desfeita.</p>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" className="border-beige-medium">Cancelar</Button>
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
