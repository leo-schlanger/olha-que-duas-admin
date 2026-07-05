import { BarChart3, ExternalLink, Info } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';

// Analytics agora usa o dashboard público (Share URL) do Umami embutido via iframe.
// Motivo: o acesso à API do Umami Cloud passou a exigir plano Pro; o Share URL é
// gratuito no plano Hobby e mantém todo o histórico. A versão anterior baseada na
// API (hook useAnalytics + edge function umami-proxy) segue no repositório e pode
// ser reativada caso o projeto migre para o plano Pro.
const SHARE_URL = import.meta.env.VITE_UMAMI_SHARE_URL as string | undefined;

export function Analytics() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-display font-bold text-charcoal">Analytics</h2>
          <p className="text-sm text-muted-foreground">
            Métricas e estatísticas do site olhaqueduas.com
          </p>
        </div>

        {SHARE_URL && (
          <Button
            variant="outline"
            size="sm"
            asChild
            className="border-beige-medium"
          >
            <a href={SHARE_URL} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" />
              Abrir no Umami
            </a>
          </Button>
        )}
      </div>

      {SHARE_URL ? (
        <Card className="bg-cream border-beige-medium overflow-hidden">
          <CardContent className="p-0">
            <iframe
              src={SHARE_URL}
              title="Dashboard de Analytics (Umami)"
              loading="lazy"
              className="w-full min-h-[600px] h-[calc(100vh-220px)] border-0 bg-white"
            />
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-cream border-beige-medium">
          <CardContent className="flex flex-col items-center text-center gap-4 py-12 px-6">
            <div className="w-14 h-14 rounded-full bg-vermelho/10 flex items-center justify-center">
              <BarChart3 className="w-7 h-7 text-vermelho" />
            </div>
            <div className="space-y-1 max-w-md">
              <h3 className="font-display text-lg font-semibold text-charcoal">
                Dashboard não configurado
              </h3>
              <p className="text-sm text-muted-foreground">
                Defina a variável <code className="px-1 py-0.5 rounded bg-beige-medium text-charcoal">VITE_UMAMI_SHARE_URL</code> com a
                URL de compartilhamento (Share URL) do seu site no Umami Cloud para
                exibir as estatísticas aqui.
              </p>
            </div>
            <div className="flex items-start gap-2 text-left text-xs text-muted-foreground bg-beige-light border border-beige-medium rounded-lg p-3 max-w-md">
              <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-vermelho" />
              <span>
                No Umami: <strong>Websites → Edit → Share URL → Add → Save</strong>.
                Copie a URL gerada (ex.: <code>https://cloud.umami.is/share/…</code>) e
                coloque no <code>.env</code>.
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
