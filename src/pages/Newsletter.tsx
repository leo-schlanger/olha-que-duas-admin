import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { PenLine, Users, History } from 'lucide-react';
import { useNewsletter } from '../hooks/useNewsletter';
import { useBlogPosts } from '../hooks/useBlogPosts';
import { ComposeNewsletter } from '../components/newsletter/ComposeNewsletter';
import { SubscriberList } from '../components/newsletter/SubscriberList';
import { Card, CardContent } from '../components/ui/card';
import type { NewsletterPost } from '../types';

export function Newsletter() {
  const [activeTab, setActiveTab] = useState('compose');

  const {
    subscribers,
    totalSubscribers,
    loading: subscribersLoading,
    sending,
    error: newsletterError,
    fetchSubscribers,
    sendNewsletter,
    sendTestEmail,
  } = useNewsletter();

  const {
    posts,
    loading: postsLoading,
    error: postsError,
    fetchPosts,
  } = useBlogPosts();

  const handleSend = async (
    subject: string,
    noticias: NewsletterPost[]
  ): Promise<boolean> => {
    return sendNewsletter({ subject, noticias });
  };

  const handleSendTest = async (
    subject: string,
    noticias: NewsletterPost[],
    testEmail: string
  ): Promise<boolean> => {
    return sendTestEmail({ subject, noticias }, testEmail);
  };

  const error = newsletterError || postsError;

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Sub-navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-cream border border-beige-medium p-1 h-auto">
          <TabsTrigger
            value="compose"
            className="flex items-center gap-2 px-4 py-2 data-[state=active]:bg-vermelho data-[state=active]:text-white rounded-lg transition-all"
          >
            <PenLine className="h-4 w-4" />
            <span className="font-medium">Compor</span>
          </TabsTrigger>
          <TabsTrigger
            value="subscribers"
            className="flex items-center gap-2 px-4 py-2 data-[state=active]:bg-vermelho data-[state=active]:text-white rounded-lg transition-all"
          >
            <Users className="h-4 w-4" />
            <span className="font-medium">Subscritores</span>
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="flex items-center gap-2 px-4 py-2 data-[state=active]:bg-vermelho data-[state=active]:text-white rounded-lg transition-all"
          >
            <History className="h-4 w-4" />
            <span className="font-medium">Histórico</span>
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="compose" className="mt-0">
            <ComposeNewsletter
              posts={posts}
              postsLoading={postsLoading}
              totalSubscribers={totalSubscribers}
              sending={sending}
              onRefreshPosts={fetchPosts}
              onSend={handleSend}
              onSendTest={handleSendTest}
            />
          </TabsContent>

          <TabsContent value="subscribers" className="mt-0">
            <SubscriberList
              subscribers={subscribers}
              total={totalSubscribers}
              loading={subscribersLoading}
              onRefresh={fetchSubscribers}
            />
          </TabsContent>

          <TabsContent value="history" className="mt-0">
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-2xl font-bold text-charcoal">
                  Histórico de Envios
                </h2>
                <p className="text-muted-foreground mt-1">
                  Campanhas enviadas anteriormente
                </p>
              </div>

              <Card className="bg-cream border-beige-medium">
                <CardContent className="py-16 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-beige-medium mb-4">
                    <History className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-display text-xl font-semibold text-charcoal mb-2">
                    Em breve
                  </h3>
                  <p className="text-muted-foreground">
                    O histórico de campanhas será exibido aqui.
                    <br />
                    Por agora, podes consultar no painel do Brevo.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
