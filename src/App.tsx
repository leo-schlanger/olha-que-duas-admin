import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Events } from './pages/Events';
import { Schedule } from './pages/Schedule';
import { Newsletter } from './pages/Newsletter';
import { Analytics } from './pages/Analytics';
import { Radio } from './pages/Radio';
import { DailySchedule } from './pages/DailySchedule';
import { Audience } from './pages/Audience';
import { MediaLibrary } from './pages/MediaLibrary';
// TODO: Histórias — secção ainda em definição, temporariamente desativada no painel.
// import { Stories } from './pages/Stories';
import { signOut } from './lib/auth';
import { supabase } from './lib/supabase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Button } from './components/ui/button';
import { Vinagre } from './pages/Vinagre';
import { LogOut, Calendar, Radio as RadioIcon, Menu, X, Mail, BarChart3, Headphones, Music, Users, ImageIcon, Wallet, Newspaper, type LucideIcon } from 'lucide-react'; // BookOpen: reativar junto com as Histórias
import { lazy, Suspense, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import logo from './assets/logo-olha-que-duas.png';

// Finanças só para quem tem admin_users.can_finance; carregada à parte (inclui o exceljs).
const Finance = lazy(() => import('./pages/Finance').then((m) => ({ default: m.Finance })));

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-beige-light">
        <div className="w-8 h-8 border-2 border-vermelho/30 border-t-vermelho rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

interface PanelItem {
  value: string;
  label: string;
  icon: LucideIcon;
}

const PANEL_GROUPS: { label: string; items: PanelItem[] }[] = [
  {
    label: 'Estação',
    items: [
      { value: 'analytics', label: 'Analytics', icon: BarChart3 },
      { value: 'radio', label: 'Rádio', icon: Headphones },
      { value: 'audience', label: 'Audiência', icon: Users },
    ],
  },
  {
    label: 'Programação',
    items: [
      { value: 'events', label: 'Eventos', icon: RadioIcon },
      { value: 'schedule', label: 'Programação', icon: Calendar },
      { value: 'daily-schedule', label: 'Prog. diária', icon: Music },
    ],
  },
  {
    label: 'Conteúdo',
    items: [
      { value: 'exclusivo', label: 'Exclusivo Olha que Duas', icon: Newspaper },
      { value: 'newsletter', label: 'Newsletter', icon: Mail },
      { value: 'library', label: 'Biblioteca', icon: ImageIcon },
    ],
  },
];

function Dashboard() {
  const [activeTab, setActiveTab] = useState('analytics');
  const [canFinance, setCanFinance] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    supabase.rpc('is_finance').then(({ data }) => setCanFinance(data === true));
  }, []);

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/login';
  };

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const groups = canFinance
    ? [...PANEL_GROUPS, { label: 'Gestão', items: [{ value: 'finance', label: 'Finanças', icon: Wallet }] }]
    : PANEL_GROUPS;

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => {
        setActiveTab(value);
        setMenuOpen(false);
      }}
      className="min-h-screen bg-beige-light lg:flex"
    >
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-beige-medium bg-cream px-4 lg:hidden">
        <button
          type="button"
          aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-charcoal"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <div className="flex items-center gap-2">
          <img src={logo} alt="" className="h-8 w-8 object-contain" />
          <span className="font-display text-sm font-bold text-charcoal">Olha que Duas</span>
        </div>
        <Button type="button" variant="ghost" size="icon" onClick={handleLogout} aria-label="Sair">
          <LogOut className="h-4 w-4" />
        </Button>
      </header>

      {menuOpen && (
        <button
          type="button"
          aria-label="Fechar menu"
          className="fixed inset-x-0 bottom-0 top-14 z-40 bg-charcoal/40 lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <aside
        className={`fixed bottom-0 left-0 top-14 z-50 flex w-64 flex-col border-r border-beige-medium bg-cream transition-transform lg:sticky lg:top-0 lg:z-30 lg:h-screen lg:translate-x-0 ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-3 border-b border-beige-medium px-4 py-4">
          <img src={logo} alt="" className="h-10 w-10 object-contain" />
          <div>
            <p className="font-display text-base font-bold leading-tight text-charcoal">Olha que Duas</p>
            <p className="text-xs text-muted-foreground">Painel</p>
          </div>
        </div>

        <TabsList className="flex h-auto w-full flex-1 flex-col items-stretch justify-start gap-4 overflow-y-auto rounded-none bg-transparent p-3">
          {groups.map((group) => (
            <div key={group.label} className="space-y-1">
              <p className="px-3 pb-1 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                {group.label}
              </p>
              {group.items.map((item) => (
                <TabsTrigger
                  key={item.value}
                  value={item.value}
                  className="h-auto w-full justify-start gap-3 whitespace-normal rounded-lg px-3 py-2.5 text-left text-sm font-medium text-charcoal hover:bg-beige data-[state=active]:bg-vermelho data-[state=active]:text-white data-[state=active]:shadow-none"
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </TabsTrigger>
              ))}
            </div>
          ))}
        </TabsList>

        <div className="border-t border-beige-medium p-3">
          <p className="mb-2 hidden items-center gap-2 px-3 text-xs text-muted-foreground lg:flex">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            No ar · alterações entram logo
          </p>
          <Button
            type="button"
            variant="ghost"
            onClick={handleLogout}
            className="hidden w-full justify-start text-muted-foreground hover:bg-vermelho/5 hover:text-vermelho lg:inline-flex"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <main className="flex-1 px-4 py-6 lg:px-8">
          <div className="animate-fade-in">
            <TabsContent value="analytics" className="mt-0">
              <Analytics />
            </TabsContent>

            <TabsContent value="radio" className="mt-0">
              <Radio />
            </TabsContent>

            <TabsContent value="audience" className="mt-0">
              <Audience />
            </TabsContent>

            <TabsContent value="events" className="mt-0">
              <Events />
            </TabsContent>

            <TabsContent value="schedule" className="mt-0">
              <Schedule />
            </TabsContent>

            <TabsContent value="daily-schedule" className="mt-0">
              <DailySchedule />
            </TabsContent>

            {/* Histórias — em definição; reativar em conjunto com o separador acima
            <TabsContent value="stories" className="mt-0">
              <Stories />
            </TabsContent>
            */}

            <TabsContent value="exclusivo" className="mt-0">
              <Vinagre />
            </TabsContent>

            <TabsContent value="newsletter" className="mt-0">
              <Newsletter />
            </TabsContent>

            <TabsContent value="library" className="mt-0">
              <MediaLibrary />
            </TabsContent>

            {canFinance && (
              <TabsContent value="finance" className="mt-0">
                <Suspense
                  fallback={
                    <div className="flex justify-center py-12">
                      <div className="w-8 h-8 border-2 border-vermelho/30 border-t-vermelho rounded-full animate-spin" />
                    </div>
                  }
                >
                  <Finance />
                </Suspense>
              </TabsContent>
            )}
          </div>
        </main>

        <footer className="border-t border-beige-medium bg-cream px-4 py-4">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Olha que Duas • Todos os direitos reservados
          </p>
        </footer>
      </div>
    </Tabs>
  );
}


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
