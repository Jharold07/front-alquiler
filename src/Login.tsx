import { useState } from 'react';
import { Eye, EyeOff, Loader2, AlertCircle, KeyRound, Mail } from 'lucide-react';
import { supabase } from './lib/supabase';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setLoading(true);
    setError(null);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authError) {
      // Mensajes de error amigables en español
      if (
        authError.message.toLowerCase().includes('invalid login') ||
        authError.message.toLowerCase().includes('invalid credentials') ||
        authError.message.toLowerCase().includes('email not confirmed')
      ) {
        setError('Correo o contraseña incorrectos. Verifica tus datos e intenta de nuevo.');
      } else if (authError.message.toLowerCase().includes('network')) {
        setError('Sin conexión a internet. Revisa tu red e inténtalo otra vez.');
      } else {
        setError(authError.message);
      }
      setLoading(false);
    }
    // Si no hay error, AuthContext detecta el cambio de sesión y App redirige automáticamente
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 flex items-center justify-center p-5">
      {/* Decoración de fondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/5" />
        <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-white/5" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Cabecera */}
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-white/15 backdrop-blur mb-4 shadow-lg">
            <KeyRound size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Gestión de Alquileres</h1>
          <p className="text-blue-100 text-sm mt-1.5 leading-relaxed">
            Ingresa tus credenciales para<br />administrar los inmuebles
          </p>
        </div>

        {/* Tarjeta del formulario */}
        <div className="bg-white rounded-3xl shadow-2xl p-6 space-y-5">
          {/* Mensaje de error */}
          {error && (
            <div className="flex items-start gap-2.5 rounded-2xl bg-red-50 border border-red-200 p-3.5 text-xs text-red-700 animate-fade-in">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Campo email */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  required
                  disabled={loading}
                  className="w-full rounded-2xl border-2 border-gray-200 pl-10 pr-4 py-3 text-sm text-gray-900 focus:border-blue-600 focus:outline-none transition placeholder-gray-400 disabled:opacity-50"
                />
              </div>
            </div>

            {/* Campo contraseña */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <KeyRound
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                  className="w-full rounded-2xl border-2 border-gray-200 pl-10 pr-12 py-3 text-sm text-gray-900 focus:border-blue-600 focus:outline-none transition placeholder-gray-400 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Botón de login */}
            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Verificando...
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </form>
        </div>

        {/* Pie */}
        <p className="text-center text-xs text-blue-200/70 mt-6">
          Solo usuarios autorizados pueden acceder
        </p>
      </div>
    </div>
  );
}
