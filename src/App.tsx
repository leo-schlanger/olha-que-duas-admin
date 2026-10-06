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
import { LogOut, Calendar, Radio as RadioIcon, Settings, Mail, BarChart3, Headphones, Music, Users, ImageIcon, Wallet, Newspaper } from 'lucide-react'; // BookOpen: reativar junto com as Histórias
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

function Dashboard() {
  const [activeTab, setActiveTab] = useState('analytics');
  const [canFinance, setCanFinance] = useState(false);

  useEffect(() => {
    supabase.rpc('is_finance').then(({ data }) => setCanFinance(data === true));
  }, []);

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-beige-light">
      {/* Header */}
      <header className="bg-cream border-b border-beige-medium sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Title */}
            <div className="flex items-center gap-3">
              <img
                src={logo}
                alt="Olha que Duas"
                className="w-10 h-10 object-contain"
              />
              <div className="hidden sm:block">
                <h1 className="font-display text-lg font-bold text-charcoal leading-tight">
                  Olha que Duas
                </h1>
                <p className="text-xs text-muted-foreground -mt-0.5">Painel Admin</p>
              </div>
            </div>

            {/* Status Badge */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse-soft" />
              <span className="text-xs font-medium text-green-700">Sistema Online</span>
            </div>

            {/* Logout Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-vermelho hover:bg-vermelho/5"
            >
              <LogOut className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Tab Navigation */}
          <div className="flex items-center justify-between gap-4 min-w-0">
            <div className="min-w-0 flex-1 overflow-x-auto">
            <TabsList className="bg-cream border border-beige-medium p-1 h-auto w-max">
              <TabsTrigger
                value="analytics"
                className="flex items-center gap-2 px-4 py-2.5 data-[state=active]:bg-vermelho data-[state=active]:text-white rounded-lg transition-all"
              >
                <BarChart3 className="h-4 w-4" />
                <span className="font-medium">Analytics</span>
              </TabsTrigger>
              <TabsTrigger
                value="radio"
                className="flex items-center gap-2 px-4 py-2.5 data-[state=active]:bg-vermelho data-[state=active]:text-white rounded-lg transition-all"
              >
                <Headphones className="h-4 w-4" />
                <span className="font-medium">Radio</span>
              </TabsTrigger>
              <TabsTrigger
                value="audience"
                className="flex items-center gap-2 px-4 py-2.5 data-[state=active]:bg-vermelho data-[state=active]:text-white rounded-lg transition-all"
              >
                <Users className="h-4 w-4" />
                <span className="font-medium">Audiência</span>
              </TabsTrigger>
              <TabsTrigger
                value="events"
                className="flex items-center gap-2 px-4 py-2.5 data-[state=active]:bg-vermelho data-[state=active]:text-white rounded-lg transition-all"
              >
                <RadioIcon className="h-4 w-4" />
                <span className="font-medium">Eventos</span>
              </TabsTrigger>
              <TabsTrigger
                value="schedule"
                className="flex items-center gap-2 px-4 py-2.5 data-[state=active]:bg-vermelho data-[state=active]:text-white rounded-lg transition-all"
              >
                <Calendar className="h-4 w-4" />
                <span className="font-medium">Programação</span>
              </TabsTrigger>
              <TabsTrigger
                value="daily-schedule"
                className="flex items-center gap-2 px-4 py-2.5 data-[state=active]:bg-vermelho data-[state=active]:text-white rounded-lg transition-all"
              >
                <Music className="h-4 w-4" />
                <span className="font-medium">Prog. Diária</span>
              </TabsTrigger>
              {/* Histórias — em definição; reativar este separador quando o fluxo estiver fechado
              <TabsTrigger
                value="stories"
                className="flex items-center gap-2 px-4 py-2.5 data-[state=active]:bg-vermelho data-[state=active]:text-white rounded-lg transition-all"
              >
                <BookOpen className="h-4 w-4" />
                <span className="font-medium">Histórias</span>
              </TabsTrigger>
              */}
              <TabsTrigger
                value="exclusivo"
                className="flex items-center gap-2 px-4 py-2.5 data-[state=active]:bg-vermelho data-[state=active]:text-white rounded-lg transition-all"
              >
                <Newspaper className="h-4 w-4" />
                <span className="font-medium">Exclusivo Olha que Duas</span>
              </TabsTrigger>
              <TabsTrigger
                value="newsletter"
                className="flex items-center gap-2 px-4 py-2.5 data-[state=active]:bg-vermelho data-[state=active]:text-white rounded-lg transition-all"
              >
                <Mail className="h-4 w-4" />
                <span className="font-medium">Newsletter</span>
              </TabsTrigger>
              <TabsTrigger
                value="library"
                className="flex items-center gap-2 px-4 py-2.5 data-[state=active]:bg-vermelho data-[state=active]:text-white rounded-lg transition-all"
              >
                <ImageIcon className="h-4 w-4" />
                <span className="font-medium">Biblioteca</span>
              </TabsTrigger>
              {canFinance && (
                <TabsTrigger
                  value="finance"
                  className="flex items-center gap-2 px-4 py-2.5 data-[state=active]:bg-vermelho data-[state=active]:text-white rounded-lg transition-all"
                >
                  <Wallet className="h-4 w-4" />
                  <span className="font-medium">Finanças</span>
                </TabsTrigger>
              )}
            </TabsList>
            </div>

            {/* Quick Info */}
            <div className="hidden lg:flex items-center gap-2 text-sm text-muted-foreground">
              <Settings className="h-4 w-4" />
              <span>Alterações são aplicadas em tempo real</span>
            </div>
          </div>

          {/* Tab Content */}
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
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="mt-auto py-4 border-t border-beige-medium bg-cream">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Olha que Duas • Todos os direitos reservados
          </p>
        </div>
      </footer>
    </div>
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
