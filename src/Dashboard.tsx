import { useState, useEffect, useCallback, useRef } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
  MessageCircle,
  CreditCard,
  ChevronRight,
  Wallet,
  Calendar,
  RefreshCw,
  Loader2,
  PlusSquare,
} from 'lucide-react';
import { statusConfig, modalityLabel, getCurrentMonthLabel } from './data';
import type { AlertItem, AlertStatus } from './types';
import { PaymentModal } from './PaymentModal';
import { supabase } from './lib/supabase';
import { getWhatsAppLink } from './lib/whatsapp';

interface Props {
  onOpenTenant: (tenantId: string) => void;
}

export function Dashboard({ onOpenTenant }: Props) {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [paymentTarget, setPaymentTarget] = useState<AlertItem | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthLabel);
  // PWA install prompt
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const deferredPrompt = useRef<any>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [installHint, setInstallHint] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      const { data: pagosData, error } = await supabase
        .from('pagos')
        .select(`
          id,
          contrato_id,
          mes_correspondiente,
          monto,
          fecha_vencimiento,
          fecha_pago,
          metodo,
          comprobante_url,
          observacion,
          estado,
          contratos (
            id,
            monto_mensual,
            dia_de_pago,
            modalidad,
            activo,
            espacios (
              id,
              nombre,
              tipo,
              piso,
              precio_sugerido,
              estado
            ),
            inquilinos (
              id,
              nombre_razon_social,
              tipo,
              documento_id,
              telefono,
              email,
              contratos (espacios (id, nombre))
            )
          )
        `)
        .order('fecha_vencimiento', { ascending: true });

      if (error) {
        console.error('Error al consultar pagos desde Supabase:', error);
        return;
      }

      if (pagosData && pagosData.length > 0) {
        // Establecer el mes más frecuente o reciente
        const months = pagosData.map((p) => p.mes_correspondiente).filter(Boolean);
        if (months.length > 0) {
          setSelectedMonth(months[0]);
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const items: AlertItem[] = [];

        for (const p of pagosData) {
          // Tipado del join
          const contrato = Array.isArray(p.contratos) ? p.contratos[0] : p.contratos;
          if (!contrato) continue;

          const inquilino = Array.isArray(contrato.inquilinos)
            ? contrato.inquilinos[0]
            : contrato.inquilinos;
          const espacio = Array.isArray(contrato.espacios)
            ? contrato.espacios[0]
            : contrato.espacios;

          if (!inquilino || !espacio) continue;

          // Cálculo de días de retraso / días faltantes
          let diffDays = 0;
          if (p.fecha_vencimiento) {
            const [y, m, d] = p.fecha_vencimiento.split('-').map(Number);
            const dueDate = new Date(y, m - 1, d);
            dueDate.setHours(0, 0, 0, 0);
            diffDays = Math.round((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          }

          let status: AlertStatus;
          let daysLate: number | undefined;
          let daysUntilDue: number | undefined;

          if (p.estado === 'pagado' || p.fecha_pago) {
            status = 'aldia';
          } else if (p.estado === 'vencido' || diffDays < 0) {
            status = 'vencido';
            daysLate = diffDays < 0 ? Math.abs(diffDays) : (p.estado === 'vencido' ? 5 : 1);
          } else {
            status = 'proximo';
            daysUntilDue = Math.max(0, diffDays);
          }

          items.push({
            id: p.id,
            paymentId: p.id,
            contratoId: p.contrato_id,
            tenant: {
              id: inquilino.id,
              name: inquilino.nombre_razon_social,
              phone: inquilino.telefono || '',
              document: inquilino.documento_id || '',
              type: inquilino.tipo,
              email: inquilino.email,
              spaceNumbers: Array.isArray(inquilino.contratos)
                ? inquilino.contratos.flatMap((c: { espacios?: { nombre?: string } | { nombre?: string }[] | null }) => {
                    const spaces = Array.isArray(c.espacios) ? c.espacios : c.espacios ? [c.espacios] : [];
                    return spaces.map((space) => space.nombre).filter((name): name is string => Boolean(name));
                  })
                : [],
            },
            space: {
              id: espacio.id,
              number: espacio.nombre,
              floor: espacio.piso,
              type: espacio.tipo,
            },
            status,
            daysLate,
            daysUntilDue,
            amount: p.monto,
            modality: contrato.modalidad || 'adelantado',
            month: p.mes_correspondiente,
            dueDate: p.fecha_vencimiento,
            paymentDate: p.fecha_pago,
            voucherUrl: p.comprobante_url,
          });
        }

        setAlerts(items);
      } else {
        setAlerts([]);
      }
    } catch (err) {
      console.error('Error inesperado al cargar el Dashboard:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Captura el evento de instalación PWA
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function handleBeforeInstall(e: any) {
      e.preventDefault();
      deferredPrompt.current = e;
      setCanInstall(true);
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  async function handleInstall() {
    if (deferredPrompt.current) {
      deferredPrompt.current.prompt();
      const { outcome } = await deferredPrompt.current.userChoice;
      if (outcome === 'accepted') {
        setCanInstall(false);
      }
      deferredPrompt.current = null;
    } else {
      // En iOS o si ya está instalada, mostrar hint
      setInstallHint(true);
      setTimeout(() => setInstallHint(false), 3500);
    }
  }

  async function handleRefresh() {
    setIsRefreshing(true);
    await fetchDashboardData();
  }

  // Cálculos financieros dinámicos desde Supabase
  const totalCobrado = alerts
    .filter((a) => a.status === 'aldia')
    .reduce((sum, a) => sum + a.amount, 0);

  const porCobrar = alerts
    .filter((a) => a.status !== 'aldia')
    .reduce((sum, a) => sum + a.amount, 0);

  const totalEsperado = totalCobrado + porCobrar;
  const cobradoPct = totalEsperado > 0 ? Math.round((totalCobrado / totalEsperado) * 100) : 0;

  const vencidos = alerts.filter((a) => a.status === 'vencido');
  const proximos = alerts.filter((a) => a.status === 'proximo');
  const aldia = alerts.filter((a) => a.status === 'aldia');

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 px-5 pt-7 pb-6 rounded-b-[2rem] shadow-lg">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-blue-100 text-sm">Bienvenido de nuevo</p>
            <h1 className="text-2xl font-bold text-white">Gestión de Alquileres</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              aria-label="Refrescar datos"
              className="h-11 w-11 rounded-full bg-white/15 flex items-center justify-center text-white hover:bg-white/25 active:scale-95 transition"
            >
              <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
            </button>

            {/* Botón instalar PWA */}
            <div className="relative">
              <button
                onClick={handleInstall}
                aria-label="Agregar app a pantalla de inicio"
                className={`h-11 w-11 rounded-full flex items-center justify-center text-white transition active:scale-95 ${
                  canInstall
                    ? 'bg-white/30 hover:bg-white/40 ring-2 ring-white/50'
                    : 'bg-white/15 hover:bg-white/25'
                }`}
              >
                <PlusSquare size={20} />
              </button>
              {installHint && (
                <div className="absolute top-13 right-0 w-52 bg-white text-gray-800 text-xs font-medium rounded-2xl shadow-xl p-3 z-50 leading-relaxed">
                  <p className="font-bold text-gray-900 mb-0.5">Agregar a inicio</p>
                  <p>En Safari, toca <strong>Compartir</strong> → <strong>"Agregar a inicio"</strong>. En Chrome, usa el menú ⋮ → <strong>"Instalar app"</strong>.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Financial summary card */}
        <div className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/15">
          <div className="flex items-center justify-between mb-3">
            <span className="text-blue-50 text-sm font-medium flex items-center gap-1.5">
              <Calendar size={15} /> {selectedMonth}
            </span>
            <span className="text-xs font-semibold text-white bg-white/20 px-2.5 py-1 rounded-full">
              {cobradoPct}% cobrado
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl p-3">
              <div className="flex items-center gap-1.5 text-green-600 mb-1">
                <TrendingUp size={15} />
                <span className="text-xs font-semibold">Cobrado</span>
              </div>
              <p className="text-xl font-bold text-gray-900">
                S/ {totalCobrado.toLocaleString('es-PE')}
              </p>
            </div>
            <div className="bg-white rounded-2xl p-3">
              <div className="flex items-center gap-1.5 text-amber-600 mb-1">
                <Wallet size={15} />
                <span className="text-xs font-semibold">Por cobrar</span>
              </div>
              <p className="text-xl font-bold text-gray-900">
                S/ {porCobrar.toLocaleString('es-PE')}
              </p>
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-3 h-2 rounded-full bg-white/20 overflow-hidden">
            <div
              className="h-full bg-green-400 rounded-full transition-all duration-500"
              style={{ width: `${cobradoPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Alerts section */}
      <div className="px-5 pt-6">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Alertas Prioritarias</h2>
        <p className="text-sm text-gray-500 mb-4">
          {vencidos.length} vencidos · {proximos.length} próximos · {aldia.length} al día
        </p>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-gray-400 gap-3">
            <Loader2 size={32} className="animate-spin text-blue-600" />
            <p className="text-sm font-medium">Cargando pagos desde Supabase...</p>
          </div>
        ) : alerts.length === 0 ? (
          <div className="rounded-3xl bg-white border border-gray-100 p-8 text-center shadow-sm">
            <CheckCircle2 size={36} className="mx-auto text-green-500 mb-2" />
            <p className="font-bold text-gray-800 text-sm">Sin pagos pendientes</p>
            <p className="text-xs text-gray-500 mt-1">
              Todos los cobros están al día o no hay registros para este período.
            </p>
          </div>
        ) : (
          <>
            {/* Vencidos */}
            {vencidos.length > 0 && (
              <SectionTitle
                icon={<AlertTriangle size={16} className="text-red-500" />}
                label="Pagos vencidos"
                count={vencidos.length}
                color="text-red-600"
              />
            )}
            <div className="space-y-3 mb-5">
              {vencidos.map((a) => (
                <AlertCard
                  key={a.id || `${a.tenant.id}-${a.space.id}`}
                  alert={a}
                  onPay={() => setPaymentTarget(a)}
                  onOpenTenant={() => onOpenTenant(a.tenant.id)}
                />
              ))}
            </div>

            {/* Próximos */}
            {proximos.length > 0 && (
              <SectionTitle
                icon={<Clock size={16} className="text-amber-500" />}
                label="Próximos vencimientos"
                count={proximos.length}
                color="text-amber-600"
              />
            )}
            <div className="space-y-3 mb-5">
              {proximos.map((a) => (
                <AlertCard
                  key={a.id || `${a.tenant.id}-${a.space.id}`}
                  alert={a}
                  onPay={() => setPaymentTarget(a)}
                  onOpenTenant={() => onOpenTenant(a.tenant.id)}
                />
              ))}
            </div>

            {/* Al día */}
            {aldia.length > 0 && (
              <SectionTitle
                icon={<CheckCircle2 size={16} className="text-green-500" />}
                label="Pagos al día"
                count={aldia.length}
                color="text-green-600"
              />
            )}
            <div className="space-y-3">
              {aldia.map((a) => (
                <AlertCard
                  key={a.id || `${a.tenant.id}-${a.space.id}`}
                  alert={a}
                  onPay={() => setPaymentTarget(a)}
                  onOpenTenant={() => onOpenTenant(a.tenant.id)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {paymentTarget && (
        <PaymentModal
          alert={paymentTarget}
          onClose={() => setPaymentTarget(null)}
          onSave={() => {
            setPaymentTarget(null);
            fetchDashboardData();
          }}
        />
      )}
    </div>
  );
}

function SectionTitle({
  icon,
  label,
  count,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      {icon}
      <h3 className={`text-sm font-bold ${color}`}>{label}</h3>
      <span className={`text-xs font-semibold ${color} bg-gray-100 px-2 py-0.5 rounded-full`}>
        {count}
      </span>
    </div>
  );
}

function AlertCard({
  alert,
  onPay,
  onOpenTenant,
}: {
  alert: AlertItem;
  onPay: () => void;
  onOpenTenant: () => void;
}) {
  const cfg = statusConfig[alert.status];
  const showActions = alert.status !== 'aldia';
  const whatsappUrl = getWhatsAppLink(alert.tenant.phone, alert);

  return (
    <div className={`rounded-3xl border ${cfg.border} ${cfg.bg} p-4 shadow-sm`}>
      <div className="flex items-start justify-between mb-2">
        <button
          onClick={onOpenTenant}
          className="flex items-center gap-3 text-left flex-1"
        >
          <div className={`h-10 w-10 rounded-full ${cfg.dot} flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm`}>
            {alert.tenant.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-gray-900 text-sm truncate">
              {alert.tenant.name}
            </p>
            <p className="text-xs text-gray-500">
              {alert.space.floor} · {alert.space.type === 'local' ? 'Local' : 'Cuarto'} {alert.space.number}
            </p>
          </div>
        </button>
        <ChevronRight size={18} className="text-gray-400 mt-2" />
      </div>

      <div className="flex items-center gap-2 flex-wrap mb-3">
        <span className={`text-xs font-semibold ${cfg.text} bg-white/70 px-2.5 py-1 rounded-full`}>
          {cfg.label}
        </span>
        <span className="text-xs font-medium text-gray-600 bg-white/70 px-2.5 py-1 rounded-full">
          {modalityLabel[alert.modality] || alert.modality}
        </span>
        {alert.status === 'vencido' && alert.daysLate !== undefined && (
          <span className="text-xs font-bold text-red-600 bg-red-100 px-2.5 py-1 rounded-full">
            {alert.daysLate} día{alert.daysLate > 1 ? 's' : ''} de retraso
          </span>
        )}
        {alert.status === 'proximo' && alert.daysUntilDue !== undefined && (
          <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full">
            Faltan {alert.daysUntilDue} día{alert.daysUntilDue > 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-gray-500">
          {alert.status === 'aldia' ? 'Monto pagado' : 'Monto pendiente'}
        </span>
        <span className="text-lg font-bold text-gray-900">
          S/ {alert.amount.toLocaleString('es-PE')}
        </span>
      </div>

      {showActions && (
        <div className="grid grid-cols-2 gap-2.5">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-1.5 rounded-2xl bg-green-500 py-3 text-sm font-bold text-white hover:bg-green-600 active:scale-[0.98] transition shadow-sm"
          >
            <MessageCircle size={17} /> WhatsApp
          </a>
          <button
            onClick={onPay}
            className="flex items-center justify-center gap-1.5 rounded-2xl bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-700 active:scale-[0.98] transition shadow-sm"
          >
            <CreditCard size={17} /> Registrar Pago
          </button>
        </div>
      )}
    </div>
  );
}
