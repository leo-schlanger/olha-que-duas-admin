import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Events } from './pages/Events';
import { Schedule } from './pages/Schedule';
import { Newsletter } from './pages/Newsletter';
import { isAuthenticated, logout } from './lib/auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Button } from './components/ui/button';
import { LogOut, Calendar, Radio, Settings, Mail } from 'lucide-react';
import { useState } from 'react';
import logo from './assets/logo-olha-que-duas.png';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function Dashboard() {
  const [activeTab, setActiveTab] = useState('events');

  const handleLogout = () => {
    logout();
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
          <div className="flex items-center justify-between">
            <TabsList className="bg-cream border border-beige-medium p-1 h-auto">
              <TabsTrigger
                value="events"
                className="flex items-center gap-2 px-4 py-2.5 data-[state=active]:bg-vermelho data-[state=active]:text-white rounded-lg transition-all"
              >
                <Radio className="h-4 w-4" />
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
                value="newsletter"
                className="flex items-center gap-2 px-4 py-2.5 data-[state=active]:bg-vermelho data-[state=active]:text-white rounded-lg transition-all"
              >
                <Mail className="h-4 w-4" />
                <span className="font-medium">Newsletter</span>
              </TabsTrigger>
            </TabsList>

            {/* Quick Info */}
            <div className="hidden lg:flex items-center gap-2 text-sm text-muted-foreground">
              <Settings className="h-4 w-4" />
              <span>Alterações são aplicadas em tempo real</span>
            </div>
          </div>

          {/* Tab Content */}
          <div className="animate-fade-in">
            <TabsContent value="events" className="mt-0">
              <Events />
            </TabsContent>

            <TabsContent value="schedule" className="mt-0">
              <Schedule />
            </TabsContent>

            <TabsContent value="newsletter" className="mt-0">
              <Newsletter />
            </TabsContent>
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
