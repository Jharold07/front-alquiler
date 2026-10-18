import { useState } from 'react';
import {
  Bell,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
  MessageCircle,
  CreditCard,
  ChevronRight,
  Wallet,
  Calendar,
} from 'lucide-react';
import {
  buildAlerts,
  statusConfig,
  modalityLabel,
  getFinancialSummary,
  monthLabel,
} from './data';
import type { AlertItem } from './types';
import { PaymentModal } from './PaymentModal';

interface Props {
  onOpenTenant: (tenantId: string) => void;
}

export function Dashboard({ onOpenTenant }: Props) {
  const alerts = buildAlerts();
  const summary = getFinancialSummary();
  const [paymentTarget, setPaymentTarget] = useState<AlertItem | null>(null);

  const vencidos = alerts.filter((a) => a.status === 'vencido');
  const proximos = alerts.filter((a) => a.status === 'proximo');
  const aldia = alerts.filter((a) => a.status === 'aldia');

  function whatsappPhone(phone: string) {
    return phone.replace(/[^0-9]/g, '');
  }

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 px-5 pt-12 pb-6 rounded-b-[2rem] shadow-lg">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-blue-100 text-sm">Bienvenido de nuevo</p>
            <h1 className="text-2xl font-bold text-white">Gestión de Alquileres</h1>
          </div>
          <button className="relative h-11 w-11 rounded-full bg-white/15 flex items-center justify-center text-white">
            <Bell size={22} />
            <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-red-400 border-2 border-blue-600" />
          </button>
        </div>

        {/* Financial summary card */}
        <div className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/15">
          <div className="flex items-center justify-between mb-3">
            <span className="text-blue-50 text-sm font-medium flex items-center gap-1.5">
              <Calendar size={15} /> {monthLabel}
            </span>
            <span className="text-xs font-semibold text-white bg-white/20 px-2.5 py-1 rounded-full">
              {summary.cobradoPct}% cobrado
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl p-3">
              <div className="flex items-center gap-1.5 text-green-600 mb-1">
                <TrendingUp size={15} />
                <span className="text-xs font-semibold">Cobrado</span>
              </div>
              <p className="text-xl font-bold text-gray-900">
                S/ {summary.totalCobrado.toLocaleString('es-PE')}
              </p>
            </div>
            <div className="bg-white rounded-2xl p-3">
              <div className="flex items-center gap-1.5 text-amber-600 mb-1">
                <Wallet size={15} />
                <span className="text-xs font-semibold">Por cobrar</span>
              </div>
              <p className="text-xl font-bold text-gray-900">
                S/ {summary.porCobrar.toLocaleString('es-PE')}
              </p>
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-3 h-2 rounded-full bg-white/20 overflow-hidden">
            <div
              className="h-full bg-green-400 rounded-full transition-all"
              style={{ width: `${summary.cobradoPct}%` }}
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
              key={`${a.tenant.id}-${a.space.id}`}
              alert={a}
              onPay={() => setPaymentTarget(a)}
              onOpenTenant={() => onOpenTenant(a.tenant.id)}
              whatsappPhone={whatsappPhone}
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
              key={`${a.tenant.id}-${a.space.id}`}
              alert={a}
              onPay={() => setPaymentTarget(a)}
              onOpenTenant={() => onOpenTenant(a.tenant.id)}
              whatsappPhone={whatsappPhone}
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
              key={`${a.tenant.id}-${a.space.id}`}
              alert={a}
              onPay={() => setPaymentTarget(a)}
              onOpenTenant={() => onOpenTenant(a.tenant.id)}
              whatsappPhone={whatsappPhone}
            />
          ))}
        </div>
      </div>

      {paymentTarget && (
        <PaymentModal
          alert={paymentTarget}
          onClose={() => setPaymentTarget(null)}
          onSave={() => setPaymentTarget(null)}
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
  whatsappPhone,
}: {
  alert: AlertItem;
  onPay: () => void;
  onOpenTenant: () => void;
  whatsappPhone: (p: string) => string;
}) {
  const cfg = statusConfig[alert.status];
  const showActions = alert.status !== 'aldia';

  return (
    <div className={`rounded-3xl border ${cfg.border} ${cfg.bg} p-4 shadow-sm`}>
      <div className="flex items-start justify-between mb-2">
        <button
          onClick={onOpenTenant}
          className="flex items-center gap-3 text-left flex-1"
        >
          <div className={`h-10 w-10 rounded-full ${cfg.dot} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
            {alert.tenant.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-gray-900 text-sm truncate">
              {alert.tenant.name}
            </p>
            <p className="text-xs text-gray-500">
              {alert.space.floor} · {alert.space.number}
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
          {modalityLabel[alert.modality]}
        </span>
        {alert.status === 'vencido' && alert.daysLate && (
          <span className="text-xs font-bold text-red-600 bg-red-100 px-2.5 py-1 rounded-full">
            {alert.daysLate} días de retraso
          </span>
        )}
        {alert.status === 'proximo' && alert.daysUntilDue && (
          <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full">
            Faltan {alert.daysUntilDue} días
          </span>
        )}
      </div>

      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-gray-500">Monto pendiente</span>
        <span className="text-lg font-bold text-gray-900">
          S/ {alert.amount.toLocaleString('es-PE')}
        </span>
      </div>

      {showActions && (
        <div className="grid grid-cols-2 gap-2.5">
          <a
            href={`https://wa.me/${whatsappPhone(alert.tenant.phone)}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-1.5 rounded-2xl bg-green-500 py-3 text-sm font-bold text-white hover:bg-green-600 transition shadow-sm"
          >
            <MessageCircle size={17} /> WhatsApp
          </a>
          <button
            onClick={onPay}
            className="flex items-center justify-center gap-1.5 rounded-2xl bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-700 transition shadow-sm"
          >
            <CreditCard size={17} /> Registrar Pago
          </button>
        </div>
      )}
    </div>
  );
}
