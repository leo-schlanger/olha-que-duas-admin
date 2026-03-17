import { Users, Mail, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import type { Subscriber } from '../../types';

interface SubscriberListProps {
  subscribers: Subscriber[];
  total: number;
  loading: boolean;
  onRefresh: () => void;
}

export function SubscriberList({
  subscribers,
  total,
  loading,
  onRefresh,
}: SubscriberListProps) {
  const activeCount = subscribers.filter((s) => s.isActive).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-12 h-12 border-4 border-vermelho/20 border-t-vermelho rounded-full animate-spin mb-4" />
        <p className="text-muted-foreground">Carregando subscritores...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-charcoal">
            Subscritores
          </h2>
          <p className="text-muted-foreground mt-1">
            {total} total • {activeCount} ativos
          </p>
        </div>
        <Button
          variant="outline"
          onClick={onRefresh}
          className="border-beige-medium"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="bg-cream border-beige-medium">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-vermelho/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-vermelho" />
            </div>
            <div>
              <p className="text-2xl font-bold text-charcoal">{total}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-cream border-beige-medium">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-charcoal">{activeCount}</p>
              <p className="text-sm text-muted-foreground">Ativos</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-cream border-beige-medium">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amarelo/20 flex items-center justify-center">
              <Mail className="h-6 w-6 text-charcoal" />
            </div>
            <div>
              <p className="text-2xl font-bold text-charcoal">300</p>
              <p className="text-sm text-muted-foreground">Limite diário</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscriber List */}
      {subscribers.length === 0 ? (
        <Card className="bg-cream border-beige-medium">
          <CardContent className="py-16 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-beige-medium mb-4">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-display text-xl font-semibold text-charcoal mb-2">
              Nenhum subscritor ainda
            </h3>
            <p className="text-muted-foreground">
              Os subscritores aparecerão aqui quando se inscreverem na newsletter.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-cream border-beige-medium overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-beige-medium bg-beige-light/50">
                  <th className="text-left px-4 py-3 text-sm font-semibold text-charcoal">
                    Email
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-charcoal">
                    Nome
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-charcoal">
                    Data
                  </th>
                  <th className="text-center px-4 py-3 text-sm font-semibold text-charcoal">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((subscriber, index) => (
                  <tr
                    key={subscriber.id}
                    className={`border-b border-beige-medium/50 ${
                      index % 2 === 0 ? 'bg-white' : 'bg-cream'
                    }`}
                  >
                    <td className="px-4 py-3 text-sm text-charcoal">
                      {subscriber.email}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {subscriber.nome || '-'}
                    </td>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
