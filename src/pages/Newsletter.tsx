import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { PenLine, Users, History, FolderOpen } from 'lucide-react';
import { useNewsletter } from '../hooks/useNewsletter';
import { ComposeNewsletter } from '../components/newsletter/ComposeNewsletter';
import { SubscriberList } from '../components/newsletter/SubscriberList';
import { CampaignHistory } from '../components/newsletter/CampaignHistory';
import { GroupManager } from '../components/newsletter/GroupManager';
import type { ContentBlock } from '../components/newsletter/BlockEditor';

export function Newsletter() {
  const [activeTab, setActiveTab] = useState('compose');
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);

  const {
    subscribers,
    totalSubscribers,
    campaigns,
    totalCampaigns,
    groups,
    loading: subscribersLoading,
    loadingCampaigns,
    loadingGroups,
    sending,
    adding,
    removing,
    movingSubscribers,
    savingGroup,
    error: newsletterError,
    fetchSubscribers,
    fetchCampaigns,
    fetchGroups,
    sendNewsletter,
    addSubscriber,
    removeSubscriber,
    moveSubscribers,
    removeFromGroup,
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

  const handleGroupChange = (groupId: number | null) => {
    setSelectedGroupId(groupId);
    fetchSubscribers(50, 0, groupId ?? undefined);
  };

  const handleRefreshSubscribers = (listId?: number) => {
    fetchSubscribers(50, 0, listId);
  };

  // Load campaigns when history tab is selected
  useEffect(() => {
    if (activeTab === 'history') {
      fetchCampaigns();
    }
  }, [activeTab, fetchCampaigns]);

  // Load groups when groups or subscribers tab is selected, or on compose
  useEffect(() => {
    if (activeTab === 'groups' || activeTab === 'subscribers' || activeTab === 'compose') {
      fetchGroups();
    }
  }, [activeTab, fetchGroups]);

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
            value="groups"
            className="flex items-center gap-2 px-4 py-2 data-[state=active]:bg-vermelho data-[state=active]:text-white rounded-lg transition-all"
          >
            <FolderOpen className="h-4 w-4" />
            <span className="font-medium">Grupos</span>
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

          <TabsContent value="subscribers" className="mt-0">
            <SubscriberList
              subscribers={subscribers}
              total={totalSubscribers}
              loading={subscribersLoading}
              adding={adding}
              removing={removing}
              movingSubscribers={movingSubscribers}
              groups={groups}
              selectedGroupId={selectedGroupId}
              onRefresh={handleRefreshSubscribers}
              onAdd={addSubscriber}
              onRemove={removeSubscriber}
              onMoveSubscribers={moveSubscribers}
              onRemoveFromGroup={removeFromGroup}
              onGroupChange={handleGroupChange}
            />
          </TabsContent>

          <TabsContent value="groups" className="mt-0">
            <GroupManager
              groups={groups}
              loading={loadingGroups}
              saving={savingGroup}
              onRefresh={fetchGroups}
              onCreate={createGroup}
              onUpdate={updateGroup}
              onDelete={deleteGroup}
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
