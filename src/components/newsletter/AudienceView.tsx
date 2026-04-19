import { useState, useEffect } from 'react';
import {
  Users,
  RefreshCw,
  CheckCircle,
  XCircle,
  Plus,
  Trash2,
  UserPlus,
  ArrowRightLeft,
  Tag,
  X,
  Settings2,
  Pencil,
  Save,
  FolderPlus,
  TagIcon,
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

const TAG_COLORS = [
  { bg: 'bg-vermelho/10', text: 'text-vermelho', activeBg: 'bg-vermelho', activeText: 'text-white' },
  { bg: 'bg-blue-100', text: 'text-blue-700', activeBg: 'bg-blue-600', activeText: 'text-white' },
  { bg: 'bg-emerald-100', text: 'text-emerald-700', activeBg: 'bg-emerald-600', activeText: 'text-white' },
  { bg: 'bg-purple-100', text: 'text-purple-700', activeBg: 'bg-purple-600', activeText: 'text-white' },
  { bg: 'bg-amber-100', text: 'text-amber-700', activeBg: 'bg-amber-600', activeText: 'text-white' },
  { bg: 'bg-pink-100', text: 'text-pink-700', activeBg: 'bg-pink-600', activeText: 'text-white' },
  { bg: 'bg-cyan-100', text: 'text-cyan-700', activeBg: 'bg-cyan-600', activeText: 'text-white' },
  { bg: 'bg-orange-100', text: 'text-orange-700', activeBg: 'bg-orange-600', activeText: 'text-white' },
];

function getTagColor(index: number) {
  return TAG_COLORS[index % TAG_COLORS.length];
}

interface AudienceViewProps {
  subscribers: Subscriber[];
  total: number;
  groups: SubscriberGroup[];
  groupSubscribers: Subscriber[];
  totalGroupSubscribers: number;
  loading: boolean;
  loadingGroupSubscribers: boolean;
  adding: boolean;
  removing: string | null;
  moving: boolean;
  savingGroup: boolean;
  groupError: string | null;
  onRefresh: () => void;
  onRefreshGroups: () => void;
  onFetchGroupSubscribers: (listId: number) => void;
  onAdd: (email: string, nome?: string, listId?: number) => Promise<boolean>;
  onRemove: (email: string) => Promise<boolean>;
  onMoveSubscribers: (emails: string[], fromListId: number, toListId: number) => Promise<boolean>;
  onRemoveFromGroup: (emails: string[], listId: number) => Promise<boolean>;
  onAddToTag: (emails: string[], listId: number) => Promise<boolean>;
  onCreateGroup: (name: string) => Promise<boolean>;
  onUpdateGroup: (id: number, name: string) => Promise<boolean>;
  onDeleteGroup: (id: number) => Promise<boolean>;
}

export function AudienceView({
  subscribers,
  total,
  groups,
  groupSubscribers,
  totalGroupSubscribers,
  loading,
  loadingGroupSubscribers,
  adding,
  removing,
  moving,
  savingGroup,
  groupError,
  onRefresh,
  onRefreshGroups,
  onFetchGroupSubscribers,
  onAdd,
  onRemove,
  onMoveSubscribers,
  onRemoveFromGroup,
  onAddToTag,
  onCreateGroup,
  onUpdateGroup,
  onDeleteGroup,
}: AudienceViewProps) {
  const [activeTagId, setActiveTagId] = useState<number | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [showRemoveFromTagDialog, setShowRemoveFromTagDialog] = useState(false);
  const [showAddToTagDialog, setShowAddToTagDialog] = useState(false);
  const [showTagManager, setShowTagManager] = useState(false);
  const [showCreateTag, setShowCreateTag] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newNome, setNewNome] = useState('');
  const [addToTagId, setAddToTagId] = useState<string>('');
  const [emailError, setEmailError] = useState('');
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [moveTargetId, setMoveTargetId] = useState<string>('');
  const [addToTagTargetId, setAddToTagTargetId] = useState<string>('');
  const [newTagName, setNewTagName] = useState('');
  const [newTagError, setNewTagError] = useState('');
  const [editingTagId, setEditingTagId] = useState<number | null>(null);
  const [editTagName, setEditTagName] = useState('');
  const [deleteTagTarget, setDeleteTagTarget] = useState<SubscriberGroup | null>(null);

  const activeTag = groups.find((g) => g.id === activeTagId);
  const isFiltered = activeTagId !== null;
  const displayedSubscribers = isFiltered ? groupSubscribers : subscribers;
  const displayedTotal = isFiltered ? totalGroupSubscribers : total;
  const isLoadingList = isFiltered ? loadingGroupSubscribers : loading;

  useEffect(() => {
    if (activeTagId) {
      onFetchGroupSubscribers(activeTagId);
    }
    setSelectedEmails(new Set());
  }, [activeTagId]);

  const handleTagClick = (tagId: number | null) => {
    if (tagId === activeTagId) return;
    setActiveTagId(tagId);
    if (!tagId) onRefresh();
  };

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleAdd = async () => {
    setEmailError('');
    if (!newEmail.trim()) { setEmailError('Email é obrigatório'); return; }
    if (!validateEmail(newEmail)) { setEmailError('Email inválido'); return; }

    const listId = addToTagId && addToTagId !== 'default' ? parseInt(addToTagId) : undefined;
    const success = await onAdd(newEmail.trim(), newNome.trim() || undefined, listId);
    if (success) {
      setShowAddDialog(false);
      setNewEmail('');
      setNewNome('');
      setAddToTagId('');
      refreshCurrentView();
    }
  };

  const handleDelete = async (email: string) => {
    const success = await onRemove(email);
    if (success) {
      setShowDeleteDialog(null);
      refreshCurrentView();
    }
  };

  const refreshCurrentView = () => {
    if (activeTagId) onFetchGroupSubscribers(activeTagId);
    else onRefresh();
    onRefreshGroups();
  };

  const toggleSelect = (email: string) => {
    setSelectedEmails((prev) => {
      const next = new Set(prev);
      next.has(email) ? next.delete(email) : next.add(email);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedEmails(
      selectedEmails.size === displayedSubscribers.length
        ? new Set()
        : new Set(displayedSubscribers.map((s) => s.email))
    );
  };

  // Move subscribers between tags
  const handleMove = async () => {
    if (!moveTargetId || !activeTagId || selectedEmails.size === 0) return;
    const success = await onMoveSubscribers(Array.from(selectedEmails), activeTagId, parseInt(moveTargetId));
    if (success) {
      setShowMoveDialog(false);
      setSelectedEmails(new Set());
      setMoveTargetId('');
      refreshCurrentView();
    }
  };

  // Remove subscribers from current tag
  const handleRemoveFromTag = async () => {
    if (!activeTagId || selectedEmails.size === 0) return;
    const success = await onRemoveFromGroup(Array.from(selectedEmails), activeTagId);
    if (success) {
      setShowRemoveFromTagDialog(false);
      setSelectedEmails(new Set());
      refreshCurrentView();
    }
  };

  // Add existing subscribers to a tag (from "Todos" view)
  const handleAddToTag = async () => {
    if (!addToTagTargetId || selectedEmails.size === 0) return;
    const success = await onAddToTag(Array.from(selectedEmails), parseInt(addToTagTargetId));
    if (success) {
      setShowAddToTagDialog(false);
      setSelectedEmails(new Set());
      setAddToTagTargetId('');
      onRefreshGroups();
    }
  };

  const handleCreateTag = async () => {
    setNewTagError('');
    if (!newTagName.trim()) { setNewTagError('Nome é obrigatório'); return; }
    const success = await onCreateGroup(newTagName.trim());
    if (success) { setShowCreateTag(false); setNewTagName(''); }
  };

  const handleSaveTagEdit = async (id: number) => {
    if (!editTagName.trim()) return;
    const success = await onUpdateGroup(id, editTagName.trim());
    if (success) { setEditingTagId(null); setEditTagName(''); }
  };

  const handleDeleteTag = async () => {
    if (!deleteTagTarget) return;
    const success = await onDeleteGroup(deleteTagTarget.id);
    if (success) {
      setDeleteTagTarget(null);
      if (activeTagId === deleteTagTarget.id) setActiveTagId(null);
    }
  };

  if (loading && !isFiltered) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-12 h-12 border-4 border-vermelho/20 border-t-vermelho rounded-full animate-spin mb-4" />
        <p className="text-muted-foreground">Carregando audiência...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Group Error */}
      {groupError && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm flex items-center justify-between">
          <span>{groupError}</span>
          <Button variant="ghost" size="sm" onClick={onRefreshGroups} className="text-amber-800 hover:text-amber-900 underline p-0 h-auto text-sm">
            Tentar novamente
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-charcoal">Audiência</h2>
          <p className="text-muted-foreground mt-1">
            {isFiltered
              ? <>{displayedTotal} subscritor{displayedTotal !== 1 ? 'es' : ''} na tag <strong>{activeTag?.name}</strong></>
              : <>{total} subscritor{total !== 1 ? 'es' : ''} &bull; {groups.length} tag{groups.length !== 1 ? 's' : ''}</>
            }
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowAddDialog(true)} className="bg-vermelho hover:bg-vermelho/90">
            <UserPlus className="h-4 w-4 mr-2" />
            Adicionar
          </Button>
          <Button variant="outline" onClick={() => setShowTagManager(true)} className="border-beige-medium">
            <Settings2 className="h-4 w-4 mr-2" />
            Tags
          </Button>
          <Button variant="outline" onClick={refreshCurrentView} className="border-beige-medium">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tag Filter Pills */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleTagClick(null)}
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all ${
            !isFiltered
              ? 'bg-charcoal text-white shadow-sm'
              : 'bg-beige-light text-charcoal hover:bg-beige-medium'
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          Todos
          <span className="text-xs opacity-70">({total})</span>
        </button>

        {groups.map((group, index) => {
          const color = getTagColor(index);
          const isActive = activeTagId === group.id;
          // When active and loaded, show the real fetched count
          const count = isActive && !loadingGroupSubscribers ? totalGroupSubscribers : group.totalSubscribers;
          return (
            <button
              key={group.id}
              onClick={() => handleTagClick(group.id)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all ${
                isActive
                  ? `${color.activeBg} ${color.activeText} shadow-sm`
                  : `${color.bg} ${color.text} hover:opacity-80`
              }`}
            >
              <Tag className="h-3 w-3" />
              {group.name}
              <span className="text-xs opacity-70">
                ({isActive && loadingGroupSubscribers ? '...' : count})
              </span>
            </button>
          );
        })}

        <button
          onClick={() => setShowCreateTag(true)}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium text-muted-foreground border border-dashed border-beige-medium hover:border-vermelho hover:text-vermelho transition-colors"
        >
          <Plus className="h-3 w-3" />
          Nova tag
        </button>
      </div>

      {/* Bulk Actions Bar */}
      {selectedEmails.size > 0 && (
        <div className="sticky top-2 z-10">
          <Card className="bg-charcoal border-none shadow-lg">
            <CardContent className="p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-white">
                  {selectedEmails.size} selecionado{selectedEmails.size > 1 ? 's' : ''}
                </span>
                <button onClick={() => setSelectedEmails(new Set())} className="text-xs text-white/60 hover:text-white underline">
                  Limpar
                </button>
              </div>
              <div className="flex gap-2 flex-wrap">
                {/* In "Todos" view: Add to tag */}
                {!isFiltered && groups.length > 0 && (
                  <Button size="sm" variant="secondary" onClick={() => setShowAddToTagDialog(true)} disabled={moving}>
                    <TagIcon className="h-3.5 w-3.5 mr-1.5" />
                    Adicionar a tag...
                  </Button>
                )}
                {/* In tag view: Move to another tag */}
                {isFiltered && groups.length > 1 && (
                  <Button size="sm" variant="secondary" onClick={() => setShowMoveDialog(true)} disabled={moving}>
                    <ArrowRightLeft className="h-3.5 w-3.5 mr-1.5" />
                    Mover para...
                  </Button>
                )}
                {/* In tag view: Remove from tag */}
                {isFiltered && (
                  <Button size="sm" variant="secondary" onClick={() => setShowRemoveFromTagDialog(true)} disabled={moving}
                    className="text-amber-700 bg-amber-100 hover:bg-amber-200 border-0">
                    <X className="h-3.5 w-3.5 mr-1.5" />
                    Remover da tag
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Subscriber Table */}
      {isLoadingList ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-10 h-10 border-4 border-vermelho/20 border-t-vermelho rounded-full animate-spin mb-3" />
          <p className="text-muted-foreground text-sm">Carregando...</p>
        </div>
      ) : displayedSubscribers.length === 0 ? (
        <Card className="bg-cream border-beige-medium">
          <CardContent className="py-14 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-beige-medium mb-4">
              <Users className="h-7 w-7 text-muted-foreground" />
            </div>
            {isFiltered ? (
              <>
                <h3 className="font-display text-lg font-semibold text-charcoal mb-2">
                  Tag &quot;{activeTag?.name}&quot; está vazia
                </h3>
                <p className="text-muted-foreground mb-4 text-sm max-w-md mx-auto">
                  Vai a <button onClick={() => setActiveTagId(null)} className="text-vermelho font-medium hover:underline">Todos</button>,
                  seleciona os subscritores que queres e clica em &quot;Adicionar a tag&quot;.
                </p>
              </>
            ) : (
              <>
                <h3 className="font-display text-lg font-semibold text-charcoal mb-2">Nenhum subscritor</h3>
                <p className="text-muted-foreground mb-4 text-sm">Os subscritores aparecerão aqui quando se inscreverem.</p>
                <Button onClick={() => setShowAddDialog(true)} className="bg-vermelho hover:bg-vermelho/90">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Adicionar subscritor
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-cream border-beige-medium overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-beige-medium bg-beige-light/50">
                  <th className="w-10 px-3 py-3">
                    <Checkbox
                      checked={selectedEmails.size === displayedSubscribers.length && displayedSubscribers.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </th>
                  <th className="text-left px-3 py-3 text-sm font-semibold text-charcoal">Email</th>
                  <th className="text-left px-3 py-3 text-sm font-semibold text-charcoal hidden sm:table-cell">Nome</th>
                  <th className="text-left px-3 py-3 text-sm font-semibold text-charcoal hidden md:table-cell">Data</th>
                  <th className="text-center px-3 py-3 text-sm font-semibold text-charcoal">Estado</th>
                  <th className="w-12 px-3 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {displayedSubscribers.map((sub, i) => (
                  <tr
                    key={sub.id}
                    className={`border-b border-beige-medium/50 transition-colors ${
                      selectedEmails.has(sub.email)
                        ? 'bg-vermelho/5'
                        : i % 2 === 0 ? 'bg-white' : 'bg-cream'
                    }`}
                  >
                    <td className="w-10 px-3 py-3">
                      <Checkbox checked={selectedEmails.has(sub.email)} onCheckedChange={() => toggleSelect(sub.email)} />
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-sm font-medium text-charcoal">{sub.email}</div>
                      <div className="text-xs text-muted-foreground sm:hidden">{sub.nome || ''}</div>
                    </td>
                    <td className="px-3 py-3 text-sm text-muted-foreground hidden sm:table-cell">{sub.nome || '-'}</td>
                    <td className="px-3 py-3 text-sm text-muted-foreground hidden md:table-cell">
                      {new Date(sub.createdAt).toLocaleDateString('pt-PT')}
                    </td>
                    <td className="px-3 py-3 text-center">
                      {sub.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          <CheckCircle className="h-3 w-3" />Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                          <XCircle className="h-3 w-3" />Inativo
                        </span>
                      )}
                    </td>
                    <td className="w-12 px-3 py-3 text-center">
                      <Button variant="ghost" size="sm" onClick={() => setShowDeleteDialog(sub.email)}
                        disabled={removing === sub.email} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0">
                        {removing === sub.email ? (
                          <div className="h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {displayedTotal > displayedSubscribers.length && (
            <div className="px-4 py-3 text-center text-sm text-muted-foreground border-t border-beige-medium/50">
              A mostrar {displayedSubscribers.length} de {displayedTotal}
            </div>
          )}
        </Card>
      )}

      {/* ===== DIALOGS ===== */}

      {/* Add Subscriber */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-cream border-beige-medium">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-charcoal">Adicionar Subscritor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="add-email">Email *</Label>
              <Input id="add-email" type="email" placeholder="email@exemplo.com" value={newEmail}
                onChange={(e) => { setNewEmail(e.target.value); setEmailError(''); }}
                className={emailError ? 'border-destructive' : ''} />
              {emailError && <p className="text-sm text-destructive">{emailError}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-nome">Nome (opcional)</Label>
              <Input id="add-nome" type="text" placeholder="Nome" value={newNome}
                onChange={(e) => setNewNome(e.target.value)} />
            </div>
            {groups.length > 0 && (
              <div className="space-y-2">
                <Label>Tag (opcional)</Label>
                <Select value={addToTagId} onValueChange={setAddToTagId}>
                  <SelectTrigger className="bg-white"><SelectValue placeholder="Sem tag" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Sem tag</SelectItem>
                    {groups.map((g) => (
                      <SelectItem key={g.id} value={g.id.toString()}>{g.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline" className="border-beige-medium">Cancelar</Button></DialogClose>
            <Button onClick={handleAdd} disabled={adding} className="bg-vermelho hover:bg-vermelho/90">
              {adding ? <><div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />Adicionando...</>
                : <><UserPlus className="h-4 w-4 mr-2" />Adicionar</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Subscriber */}
      <Dialog open={!!showDeleteDialog} onOpenChange={() => setShowDeleteDialog(null)}>
        <DialogContent className="bg-cream border-beige-medium">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-charcoal">Remover Subscritor</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground py-2">Remover <strong className="text-charcoal">{showDeleteDialog}</strong> permanentemente?</p>
          <p className="text-sm text-muted-foreground">O email será eliminado de todos os grupos.</p>
          <DialogFooter className="mt-4">
            <DialogClose asChild><Button variant="outline" className="border-beige-medium">Cancelar</Button></DialogClose>
            <Button variant="destructive" onClick={() => showDeleteDialog && handleDelete(showDeleteDialog)} disabled={!!removing}>
              {removing ? <><div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />Removendo...</>
                : <><Trash2 className="h-4 w-4 mr-2" />Remover</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add to Tag (from Todos view) */}
      <Dialog open={showAddToTagDialog} onOpenChange={setShowAddToTagDialog}>
        <DialogContent className="bg-cream border-beige-medium">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-charcoal">Adicionar a Tag</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-muted-foreground text-sm">
              Adicionar <strong className="text-charcoal">{selectedEmails.size}</strong> subscritor{selectedEmails.size > 1 ? 'es' : ''} à tag:
            </p>
            <Select value={addToTagTargetId} onValueChange={setAddToTagTargetId}>
              <SelectTrigger className="bg-white"><SelectValue placeholder="Selecionar tag..." /></SelectTrigger>
              <SelectContent>
                {groups.map((g) => (
                  <SelectItem key={g.id} value={g.id.toString()}>{g.name} ({g.totalSubscribers})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Os subscritores continuam na lista principal.</p>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline" className="border-beige-medium">Cancelar</Button></DialogClose>
            <Button onClick={handleAddToTag} disabled={!addToTagTargetId || moving} className="bg-vermelho hover:bg-vermelho/90">
              {moving ? <><div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />Adicionando...</>
                : <><TagIcon className="h-4 w-4 mr-2" />Adicionar</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move Subscribers */}
      <Dialog open={showMoveDialog} onOpenChange={setShowMoveDialog}>
        <DialogContent className="bg-cream border-beige-medium">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-charcoal">Mover Subscritores</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-muted-foreground text-sm">
              Mover <strong className="text-charcoal">{selectedEmails.size}</strong> de <strong className="text-charcoal">{activeTag?.name}</strong> para:
            </p>
            <Select value={moveTargetId} onValueChange={setMoveTargetId}>
              <SelectTrigger className="bg-white"><SelectValue placeholder="Selecionar tag..." /></SelectTrigger>
              <SelectContent>
                {groups.filter((g) => g.id !== activeTagId).map((g) => (
                  <SelectItem key={g.id} value={g.id.toString()}>{g.name} ({g.totalSubscribers})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline" className="border-beige-medium">Cancelar</Button></DialogClose>
            <Button onClick={handleMove} disabled={!moveTargetId || moving} className="bg-vermelho hover:bg-vermelho/90">
              {moving ? <><div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />Movendo...</>
                : <><ArrowRightLeft className="h-4 w-4 mr-2" />Mover</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove from Tag */}
      <Dialog open={showRemoveFromTagDialog} onOpenChange={setShowRemoveFromTagDialog}>
        <DialogContent className="bg-cream border-beige-medium">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-charcoal">Remover da Tag</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground py-2 text-sm">
            Remover <strong className="text-charcoal">{selectedEmails.size}</strong> subscritor{selectedEmails.size > 1 ? 'es' : ''} da tag
            <strong className="text-charcoal"> &quot;{activeTag?.name}&quot;</strong>? Os contactos não serão eliminados.
          </p>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline" className="border-beige-medium">Cancelar</Button></DialogClose>
            <Button variant="destructive" onClick={handleRemoveFromTag} disabled={moving}>
              {moving ? <><div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />Removendo...</>
                : <><X className="h-4 w-4 mr-2" />Remover</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Tag */}
      <Dialog open={showCreateTag} onOpenChange={setShowCreateTag}>
        <DialogContent className="bg-cream border-beige-medium">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-charcoal">Nova Tag</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tag-name">Nome *</Label>
              <Input id="tag-name" placeholder="Ex: VIPs, Parceiros, Administração..." value={newTagName}
                onChange={(e) => { setNewTagName(e.target.value); setNewTagError(''); }}
                className={newTagError ? 'border-destructive' : ''}
                onKeyDown={(e) => { if (e.key === 'Enter') handleCreateTag(); }} />
              {newTagError && <p className="text-sm text-destructive">{newTagError}</p>}
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline" className="border-beige-medium">Cancelar</Button></DialogClose>
            <Button onClick={handleCreateTag} disabled={savingGroup} className="bg-vermelho hover:bg-vermelho/90">
              {savingGroup ? <><div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />Criando...</>
                : <><FolderPlus className="h-4 w-4 mr-2" />Criar Tag</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tag Manager */}
      <Dialog open={showTagManager} onOpenChange={setShowTagManager}>
        <DialogContent className="bg-cream border-beige-medium max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-charcoal">Gerir Tags</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-3">
            {groups.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-6">Nenhuma tag criada.</p>
            ) : (
              groups.map((group, index) => {
                const color = getTagColor(index);
                return (
                  <div key={group.id} className="flex items-center gap-3 p-3 rounded-lg bg-white border border-beige-medium/50">
                    {editingTagId === group.id ? (
                      <>
                        <Input value={editTagName} onChange={(e) => setEditTagName(e.target.value)} className="flex-1 h-8 text-sm" autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveTagEdit(group.id);
                            if (e.key === 'Escape') { setEditingTagId(null); setEditTagName(''); }
                          }} />
                        <Button size="sm" onClick={() => handleSaveTagEdit(group.id)} disabled={savingGroup || !editTagName.trim()}
                          className="bg-vermelho hover:bg-vermelho/90 h-8 w-8 p-0"><Save className="h-3.5 w-3.5" /></Button>
                        <Button size="sm" variant="outline" onClick={() => { setEditingTagId(null); setEditTagName(''); }}
                          className="border-beige-medium h-8 w-8 p-0"><X className="h-3.5 w-3.5" /></Button>
                      </>
                    ) : (
                      <>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${color.bg} ${color.text}`}>
                          <Tag className="h-3 w-3" />{group.name}
                        </span>
                        <span className="text-xs text-muted-foreground ml-auto">{group.totalSubscribers} sub.</span>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-charcoal"
                          onClick={() => { setEditingTagId(group.id); setEditTagName(group.name); }}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                          onClick={() => setDeleteTagTarget(group)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => { setShowTagManager(false); setShowCreateTag(true); }} variant="outline" className="border-beige-medium mr-auto">
              <Plus className="h-4 w-4 mr-2" />Nova Tag
            </Button>
            <DialogClose asChild><Button className="bg-vermelho hover:bg-vermelho/90">Fechar</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Tag */}
      <Dialog open={!!deleteTagTarget} onOpenChange={() => setDeleteTagTarget(null)}>
        <DialogContent className="bg-cream border-beige-medium">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-charcoal">Eliminar Tag</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <p className="text-muted-foreground">Eliminar a tag <strong className="text-charcoal">&quot;{deleteTagTarget?.name}&quot;</strong>?</p>
            {deleteTagTarget && deleteTagTarget.totalSubscribers > 0 && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2 rounded-lg text-sm">
                <strong>{deleteTagTarget.totalSubscribers}</strong> subscritor(es) serão removidos desta tag (não eliminados).
              </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline" className="border-beige-medium">Cancelar</Button></DialogClose>
            <Button variant="destructive" onClick={handleDeleteTag} disabled={savingGroup}>
              {savingGroup ? <><div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />Eliminando...</>
                : <><Trash2 className="h-4 w-4 mr-2" />Eliminar</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
