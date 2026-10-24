import { useState } from 'react';
import { AlertCircle, Loader2, ShieldAlert, Trash2, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Props {
  recordLabel: string;
  recordName: string;
  onClose: () => void;
  onDelete: () => Promise<void>;
  onDeleted: () => void;
}

export function ConfirmDeleteModal({ recordLabel, recordName, onClose, onDelete, onDeleted }: Props) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!password) {
      setError('Ingresa tu contraseña para confirmar.');
      return;
    }
    setDeleting(true);
    setError(null);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      const email = userData.user?.email;
      if (userError || !userData.user || !email) throw new Error('No se pudo verificar la sesión actual. Inicia sesión nuevamente.');

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError || authData.user?.id !== userData.user.id) {
        const isInvalidPassword = authError?.message.toLowerCase().includes('invalid login credentials')
          || authError?.message.toLowerCase().includes('invalid_credentials');
        if (isInvalidPassword || (!authError && authData.user?.id !== userData.user.id)) {
          setError('Contraseña incorrecta. No se pudo eliminar el registro.');
          return;
        }
        throw new Error(authError?.message || 'No se pudo validar la contraseña por un problema de conexión.');
      }

      await onDelete();
      setPassword('');
      onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar el registro. Revisa tu conexión e inténtalo nuevamente.');
    } finally {
      setDeleting(false);
    }
  }

  return <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
    <button type="button" aria-label="Cerrar" onClick={onClose} className="absolute inset-0 bg-black/55 backdrop-blur-sm" />
    <form onSubmit={handleSubmit} className="relative w-full max-w-md space-y-4 rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-red-100 p-2 text-red-700"><ShieldAlert size={20}/></div>
          <div><h2 className="text-lg font-bold text-gray-900">Confirmar eliminación</h2><p className="mt-1 text-xs text-gray-500">Se eliminará {recordLabel} <strong>{recordName}</strong> y sus registros relacionados.</p></div>
        </div>
        <button type="button" onClick={onClose} disabled={deleting} aria-label="Cerrar" className="rounded-full bg-gray-100 p-2 text-gray-500"><X size={18}/></button>
      </div>
      {error && <p role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700"><AlertCircle size={16} className="mt-0.5 shrink-0"/>{error}</p>}
      <label className="block text-xs font-bold text-gray-700">Contraseña del usuario actual<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required className="mt-1.5 w-full rounded-xl border-2 border-gray-200 px-3 py-2.5 text-sm focus:border-red-500 focus:outline-none" /></label>
      <button type="submit" disabled={deleting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-bold text-white shadow hover:bg-red-700 disabled:opacity-50">{deleting ? <Loader2 size={17} className="animate-spin"/> : <Trash2 size={17}/>} {deleting ? 'Eliminando…' : 'Confirmar y eliminar'}</button>
      <button type="button" onClick={onClose} disabled={deleting} className="w-full rounded-xl py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100">Cancelar</button>
    </form>
  </div>;
}
