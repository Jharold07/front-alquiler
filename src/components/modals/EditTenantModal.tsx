import { useState } from 'react';
import { AlertCircle, Loader2, Save, X } from 'lucide-react';
import type { TenantType } from '../../types';
import type { TenantWithDetails } from '../../services/tenantService';
import { tenantService } from '../../services/tenantService';

interface Props {
  tenant: TenantWithDetails;
  onClose: () => void;
  onSaved: () => void;
}

export function EditTenantModal({ tenant, onClose, onSaved }: Props) {
  const [name, setName] = useState(tenant.nombre_razon_social);
  const [document, setDocument] = useState(tenant.documento_id);
  const [phone, setPhone] = useState(tenant.telefono);
  const [email, setEmail] = useState(tenant.email || '');
  const [type, setType] = useState<TenantType>(tenant.tipo);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await tenantService.updateTenant(tenant.id, {
        nombre_razon_social: name,
        documento_id: document,
        telefono: phone,
        email,
        tipo: type,
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar el inquilino.');
    } finally {
      setSaving(false);
    }
  }

  return <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
    <button aria-label="Cerrar" className="absolute inset-0 bg-black/50" onClick={onClose} />
    <form onSubmit={handleSubmit} className="relative w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-white p-5 shadow-2xl space-y-4">
      <div className="flex items-center justify-between"><div><h2 className="text-lg font-bold">Editar inquilino</h2><p className="text-xs text-gray-500">Actualiza sus datos de contacto e identificación.</p></div><button type="button" onClick={onClose} className="rounded-full bg-gray-100 p-2"><X size={18}/></button></div>
      {error && <p className="flex gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700"><AlertCircle size={16}/>{error}</p>}
      <label className="block text-xs font-bold">Tipo<select value={type} onChange={(e) => setType(e.target.value as TenantType)} className="mt-1 w-full rounded-xl border p-3 text-sm"><option value="persona">Persona</option><option value="empresa">Empresa</option></select></label>
      <label className="block text-xs font-bold">{type === 'empresa' ? 'Razón social' : 'Nombre'}<input value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 w-full rounded-xl border p-3 text-sm"/></label>
      <div className="grid grid-cols-2 gap-3"><label className="block text-xs font-bold">{type === 'empresa' ? 'RUC' : 'DNI'}<input value={document} onChange={(e) => setDocument(e.target.value)} required className="mt-1 w-full rounded-xl border p-3 text-sm"/></label><label className="block text-xs font-bold">Teléfono<input value={phone} onChange={(e) => setPhone(e.target.value)} required className="mt-1 w-full rounded-xl border p-3 text-sm"/></label></div>
      <label className="block text-xs font-bold">Correo electrónico<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-xl border p-3 text-sm"/></label>
      <button disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-bold text-white disabled:opacity-50">{saving ? <Loader2 size={18} className="animate-spin"/> : <Save size={18}/>}Guardar cambios</button>
    </form>
  </div>;
}
