import { RefreshCw, Mail, MousePointerClick, Eye, UserMinus, AlertTriangle, Calendar, Send } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import type { Campaign } from '../../types';

interface CampaignHistoryProps {
  campaigns: Campaign[];
  total: number;
  loading: boolean;
  onRefresh: () => void;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getStatusBadge(status: string) {
  const statusMap: Record<string, { label: string; className: string }> = {
    sent: { label: 'Enviada', className: 'bg-green-100 text-green-700' },
    draft: { label: 'Rascunho', className: 'bg-gray-100 text-gray-700' },
    queued: { label: 'Na Fila', className: 'bg-blue-100 text-blue-700' },
    scheduled: { label: 'Agendada', className: 'bg-purple-100 text-purple-700' },
    in_process: { label: 'Enviando', className: 'bg-yellow-100 text-yellow-700' },
    suspended: { label: 'Suspensa', className: 'bg-red-100 text-red-700' },
  };

  const { label, className } = statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-700' };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, subValue, color }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subValue?: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3 bg-beige-light/50 rounded-lg">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-semibold text-charcoal">
          {value}
          {subValue && <span className="text-xs text-muted-foreground ml-1">{subValue}</span>}
        </p>
      </div>
    </div>
  );
}

export function CampaignHistory({ campaigns, total, loading, onRefresh }: CampaignHistoryProps) {
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-charcoal">
              Histórico de Envios
            </h2>
            <p className="text-muted-foreground mt-1">
              A carregar campanhas...
            </p>
          </div>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-cream border-beige-medium animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-beige-medium rounded w-1/3 mb-4" />
                <div className="h-4 bg-beige-medium rounded w-1/2 mb-2" />
                <div className="h-4 bg-beige-medium rounded w-1/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-charcoal">
            Histórico de Envios
          </h2>
          <p className="text-muted-foreground mt-1">
            {total} {total === 1 ? 'campanha enviada' : 'campanhas enviadas'}
          </p>
        </div>
        <Button
          onClick={onRefresh}
          variant="outline"
          size="sm"
          className="border-beige-medium"
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Campaign List */}
      {campaigns.length === 0 ? (
        <Card className="bg-cream border-beige-medium">
          <CardContent className="py-16 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-beige-medium mb-4">
              <Mail className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-display text-xl font-semibold text-charcoal mb-2">
              Nenhuma campanha enviada
            </h3>
            <p className="text-muted-foreground">
              Quando enviares a primeira newsletter, ela aparecerá aqui.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {campaigns.map((campaign) => (
            <Card key={campaign.id} className="bg-white border-beige-medium overflow-hidden">
              <CardContent className="p-0">
                {/* Campaign Header */}
                <div className="p-4 border-b border-beige-light">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getStatusBadge(campaign.status)}
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(campaign.sentDate)}
                        </span>
                      </div>
                      <h3 className="font-semibold text-charcoal truncate">
                        {campaign.subject}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {campaign.name}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                {campaign.stats && (
                  <div className="p-4 bg-beige-light/30">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                      <StatCard
                        icon={Send}
                        label="Enviados"
                        value={campaign.stats.sent}
                        color="bg-charcoal"
                      />
                      <StatCard
                        icon={Mail}
                        label="Entregues"
                        value={campaign.stats.delivered}
                        color="bg-green-500"
                      />
                      <StatCard
                        icon={Eye}
                        label="Aberturas"
                        value={campaign.stats.opened}
                        subValue={`(${campaign.stats.openRate}%)`}
                        color="bg-blue-500"
                      />
                      <StatCard
                        icon={MousePointerClick}
                        label="Cliques"
                        value={campaign.stats.clicked}
                        subValue={`(${campaign.stats.clickRate}%)`}
                        color="bg-vermelho"
                      />
                      <StatCard
                        icon={AlertTriangle}
                        label="Bounces"
                        value={campaign.stats.bounced}
                        color="bg-orange-500"
                      />
                      <StatCard
                        icon={UserMinus}
                        label="Cancelaram"
                        value={campaign.stats.unsubscribed}
                        color="bg-gray-500"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
