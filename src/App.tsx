import { useState } from 'react';
import { Home, Building2, Users, History as HistoryIcon, LogOut } from 'lucide-react';
import { Dashboard } from './Dashboard';
import { Spaces } from './Spaces';
import { Tenants } from './Tenants';
import { History } from './History';
import { TenantProfile } from './TenantProfile';
import { Login } from './Login';
import { useAuth } from './context/AuthContext';

type Tab = 'inicio' | 'espacios' | 'inquilinos' | 'historial';

const tabs: { id: Tab; label: string; icon: typeof Home }[] = [
  { id: 'inicio', label: 'Inicio', icon: Home },
  { id: 'espacios', label: 'Espacios', icon: Building2 },
  { id: 'inquilinos', label: 'Inquilinos', icon: Users },
  { id: 'historial', label: 'Historial', icon: HistoryIcon },
];

function App() {
  const { user, loading, signOut } = useAuth();
  const [tab, setTab] = useState<Tab>('inicio');
  const [tenantView, setTenantView] = useState<string | null>(null);

  // Pantalla de carga inicial (evita parpadeo de login si ya hay sesión)
  if (loading) {
    return (
      <div className="min-h-screen bg-blue-600 flex items-center justify-center">
        <div className="h-10 w-10 rounded-full border-4 border-white/30 border-t-white animate-spin" />
      </div>
    );
  }

  // Sin sesión → mostrar login
  if (!user) {
    return <Login />;
  }

  // Con sesión → mostrar la app
  function openTenant(id: string) {
    setTenantView(id);
  }

  function backFromTenant() {
    setTenantView(null);
  }

  return (
    <div className="min-h-screen bg-gray-100 sm:py-3 flex justify-center">
      {/* Main app container */}
      <div className="relative w-full max-w-md sm:max-w-lg bg-gray-50 min-h-screen sm:min-h-[calc(100vh-1.5rem)] sm:rounded-3xl sm:shadow-xl sm:border sm:border-gray-200/80 flex flex-col overflow-hidden">
        {/* Content */}
        <div className="flex-1 overflow-y-auto pb-24">
          {tenantView ? (
            <TenantProfile tenantId={tenantView} onBack={backFromTenant} />
          ) : tab === 'inicio' ? (
            <Dashboard onOpenTenant={openTenant} />
          ) : tab === 'espacios' ? (
            <Spaces onOpenTenant={openTenant} />
          ) : tab === 'inquilinos' ? (
            <Tenants onOpenTenant={openTenant} />
          ) : (
            <History onOpenTenant={openTenant} />
          )}
        </div>

        {/* Bottom nav */}
        {!tenantView && (
          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md sm:max-w-lg bg-white/95 backdrop-blur border-t border-gray-200/80 px-3 pb-4 pt-2 z-40 sm:rounded-b-3xl">
            <div className="grid grid-cols-5 items-center">
              {tabs.map((t) => {
                const Icon = t.icon;
                const active = tab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className="flex flex-col items-center gap-1 py-1.5 transition"
                  >
                    <div
                      className={`h-9 w-9 rounded-2xl flex items-center justify-center transition-all ${
                        active
                          ? 'bg-blue-600 text-white scale-105 shadow-lg shadow-blue-600/30'
                          : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      <Icon size={20} />
                    </div>
                    <span
                      className={`text-[11px] font-semibold ${
                        active ? 'text-blue-600' : 'text-gray-400'
                      }`}
                    >
                      {t.label}
                    </span>
                  </button>
                );
              })}

              {/* Botón de cerrar sesión */}
              <button
                onClick={signOut}
                className="flex flex-col items-center gap-1 py-1.5 transition"
                aria-label="Cerrar sesión"
              >
                <div className="h-9 w-9 rounded-2xl flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all">
                  <LogOut size={20} />
                </div>
                <span className="text-[11px] font-semibold text-gray-400">Salir</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
