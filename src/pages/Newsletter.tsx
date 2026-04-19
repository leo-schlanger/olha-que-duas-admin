import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { PenLine, Users, History } from 'lucide-react';
import { useNewsletter } from '../hooks/useNewsletter';
import { ComposeNewsletter } from '../components/newsletter/ComposeNewsletter';
import { AudienceView } from '../components/newsletter/AudienceView';
import { CampaignHistory } from '../components/newsletter/CampaignHistory';
import type { ContentBlock } from '../components/newsletter/BlockEditor';

export function Newsletter() {
  const [activeTab, setActiveTab] = useState('compose');

  const {
    subscribers,
    totalSubscribers,
    campaigns,
    totalCampaigns,
    groups,
    groupSubscribers,
    totalGroupSubscribers,
    loading,
    loadingCampaigns,
    loadingGroupSubscribers,
    sending,
    adding,
    removing,
    movingSubscribers,
    savingGroup,
    error,
    groupError,
    fetchSubscribers,
    fetchCampaigns,
    fetchGroups,
    fetchGroupSubscribers,
    sendNewsletter,
    addSubscriber,
    removeSubscriber,
    moveSubscribers,
    removeFromGroup,
    addToTag,
    createGroup,
    updateGroup,
    deleteGroup,
  } = useNewsletter();

  const handleSend = async (
    subject: string,
    blocks: ContentBlock[],
    listIds?: number[]
  ): Promise<boolean> => {
    return sendNewsletter({ subject, blocks, listIds });
  };

  const handleSendTest = async (
    subject: string,
    blocks: ContentBlock[],
    testEmail: string
  ): Promise<boolean> => {
    return sendNewsletter({ subject, blocks, testEmail });
  };

  useEffect(() => {
    if (activeTab === 'history') {
      fetchCampaigns();
    }
  }, [activeTab, fetchCampaigns]);

  useEffect(() => {
    if (activeTab === 'audience' || activeTab === 'compose') {
      fetchGroups();
    }
  }, [activeTab, fetchGroups]);

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

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
            value="audience"
            className="flex items-center gap-2 px-4 py-2 data-[state=active]:bg-vermelho data-[state=active]:text-white rounded-lg transition-all"
          >
            <Users className="h-4 w-4" />
            <span className="font-medium">Audiência</span>
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
              groups={groups}
              sending={sending}
              onSend={handleSend}
              onSendTest={handleSendTest}
            />
          </TabsContent>

          <TabsContent value="audience" className="mt-0">
            <AudienceView
              subscribers={subscribers}
              total={totalSubscribers}
              groups={groups}
              groupSubscribers={groupSubscribers}
              totalGroupSubscribers={totalGroupSubscribers}
              loading={loading}
              loadingGroupSubscribers={loadingGroupSubscribers}
              adding={adding}
              removing={removing}
              moving={movingSubscribers}
              savingGroup={savingGroup}
              groupError={groupError}
              onRefresh={fetchSubscribers}
              onRefreshGroups={fetchGroups}
              onFetchGroupSubscribers={fetchGroupSubscribers}
              onAdd={addSubscriber}
              onRemove={removeSubscriber}
              onMoveSubscribers={moveSubscribers}
              onRemoveFromGroup={removeFromGroup}
              onAddToTag={addToTag}
              onCreateGroup={createGroup}
              onUpdateGroup={updateGroup}
              onDeleteGroup={deleteGroup}
            />
          </TabsContent>

          <TabsContent value="history" className="mt-0">
            <CampaignHistory
              campaigns={campaigns}
              total={totalCampaigns}
              loading={loadingCampaigns}
              onRefresh={() => fetchCampaigns()}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
