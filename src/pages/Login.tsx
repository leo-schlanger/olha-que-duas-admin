import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Radio } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { checkPassword, setAuthenticated } from '../lib/auth';
import logo from '../assets/logo-olha-que-duas.png';

export function Login() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 500));

    if (checkPassword(password)) {
      setAuthenticated(true);
      navigate('/');
    } else {
      setError('Senha incorreta');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand-gradient relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12 text-white">
          <img
            src={logo}
            alt="Olha que Duas"
            className="w-64 h-64 object-contain mb-8 drop-shadow-2xl"
          />
          <h1 className="font-display text-4xl font-bold text-center mb-4">
            Olha que Duas
          </h1>
          <p className="text-lg text-white/80 text-center max-w-md">
            Painel administrativo para gestão de eventos e programação da rádio
          </p>
          <div className="mt-12 flex items-center gap-3 px-4 py-2 bg-white/10 rounded-full backdrop-blur-sm">
            <Radio className="w-5 h-5" />
            <span className="text-sm font-medium">A tua voz, 24 horas por dia</span>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-white/5 rounded-full" />
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-white/5 rounded-full" />
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-beige-light">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex flex-col items-center mb-8">
            <img
              src={logo}
              alt="Olha que Duas"
              className="w-32 h-32 object-contain mb-4"
            />
            <h1 className="font-display text-2xl font-bold text-charcoal">
              Olha que Duas
            </h1>
          </div>

          <div className="bg-cream rounded-2xl shadow-xl p-8 border border-beige-medium">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-vermelho/10 mb-4">
                <Lock className="w-7 h-7 text-vermelho" />
              </div>
              <h2 className="font-display text-2xl font-bold text-charcoal">
                Área Restrita
              </h2>
              <p className="text-muted-foreground mt-2">
                Digite a senha para acessar o painel
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-charcoal font-medium">
                  Senha de Acesso
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-12 bg-beige-light border-beige-medium focus:border-vermelho focus:ring-vermelho"
                  autoFocus
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="w-2 h-2 bg-red-500 rounded-full" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 bg-vermelho hover:bg-vermelho-dark text-white font-semibold text-base transition-all duration-200 hover:shadow-lg"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Verificando...
                  </span>
                ) : (
                  'Entrar'
                )}
              </Button>
            </form>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Acesso exclusivo para administradores
          </p>
        </div>
      </div>
    </div>
  );
}
