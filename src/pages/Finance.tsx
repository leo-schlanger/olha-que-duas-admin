import { useState } from 'react';
import { ChevronLeft, ChevronRight, FileSpreadsheet, FileUp, Loader2, Minus, Plus } from 'lucide-react';
import { useFinance } from '../hooks/useFinance';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { NativeSelect } from '../components/finance/shared';
import { FinanceOverview } from '../components/finance/FinanceOverview';
import { TransactionsTab } from '../components/finance/TransactionsTab';
import { RecurrencesTab } from '../components/finance/RecurrencesTab';
import { ClientsTab } from '../components/finance/ClientsTab';
import { TeamTab } from '../components/finance/TeamTab';
import { CategoriesTab } from '../components/finance/CategoriesTab';
import { ActivityTab } from '../components/finance/ActivityTab';
import { TransactionDialog } from '../components/finance/TransactionDialog';
import { ImportReceiptDialog } from '../components/finance/ImportReceiptDialog';
import { currentPeriod, periodLabel, shiftPeriod, type Period } from '../lib/finance';
import { exportFinanceExcel } from '../lib/financeExcel';
import type { FinKind, FinTransaction } from '../types/finance';

const SUB_TAB = 'px-3 py-2 data-[state=active]:bg-vermelho data-[state=active]:text-white rounded-lg text-sm';

export function Finance() {
  const api = useFinance();
  const [period, setPeriod] = useState<Period>(currentPeriod);
  const [txDialog, setTxDialog] = useState<{ tx: FinTransaction | null; kind: FinKind } | null>(null);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  const openNew = (kind: FinKind) => setTxDialog({ tx: null, kind });
  const openEdit = (tx: FinTransaction) => setTxDialog({ tx, kind: tx.kind });

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportFinanceExcel(api.data, period);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-charcoal">Finanças</h2>
          <p className="text-sm text-muted-foreground mt-1">Clientes, receitas, custos e distribuição pela equipa</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => setImporting(true)} disabled={api.loading}>
            <FileUp className="h-4 w-4 mr-1" /> Importar comprovativo
          </Button>
          <Button variant="outline" onClick={() => openNew('income')} className="text-green-700">
            <Plus className="h-4 w-4 mr-1" /> Receita
          </Button>
          <Button variant="outline" onClick={() => openNew('expense')} className="text-red-600">
            <Minus className="h-4 w-4 mr-1" /> Despesa
          </Button>
          <Button onClick={handleExport} disabled={exporting || api.loading} className="bg-vermelho hover:bg-vermelho-dark text-white">
            {exporting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <FileSpreadsheet className="h-4 w-4 mr-1" />}
            Exportar Excel
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <NativeSelect
          className="w-28"
          value={period.type}
          onChange={(e) =>
            setPeriod(e.target.value === 'year' ? { type: 'year', value: period.value.slice(0, 4) } : currentPeriod())
          }
        >
          <option value="month">Mês</option>
          <option value="year">Ano</option>
        </NativeSelect>
        <Button variant="ghost" size="icon" onClick={() => setPeriod((p) => shiftPeriod(p, -1))} title="Anterior">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="min-w-[150px] text-center font-medium text-charcoal capitalize">{periodLabel(period)}</span>
        <Button variant="ghost" size="icon" onClick={() => setPeriod((p) => shiftPeriod(p, 1))} title="Seguinte">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {api.error && (
        <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          <span>{api.error}</span>
          <button type="button" className="underline" onClick={api.clearError}>fechar</button>
        </div>
      )}

      {api.loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-vermelho animate-spin" />
        </div>
      ) : (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="bg-cream border border-beige-medium p-1 h-auto flex-wrap">
            <TabsTrigger value="overview" className={SUB_TAB}>Resumo</TabsTrigger>
            <TabsTrigger value="transactions" className={SUB_TAB}>Lançamentos</TabsTrigger>
            <TabsTrigger value="recurrences" className={SUB_TAB}>Recorrentes</TabsTrigger>
            <TabsTrigger value="clients" className={SUB_TAB}>Clientes</TabsTrigger>
            <TabsTrigger value="team" className={SUB_TAB}>Equipa</TabsTrigger>
            <TabsTrigger value="categories" className={SUB_TAB}>Categorias</TabsTrigger>
            <TabsTrigger value="activity" className={SUB_TAB}>Histórico</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="mt-0">
            <FinanceOverview api={api} period={period} onEdit={openEdit} />
          </TabsContent>
          <TabsContent value="transactions" className="mt-0">
            <TransactionsTab api={api} period={period} onEdit={openEdit} />
          </TabsContent>
          <TabsContent value="recurrences" className="mt-0">
            <RecurrencesTab api={api} />
          </TabsContent>
          <TabsContent value="clients" className="mt-0">
            <ClientsTab api={api} />
          </TabsContent>
          <TabsContent value="team" className="mt-0">
            <TeamTab api={api} period={period} />
          </TabsContent>
          <TabsContent value="categories" className="mt-0">
            <CategoriesTab api={api} />
          </TabsContent>
          <TabsContent value="activity" className="mt-0">
            <ActivityTab api={api} />
          </TabsContent>
        </Tabs>
      )}

      {importing && <ImportReceiptDialog api={api} onClose={() => setImporting(false)} />}

      <TransactionDialog
        api={api}
        open={!!txDialog}
        onOpenChange={(o) => !o && setTxDialog(null)}
        transaction={txDialog?.tx}
        defaultKind={txDialog?.kind}
      />
    </div>
  );
}
