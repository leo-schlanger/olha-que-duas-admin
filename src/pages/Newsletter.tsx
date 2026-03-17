import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { PenLine, Users, History } from 'lucide-react';
import { useNewsletter } from '../hooks/useNewsletter';
import { ComposeNewsletter } from '../components/newsletter/ComposeNewsletter';
import { SubscriberList } from '../components/newsletter/SubscriberList';
import { CampaignHistory } from '../components/newsletter/CampaignHistory';
import type { ContentBlock } from '../components/newsletter/BlockEditor';

export function Newsletter() {
  const [activeTab, setActiveTab] = useState('compose');

  const {
    subscribers,
    totalSubscribers,
    campaigns,
    totalCampaigns,
    loading: subscribersLoading,
    loadingCampaigns,
    sending,
    error: newsletterError,
    fetchSubscribers,
    fetchCampaigns,
    sendNewsletter,
    sendTestEmail,
  } = useNewsletter();

  const handleSend = async (
    subject: string,
    blocks: ContentBlock[]
  ): Promise<boolean> => {
    return sendNewsletter({ subject, blocks });
  };

  const handleSendTest = async (
    subject: string,
    blocks: ContentBlock[],
    testEmail: string
  ): Promise<boolean> => {
    return sendTestEmail({ subject, blocks }, testEmail);
  };

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {newsletterError && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md">
          {newsletterError}
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
              totalSubscribers={totalSubscribers}
              sending={sending}
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
            <CampaignHistory
              campaigns={campaigns}
              total={totalCampaigns}
              loading={loadingCampaigns}
              onRefresh={() => fetchCampaigns()}
              onLoad={() => fetchCampaigns()}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
