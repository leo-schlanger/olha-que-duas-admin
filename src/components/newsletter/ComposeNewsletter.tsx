import { useState } from 'react';
import { Send, FlaskConical, AlertCircle, Users, Tag, X } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { BlockEditor } from './BlockEditor';
import { EmailPreview } from './EmailPreview';
import type { ContentBlock, SubscriberGroup } from '../../types';

interface ComposeNewsletterProps {
  totalSubscribers: number;
  groups: SubscriberGroup[];
  sending: boolean;
  onSend: (subject: string, blocks: ContentBlock[], listIds?: number[]) => Promise<boolean>;
  onSendTest: (
    subject: string,
    blocks: ContentBlock[],
    testEmail: string
  ) => Promise<boolean>;
}

export function ComposeNewsletter({
  totalSubscribers,
  groups,
  sending,
  onSend,
  onSendTest,
}: ComposeNewsletterProps) {
  const [subject, setSubject] = useState('');
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<Set<number>>(new Set());

  const sendingToAll = selectedTagIds.size === 0;

  const toggleTag = (id: number) => {
    setSelectedTagIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const removeTag = (id: number) => {
    setSelectedTagIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const selectedGroups = groups.filter((g) => selectedTagIds.has(g.id));
  const recipientCount = sendingToAll
    ? totalSubscribers
    : selectedGroups.reduce((sum, g) => sum + g.totalSubscribers, 0);

  const handleSendTest = async () => {
    if (!testEmail) return;
    const success = await onSendTest(subject, blocks, testEmail);
    if (success) {
      setTestDialogOpen(false);
      setSuccessMessage(`Email de teste enviado para ${testEmail}`);
      setTimeout(() => setSuccessMessage(null), 5000);
    }
  };

  const handleSend = async () => {
    const listIds = sendingToAll ? undefined : Array.from(selectedTagIds);
    const success = await onSend(subject, blocks, listIds);
    if (success) {
      setConfirmDialogOpen(false);
      setSuccessMessage('Newsletter enviada com sucesso!');
      setSubject('');
      setBlocks([]);
      setSelectedTagIds(new Set());
      setTimeout(() => setSuccessMessage(null), 5000);
    }
  };

  const hasContent = blocks.some((block) => {
    if (block.type === 'text') return block.content.trim().length > 0;
    if (block.type === 'image') return !!block.imageUrl;
    return false;
  });
  const canSend = subject.trim() && hasContent;

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2 animate-fade-in">
          <AlertCircle className="h-5 w-5" />
          {successMessage}
        </div>
      )}

      {/* Header */}
      <div>
        <h2 className="font-display text-2xl font-bold text-charcoal">Compor Newsletter</h2>
        <p className="text-muted-foreground mt-1">
          Cria e envia para {recipientCount} subscritor{recipientCount !== 1 ? 'es' : ''}
        </p>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Subject + Recipients */}
          <Card className="bg-cream border-beige-medium">
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Assunto</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Ex: Novidades da semana!"
                  className="bg-white"
                />
              </div>

              {/* Recipients */}
              <div className="space-y-2">
                <Label>Destinatários</Label>
                <div className="flex flex-wrap gap-2 p-3 rounded-lg border border-beige-medium bg-white min-h-[44px]">
                  {sendingToAll ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-charcoal text-white">
                      <Users className="h-3 w-3" />
                      Todos ({totalSubscribers})
                    </span>
                  ) : (
                    selectedGroups.map((g) => (
                      <span key={g.id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-medium bg-vermelho/10 text-vermelho">
                        <Tag className="h-3 w-3" />
                        {g.name}
                        <button onClick={() => removeTag(g.id)} className="ml-0.5 hover:bg-vermelho/20 rounded-full p-0.5">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))
                  )}
                </div>

                {groups.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <button
                      onClick={() => setSelectedTagIds(new Set())}
                      className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                        sendingToAll
                          ? 'bg-charcoal text-white'
                          : 'bg-beige-light text-muted-foreground hover:bg-beige-medium'
                      }`}
                    >
                      Todos
                    </button>
                    {groups.map((g) => (
                      <button
                        key={g.id}
                        onClick={() => toggleTag(g.id)}
                        className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                          selectedTagIds.has(g.id)
                            ? 'bg-vermelho text-white'
                            : 'bg-beige-light text-muted-foreground hover:bg-beige-medium'
                        }`}
                      >
                        {g.name} ({g.totalSubscribers})
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Block Editor */}
          <Card className="bg-cream border-beige-medium">
            <CardContent className="p-4">
              <BlockEditor blocks={blocks} onChange={setBlocks} />
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setTestDialogOpen(true)}
              disabled={!canSend || sending}
              className="flex-1 border-beige-medium"
            >
              <FlaskConical className="h-4 w-4 mr-2" />
              Enviar Teste
            </Button>
            <Button
              onClick={() => setConfirmDialogOpen(true)}
              disabled={!canSend || sending}
              className="flex-1 bg-vermelho hover:bg-vermelho-dark text-white"
            >
              <Send className="h-4 w-4 mr-2" />
              Enviar Newsletter
            </Button>
          </div>
        </div>

        {/* Right Column - Preview */}
        <div>
          <Card className="bg-cream border-beige-medium sticky top-24">
            <CardContent className="p-4">
              <EmailPreview subject={subject} blocks={blocks} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Test Email Dialog */}
      <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
        <DialogContent className="bg-cream border-beige-medium">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-charcoal">Enviar Teste</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Pré-visualização para verificar o email antes de enviar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <Label htmlFor="test-email">Email de teste</Label>
            <Input id="test-email" type="email" value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)} placeholder="teste@exemplo.com" className="bg-white" />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setTestDialogOpen(false)} disabled={sending} className="border-beige-medium">
              Cancelar
            </Button>
            <Button onClick={handleSendTest} disabled={!testEmail || sending} className="bg-vermelho hover:bg-vermelho-dark text-white">
              {sending ? 'Enviando...' : 'Enviar Teste'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Send Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="bg-cream border-beige-medium">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-charcoal">Confirmar Envio</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <div className="space-y-2 text-sm">
              <p><strong>Assunto:</strong> {subject}</p>
              <p><strong>Conteúdo:</strong> {blocks.filter((b) => {
                if (b.type === 'text') return b.content.trim().length > 0;
                if (b.type === 'image') return !!b.imageUrl;
                return false;
              }).length} blocos</p>
            </div>

            <div className="p-3 rounded-lg bg-beige-light/50 border border-beige-medium/50">
              <p className="text-xs font-medium text-muted-foreground mb-2">Destinatários</p>
              <div className="flex flex-wrap gap-1.5">
                {sendingToAll ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-charcoal text-white">
                    <Users className="h-3 w-3" />
                    Todos ({totalSubscribers})
                  </span>
                ) : (
                  selectedGroups.map((g) => (
                    <span key={g.id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-vermelho/10 text-vermelho">
                      <Tag className="h-3 w-3" />
                      {g.name} ({g.totalSubscribers})
                    </span>
                  ))
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Total: <strong className="text-charcoal">{recipientCount}</strong> subscritor{recipientCount !== 1 ? 'es' : ''}
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)} disabled={sending} className="border-beige-medium">
              Cancelar
            </Button>
            <Button onClick={handleSend} disabled={sending} className="bg-vermelho hover:bg-vermelho-dark text-white">
              {sending ? 'Enviando...' : 'Confirmar Envio'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
