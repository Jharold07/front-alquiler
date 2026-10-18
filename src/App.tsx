import { useState } from 'react';
import { Home, Building2, Users, History as HistoryIcon } from 'lucide-react';
import { Dashboard } from './Dashboard';
import { Spaces } from './Spaces';
import { Tenants } from './Tenants';
import { History } from './History';
import { TenantProfile } from './TenantProfile';

type Tab = 'inicio' | 'espacios' | 'inquilinos' | 'historial';

const tabs: { id: Tab; label: string; icon: typeof Home }[] = [
  { id: 'inicio', label: 'Inicio', icon: Home },
  { id: 'espacios', label: 'Espacios', icon: Building2 },
  { id: 'inquilinos', label: 'Inquilinos', icon: Users },
  { id: 'historial', label: 'Historial', icon: HistoryIcon },
];

function App() {
  const [tab, setTab] = useState<Tab>('inicio');
  const [tenantView, setTenantView] = useState<string | null>(null);

  function openTenant(id: string) {
    setTenantView(id);
  }

  function backFromTenant() {
    setTenantView(null);
  }

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      {/* Phone frame */}
      <div className="relative w-full max-w-[430px] bg-gray-50 min-h-screen shadow-2xl flex flex-col">
        {/* Status bar */}
        <div className="bg-blue-600 text-white text-xs px-6 pt-3 pb-1 flex justify-between items-center font-semibold relative z-10">
          <span>9:41</span>
          <div className="flex items-center gap-1.5">
            <span className="flex gap-0.5">
              <span className="h-2.5 w-1 bg-white rounded-full" />
              <span className="h-2.5 w-1 bg-white rounded-full" />
              <span className="h-2.5 w-1 bg-white rounded-full opacity-60" />
            </span>
            <span>5G</span>
            <span className="ml-1 inline-flex items-center">
              <span className="h-2.5 w-5 border border-white rounded-sm relative">
                <span className="absolute inset-0.5 bg-white rounded-[1px]" />
              </span>
            </span>
          </div>
        </div>

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
          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white/95 backdrop-blur border-t border-gray-200 px-2 pb-5 pt-2 z-40">
            <div className="grid grid-cols-4">
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
                          : 'text-gray-400'
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
