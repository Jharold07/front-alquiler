import { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  Phone,
  MessageCircle,
  Building2,
  Store,
  Calendar,
  Repeat,
  DollarSign,
  Hash,
  ChevronDown,
  Briefcase,
  User,
  FileText,
  History,
  Loader2,
  Image,
  UserMinus,
  CheckCircle2,
} from 'lucide-react';
import type { DbPago } from './types';
import { modalityLabel } from './data';
import { formatWhatsAppPhone } from './lib/whatsapp';
import { tenantService, type TenantWithDetails } from './services/tenantService';
import { TerminateContractModal } from './components/modals/TerminateContractModal';

interface Props {
  tenantId: string;
  onBack: () => void;
}

export function TenantProfile({ tenantId, onBack }: Props) {
  const [tenant, setTenant] = useState<TenantWithDetails | null>(null);
  const [payments, setPayments] = useState<DbPago[]>([]);
  const [loading, setLoading] = useState(true);
  const [openHistory, setOpenHistory] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Estado para dar de baja contrato
  const [terminateTarget, setTerminateTarget] = useState<{
    contractId: string;
    spaceId: string;
    spaceName: string;
    tenantName: string;
  } | null>(null);

  const fetchTenantData = useCallback(async () => {
    try {
      const data = await tenantService.getTenantById(tenantId);
      setTenant(data.tenant);
      setPayments(data.payments);
    } catch (err) {
      console.error('Error al cargar datos del inquilino:', err);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchTenantData();
  }, [fetchTenantData]);

  if (loading) {
    return (
      <div className="px-5 pt-16 flex flex-col items-center justify-center text-gray-400 gap-3">
        <Loader2 size={32} className="animate-spin text-blue-600" />
        <p className="text-sm font-medium">Cargando perfil del inquilino...</p>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="px-5 pt-12">
        <button onClick={onBack} className="text-blue-600 font-semibold flex items-center gap-1">
          <ArrowLeft size={16} /> Volver
        </button>
        <p className="mt-4 text-gray-500">Inquilino no encontrado.</p>
      </div>
    );
  }

  const cleanPhone = formatWhatsAppPhone(tenant.telefono || '');
  const activeContracts = (tenant.contratos || []).filter((c) => c.activo !== false);
  const pastContracts = (tenant.contratos || []).filter((c) => c.activo === false);

  const whatsappMessage = encodeURIComponent(
    `Hola ${tenant.nombre_razon_social}, le saludamos de administración respecto a su alquiler. ¿En qué podemos ayudarle el día de hoy?`
  );

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 px-5 pt-7 pb-6 rounded-b-[2rem] shadow-lg">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-white mb-4 text-sm font-semibold hover:opacity-80 transition"
        >
          <ArrowLeft size={18} /> Volver
        </button>

        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-3xl bg-white/20 flex items-center justify-center text-white font-bold text-2xl shrink-0 shadow-inner">
            {tenant.tipo === 'empresa' ? (
              <Briefcase size={28} />
            ) : (
              tenant.nombre_razon_social.charAt(0)
            )}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-white truncate">{tenant.nombre_razon_social}</h1>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-white/20 px-2.5 py-1 rounded-full mt-1">
              {tenant.tipo === 'empresa' ? (
                <>
                  <Briefcase size={12} /> Empresa
                </>
              ) : (
                <>
                  <User size={12} /> Persona Natural
                </>
              )}
            </span>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3 mt-5">
          <a
            href={`tel:${cleanPhone}`}
            className="flex items-center justify-center gap-2 rounded-2xl bg-white py-3 text-sm font-bold text-blue-700 hover:bg-blue-50 transition shadow active:scale-[0.98]"
          >
            <Phone size={17} /> Llamar
          </a>
          <a
            href={`https://wa.me/${cleanPhone}?text=${whatsappMessage}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 rounded-2xl bg-green-500 py-3 text-sm font-bold text-white hover:bg-green-600 transition shadow active:scale-[0.98]"
          >
            <MessageCircle size={17} /> WhatsApp
          </a>
        </div>
      </div>

      <div className="px-5 pt-5 space-y-5">
        {/* Notificación de éxito */}
        {successMessage && (
          <div className="rounded-2xl bg-green-50 border border-green-200 p-3.5 flex items-center justify-between text-xs text-green-800 animate-fade-in shadow-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-green-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-green-700 hover:text-green-900 font-bold ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* Contact info */}
        <Section title="Datos de contacto">
          <InfoRow icon={<Phone size={16} />} label="Teléfono" value={tenant.telefono} />
          <InfoRow icon={<FileText size={16} />} label="Documento" value={tenant.documento_id} />
          {tenant.email && (
            <InfoRow icon={<MailIcon size={16} />} label="Correo" value={tenant.email} />
          )}
        </Section>

        {/* Active contract(s) */}
        <Section title="Contrato(s) activo(s)">
          {activeContracts.length === 0 ? (
            <div className="py-4 text-center">
              <p className="text-xs text-gray-500">Este inquilino no tiene habitaciones ni locales asignados actualmente.</p>
            </div>
          ) : (
            activeContracts.map((c) => {
              const espacio = c.espacios;
              if (!espacio) return null;
              const Icon = espacio.tipo === 'cuarto' ? Building2 : Store;
              const spaceLabel = `${espacio.tipo === 'cuarto' ? 'Cuarto' : 'Local'} ${espacio.nombre} · ${espacio.piso}`;

              const rows = [
                {
                  icon: <Icon size={15} />,
                  label: 'Tipo de espacio',
                  value: spaceLabel,
                },
                {
                  icon: <Calendar size={15} />,
                  label: 'Inicio de contrato',
                  value: c.fecha_inicio || 'No registrada',
                },
                {
                  icon: <Repeat size={15} />,
                  label: 'Modalidad de pago',
                  value: modalityLabel[c.modalidad || 'adelantado'] || c.modalidad,
                },
                {
                  icon: <DollarSign size={15} />,
                  label: 'Monto mensual',
                  value: `S/ ${(c.monto_mensual || 0).toLocaleString('es-PE')}`,
                },
                {
                  icon: <Hash size={15} />,
                  label: 'Día de cobro',
                  value: `Día ${c.dia_de_pago || '—'} de cada mes`,
                },
              ];

              return (
                <div key={c.id} className="rounded-2xl bg-blue-50/80 border border-blue-100 p-3.5 mb-3 last:mb-0 space-y-3">
                  <div className="space-y-2.5">
                    {rows.map((r, i) => (
                      <div key={i} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-gray-600 text-xs">
                          {r.icon}
                          <span>{r.label}</span>
                        </div>
                        <span className="text-xs font-bold text-gray-900 text-right">
                          {r.value}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Botón para Dar de Baja el Contrato y Liberar Habitación */}
                  <div className="pt-2 border-t border-blue-100">
                    <button
                      type="button"
                      onClick={() =>
                        setTerminateTarget({
                          contractId: c.id,
                          spaceId: espacio.id,
                          spaceName: spaceLabel,
                          tenantName: tenant.nombre_razon_social,
                        })
                      }
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-white border border-red-200 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 hover:border-red-300 transition shadow-sm active:scale-[0.99]"
                    >
                      <UserMinus size={15} /> Dar de baja contrato y liberar habitación
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </Section>

        {/* Contratos finalizados si los hay */}
        {pastContracts.length > 0 && (
          <Section title="Historial de contratos anteriores">
            <div className="space-y-2">
              {pastContracts.map((c) => (
                <div key={c.id} className="rounded-2xl bg-gray-50 p-3 border border-gray-100 text-xs text-gray-600 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-gray-800">
                      {c.espacios?.tipo === 'local' ? 'Local' : 'Cuarto'} {c.espacios?.nombre}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      {c.fecha_inicio} a {c.fecha_fin || 'Finalizado'}
                    </p>
                  </div>
                  <span className="text-[10px] font-semibold text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
                    Dado de baja
                  </span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Past rentals / payments (collapsible) */}
        <div className="rounded-3xl bg-white border border-gray-100 shadow-sm overflow-hidden">
          <button
            onClick={() => setOpenHistory((v) => !v)}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition"
          >
            <div className="flex items-center gap-2">
              <History size={18} className="text-blue-600" />
              <span className="font-bold text-gray-900 text-sm">
                Historial de cobros ({payments.length})
              </span>
            </div>
            <ChevronDown
              size={20}
              className={`text-gray-400 transition-transform duration-200 ${
                openHistory ? 'rotate-180' : ''
              }`}
            />
          </button>
          {openHistory && (
            <div className="px-4 pb-4 space-y-2">
              {payments.length === 0 ? (
                <p className="text-sm text-gray-500 py-3 text-center">
                  No hay pagos registrados para este inquilino en Supabase.
                </p>
              ) : (
                payments.map((p) => {
                  const contrato = Array.isArray(p.contratos) ? p.contratos[0] : p.contratos;
                  const sp = Array.isArray(contrato?.espacios) ? contrato?.espacios[0] : contrato?.espacios;
                  const isPaid = p.estado === 'pagado';

                  return (
                    <div
                      key={p.id}
                      className="flex items-center justify-between rounded-2xl bg-gray-50 p-3 border border-gray-100"
                    >
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {p.mes_correspondiente}
                        </p>
                        <p className="text-xs text-gray-500">
                          {sp?.piso} · {sp?.tipo === 'local' ? 'Local' : 'Cuarto'} {sp?.nombre}
                        </p>
                        {p.comprobante_url && (
                          <a
                            href={p.comprobante_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 mt-1"
                          >
                            <Image size={11} /> Comprobante
                          </a>
                        )}
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-sm font-bold ${
                            isPaid ? 'text-green-600' : 'text-amber-600'
                          }`}
                        >
                          S/ {p.monto}
                        </p>
                        <p className="text-xs text-gray-400">
                          {p.fecha_pago ? `Pagado: ${p.fecha_pago}` : `Vence: ${p.fecha_vencimiento}`}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal para dar de baja contrato */}
      {terminateTarget && (
        <TerminateContractModal
          contractId={terminateTarget.contractId}
          spaceId={terminateTarget.spaceId}
          spaceName={terminateTarget.spaceName}
          tenantName={terminateTarget.tenantName}
          onClose={() => setTerminateTarget(null)}
          onTerminated={() => {
            setTerminateTarget(null);
            setSuccessMessage(`¡Contrato finalizado! El espacio ${terminateTarget.spaceName} ahora está disponible.`);
            fetchTenantData();
          }}
        />
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl bg-white border border-gray-100 p-4 shadow-sm">
      <h3 className="text-sm font-bold text-gray-900 mb-3">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-9 w-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-semibold text-gray-900 truncate">{value || '—'}</p>
      </div>
    </div>
  );
}

function MailIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}
