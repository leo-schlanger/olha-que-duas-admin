import { useState } from 'react';
import { Send, FlaskConical, AlertCircle } from 'lucide-react';
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
import { BlogPostSelector, blogPostToNewsletterPost } from './BlogPostSelector';
import { EmailPreview } from './EmailPreview';
import type { BlogPost, NewsletterPost } from '../../types';

interface ComposeNewsletterProps {
  posts: BlogPost[];
  postsLoading: boolean;
  totalSubscribers: number;
  sending: boolean;
  onRefreshPosts: () => void;
  onSend: (subject: string, posts: NewsletterPost[]) => Promise<boolean>;
  onSendTest: (
    subject: string,
    posts: NewsletterPost[],
    testEmail: string
  ) => Promise<boolean>;
}

export function ComposeNewsletter({
  posts,
  postsLoading,
  totalSubscribers,
  sending,
  onRefreshPosts,
  onSend,
  onSendTest,
}: ComposeNewsletterProps) {
  const [subject, setSubject] = useState('');
  const [selectedPostIds, setSelectedPostIds] = useState<string[]>([]);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const selectedPosts: NewsletterPost[] = posts
    .filter((p) => selectedPostIds.includes(p.id))
    .map(blogPostToNewsletterPost);

  const handleTogglePost = (postId: string) => {
    setSelectedPostIds((prev) =>
      prev.includes(postId)
        ? prev.filter((id) => id !== postId)
        : [...prev, postId]
    );
  };

  const handleSendTest = async () => {
    if (!testEmail) return;
    const success = await onSendTest(subject, selectedPosts, testEmail);
    if (success) {
      setTestDialogOpen(false);
      setSuccessMessage(`Email de teste enviado para ${testEmail}`);
      setTimeout(() => setSuccessMessage(null), 5000);
    }
  };

  const handleSend = async () => {
    const success = await onSend(subject, selectedPosts);
    if (success) {
      setConfirmDialogOpen(false);
      setSuccessMessage('Newsletter enviada com sucesso!');
      setSubject('');
      setSelectedPostIds([]);
      setTimeout(() => setSuccessMessage(null), 5000);
    }
  };

  const canSend = subject.trim() && selectedPosts.length > 0;

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
          Seleciona as notícias e envia para {totalSubscribers} subscritores
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
                  placeholder="Ex: As novidades desta semana!"
                  className="bg-white"
                />
              </div>
            </CardContent>
          </Card>

          {/* Post Selector */}
          <Card className="bg-cream border-beige-medium">
            <CardContent className="p-4">
              <BlogPostSelector
                posts={posts}
                selectedPosts={selectedPostIds}
                loading={postsLoading}
                onTogglePost={handleTogglePost}
                onRefresh={onRefreshPosts}
              />
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
              <EmailPreview subject={subject} posts={selectedPosts} />
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
              Tens a certeza que queres enviar esta newsletter para{' '}
              <strong>{totalSubscribers} subscritores</strong>?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <p className="text-sm">
              <strong>Assunto:</strong> {subject}
            </p>
            <p className="text-sm">
              <strong>Notícias:</strong> {selectedPosts.length}
            </p>
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
