import { useState } from 'react';
import { Send, FlaskConical, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
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

type SendTarget = 'all' | 'selected';

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
  const [sendTarget, setSendTarget] = useState<SendTarget>('all');
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<number>>(new Set());

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
    const listIds = sendTarget === 'selected' && selectedGroupIds.size > 0
      ? Array.from(selectedGroupIds)
      : undefined;

    const success = await onSend(subject, blocks, listIds);
    if (success) {
      setConfirmDialogOpen(false);
      setSuccessMessage('Newsletter enviada com sucesso!');
      setSubject('');
      setBlocks([]);
      setTimeout(() => setSuccessMessage(null), 5000);
    }
  };

  const toggleGroupSelection = (groupId: number) => {
    setSelectedGroupIds((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const hasContent = blocks.some((block) => {
    if (block.type === 'text') {
      return block.content.trim().length > 0;
    }
    if (block.type === 'image') {
      return !!block.imageUrl;
    }
    return false;
  });
  const canSend = subject.trim() && hasContent;

  const selectedGroupCount = sendTarget === 'selected'
    ? groups.filter((g) => selectedGroupIds.has(g.id)).reduce((sum, g) => sum + g.totalSubscribers, 0)
    : totalSubscribers;

  const recipientLabel = sendTarget === 'all'
    ? `${totalSubscribers} subscritores (todos)`
    : `${selectedGroupCount} subscritores (${selectedGroupIds.size} grupo${selectedGroupIds.size !== 1 ? 's' : ''})`;

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
        <h2 className="font-display text-2xl font-bold text-charcoal">
          Compor Newsletter
        </h2>
        <p className="text-muted-foreground mt-1">
          Cria o conteúdo e envia para {recipientLabel}
        </p>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column - Form */}
        <div className="space-y-6">
          {/* Subject */}
          <Card className="bg-cream border-beige-medium">
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Assunto do Email</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Ex: Novidades e promoções desta semana!"
                  className="bg-white"
                />
              </div>
            </CardContent>
          </Card>

          {/* Send Target */}
          {groups.length > 0 && (
            <Card className="bg-cream border-beige-medium">
              <CardContent className="p-4 space-y-4">
                <Label className="text-base font-semibold">Enviar para</Label>

                <div className="space-y-3">
                  {/* All option */}
                  <label className="flex items-center gap-3 p-3 rounded-lg border border-beige-medium bg-white cursor-pointer hover:bg-beige-light/50 transition-colors">
                    <input
                      type="radio"
                      name="sendTarget"
                      value="all"
                      checked={sendTarget === 'all'}
                      onChange={() => setSendTarget('all')}
                      className="w-4 h-4 text-vermelho accent-vermelho"
                    />
                    <div>
                      <span className="font-medium text-charcoal">Todos os subscritores</span>
                      <span className="text-sm text-muted-foreground ml-2">({totalSubscribers})</span>
                    </div>
                  </label>

                  {/* Selected groups option */}
                  <label className="flex items-center gap-3 p-3 rounded-lg border border-beige-medium bg-white cursor-pointer hover:bg-beige-light/50 transition-colors">
                    <input
                      type="radio"
                      name="sendTarget"
                      value="selected"
                      checked={sendTarget === 'selected'}
                      onChange={() => setSendTarget('selected')}
                      className="w-4 h-4 text-vermelho accent-vermelho"
                    />
                    <div>
                      <span className="font-medium text-charcoal">Grupos específicos</span>
                    </div>
                  </label>

                  {/* Group checkboxes */}
                  {sendTarget === 'selected' && (
                    <div className="ml-7 space-y-2 border-l-2 border-vermelho/20 pl-4">
                      {groups.map((group) => (
                        <label
                          key={group.id}
                          className="flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-beige-light/50 transition-colors"
                        >
                          <Checkbox
                            checked={selectedGroupIds.has(group.id)}
                            onCheckedChange={() => toggleGroupSelection(group.id)}
                          />
                          <span className="text-sm text-charcoal">{group.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({group.totalSubscribers})
                          </span>
                        </label>
                      ))}
                      {selectedGroupIds.size === 0 && (
                        <p className="text-sm text-amber-600">
                          Seleciona pelo menos um grupo.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

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
              disabled={!canSend || sending || (sendTarget === 'selected' && selectedGroupIds.size === 0)}
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
            <DialogTitle className="font-display text-xl text-charcoal">
              Enviar Email de Teste
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Envia uma pré-visualização para verificar como o email aparece.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <Label htmlFor="test-email">Email de teste</Label>
            <Input
              id="test-email"
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="teste@exemplo.com"
              className="bg-white"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setTestDialogOpen(false)}
              disabled={sending}
              className="border-beige-medium"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSendTest}
              disabled={!testEmail || sending}
              className="bg-vermelho hover:bg-vermelho-dark text-white"
            >
              {sending ? 'Enviando...' : 'Enviar Teste'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Send Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="bg-cream border-beige-medium">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-charcoal">
              Confirmar Envio
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Tens a certeza que queres enviar esta newsletter?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <p className="text-sm">
              <strong>Assunto:</strong> {subject}
            </p>
            <p className="text-sm">
              <strong>Blocos de conteúdo:</strong> {blocks.filter((block) => {
                if (block.type === 'text') return block.content.trim().length > 0;
                if (block.type === 'image') return !!block.imageUrl;
                return false;
              }).length}
            </p>
            <p className="text-sm">
              <strong>Destinatários:</strong> {recipientLabel}
            </p>
            {sendTarget === 'selected' && selectedGroupIds.size > 0 && (
              <div className="mt-2 p-3 bg-beige-light/50 rounded-lg">
                <p className="text-xs font-medium text-muted-foreground mb-1">Grupos selecionados:</p>
                <div className="flex flex-wrap gap-1">
                  {groups
                    .filter((g) => selectedGroupIds.has(g.id))
                    .map((g) => (
                      <span
                        key={g.id}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-vermelho/10 text-vermelho"
                      >
                        {g.name}
                      </span>
                    ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setConfirmDialogOpen(false)}
              disabled={sending}
              className="border-beige-medium"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSend}
              disabled={sending}
              className="bg-vermelho hover:bg-vermelho-dark text-white"
            >
              {sending ? 'Enviando...' : 'Confirmar Envio'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
