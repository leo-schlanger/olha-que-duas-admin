import { MessageSquareText } from 'lucide-react';
import { Card, CardContent } from '../ui/card';

// Top-of-page summary in plain sentences (same text as the exports).
export function SummaryCard({ sentences }: { sentences: string[] }) {
  if (sentences.length === 0) return null;
  return (
    <Card className="bg-cream border-beige-medium">
      <CardContent className="p-5">
        <p className="flex items-center gap-2 text-sm font-semibold text-charcoal mb-2">
          <MessageSquareText className="w-4 h-4 text-vermelho flex-shrink-0" />
          Em resumo
        </p>
        <ul className="space-y-1.5 text-sm text-charcoal leading-relaxed list-disc pl-5 marker:text-vermelho">
          {sentences.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
