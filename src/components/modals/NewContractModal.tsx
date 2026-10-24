import { useEffect, useState } from 'react';
import { AlertCircle, Loader2, Save, X } from 'lucide-react';
import type { DbEspacio, PaymentModality, TenantType } from '../../types';
import { contractService } from '../../services/contractService';
import { spaceService } from '../../services/spaceService';
import { supabase } from '../../lib/supabase';

interface Props { tenantId: string; tenantType: TenantType; onClose: () => void; onCreated: () => void; }

export function NewContractModal({ tenantId, tenantType, onClose, onCreated }: Props) {
  const [spaces, setSpaces] = useState<DbEspacio[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [priceMode, setPriceMode] = useState<'global' | 'individual'>('global');
  const [globalPrice, setGlobalPrice] = useState('');
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [payDay, setPayDay] = useState(5);
  const [modality, setModality] = useState<PaymentModality>('adelantado');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    spaceService.getAvailableSpaces().then((available) => {
      setSpaces(available);
      if (available[0]) {
        setSelected([available[0].id]);
        setGlobalPrice(String(available[0].precio_sugerido || ''));
        setPrices(Object.fromEntries(available.map((space) => [space.id, String(space.precio_sugerido || '')])));
      }
    }).catch((err) => setError(err instanceof Error ? err.message : 'No se pudieron cargar los espacios.'))
      .finally(() => setLoading(false));
  }, []);

  function toggle(id: string) {
    setSelected((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!selected.length) { setError('Selecciona al menos un espacio disponible.'); return; }
    const total = parseFloat(globalPrice);
    if (tenantType === 'empresa' && priceMode === 'global' && (!total || total <= 0)) { setError('Ingresa un precio global válido.'); return; }
    if (priceMode === 'individual' && selected.some((id) => !prices[id] || parseFloat(prices[id]) <= 0)) { setError('Indica un precio válido para cada espacio.'); return; }
    if (tenantType === 'persona' && (!prices[selected[0]] || parseFloat(prices[selected[0]]) <= 0)) { setError('Indica un precio válido.'); return; }
    setSaving(true); setError(null);
    try {
      const totalCents = Math.round(total * 100);
      for (const [index, id] of selected.entries()) {
        const amount = tenantType === 'empresa' && priceMode === 'global'
          ? (Math.floor(totalCents / selected.length) + (index < totalCents % selected.length ? 1 : 0)) / 100
          : parseFloat(prices[id]);
        const contract = await contractService.createContract({ espacio_id: id, inquilino_id: tenantId, monto_mensual: amount, dia_de_pago: payDay, modalidad: modality, fecha_inicio: startDate });
        const start = new Date(`${startDate}T00:00:00`);
        const dueDay = Math.min(28, payDay);
        const dueDate = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(dueDay).padStart(2, '0')}`;
        const month = start.toLocaleString('es-PE', { month: 'long', year: 'numeric' });
        const { error: paymentError } = await supabase.from('pagos').insert({ contrato_id: contract.id, mes_correspondiente: month.charAt(0).toUpperCase() + month.slice(1), monto: amount, fecha_vencimiento: dueDate, estado: 'pendiente', observacion: 'Cobro generado al reactivar contrato' });
        if (paymentError) throw paymentError;
      }
      onCreated();
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo crear el nuevo contrato.'); }
    finally { setSaving(false); }
  }

  return <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"><button aria-label="Cerrar" onClick={onClose} className="absolute inset-0 bg-black/50"/><form onSubmit={save} className="relative max-h-[92vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl">
    <div className="flex items-center justify-between"><div><h2 className="text-lg font-bold">Nuevo contrato</h2><p className="text-xs text-gray-500">Selecciona espacios y configura el alquiler.</p></div><button type="button" onClick={onClose} className="rounded-full bg-gray-100 p-2"><X size={18}/></button></div>
    {error && <p className="flex gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700"><AlertCircle size={16}/>{error}</p>}
    {loading ? <div className="py-6 text-center text-sm text-gray-500"><Loader2 className="mx-auto animate-spin"/></div> : spaces.length === 0 ? <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">No hay espacios disponibles.</p> : <>
      {tenantType === 'empresa' ? <fieldset><legend className="mb-2 text-xs font-bold">Espacios ({selected.length} seleccionados)</legend><div className="max-h-36 space-y-1 overflow-auto rounded-xl border p-2">{spaces.map((space) => <label key={space.id} className="flex gap-2 p-2 text-xs"><input type="checkbox" checked={selected.includes(space.id)} onChange={() => toggle(space.id)}/>{space.tipo === 'local' ? 'Local' : 'Cuarto'} {space.nombre} · {space.piso}</label>)}</div></fieldset> : <label className="block text-xs font-bold">Espacio disponible<select value={selected[0] || ''} onChange={(e) => setSelected(e.target.value ? [e.target.value] : [])} className="mt-1 w-full rounded-xl border p-3 text-sm">{spaces.map((space) => <option key={space.id} value={space.id}>{space.tipo === 'local' ? 'Local' : 'Cuarto'} {space.nombre} · {space.piso}</option>)}</select></label>}
      {tenantType === 'empresa' && <div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => setPriceMode('global')} className={`rounded-xl border p-2 text-xs font-bold ${priceMode === 'global' ? 'border-blue-600 bg-blue-50 text-blue-700' : ''}`}>Precio total global</button><button type="button" onClick={() => setPriceMode('individual')} className={`rounded-xl border p-2 text-xs font-bold ${priceMode === 'individual' ? 'border-blue-600 bg-blue-50 text-blue-700' : ''}`}>Precio individual</button></div>}
      {tenantType === 'empresa' && priceMode === 'global' ? <label className="block text-xs font-bold">Precio total mensual (S/)<input type="number" min="0.01" step="0.01" value={globalPrice} onChange={(e) => setGlobalPrice(e.target.value)} className="mt-1 w-full rounded-xl border p-3 text-sm"/></label> : <div className="space-y-2">{selected.map((id) => { const space = spaces.find((item) => item.id === id); return <label key={id} className="grid grid-cols-[1fr_130px] items-center gap-2 text-xs font-bold">{tenantType === 'empresa' ? `${space?.tipo === 'local' ? 'Local' : 'Cuarto'} ${space?.nombre}` : 'Precio mensual (S/)'}<input type="number" min="0.01" step="0.01" value={prices[id] || ''} onChange={(e) => setPrices((current) => ({ ...current, [id]: e.target.value }))} className="rounded-xl border p-2 text-sm"/></label>; })}</div>}
      <div className="grid grid-cols-2 gap-3"><label className="text-xs font-bold">Fecha de inicio<input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1 w-full rounded-xl border p-3"/></label><label className="text-xs font-bold">Día de pago<input type="number" min="1" max="31" value={payDay} onChange={(e) => setPayDay(Number(e.target.value))} className="mt-1 w-full rounded-xl border p-3"/></label></div>
      <label className="block text-xs font-bold">Modalidad<select value={modality} onChange={(e) => setModality(e.target.value as PaymentModality)} className="mt-1 w-full rounded-xl border p-3"><option value="adelantado">Mes adelantado</option><option value="vencido">Mes vencido</option></select></label>
    </>}
    <button disabled={saving || loading || !spaces.length} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-bold text-white disabled:opacity-50">{saving ? <Loader2 size={18} className="animate-spin"/> : <Save size={18}/>}Crear contrato</button>
  </form></div>;
}
