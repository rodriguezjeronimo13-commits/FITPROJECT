export function todayISO() {
  const date = new Date();
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export function shiftDate(iso, days) {
  const date = new Date(`${iso}T12:00:00`);
  date.setDate(date.getDate() + days);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export function eyebrowDate(iso) {
  const date = new Date(`${iso}T12:00:00`);
  return date.toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).toUpperCase();
}

export function shortDate(iso, today = todayISO()) {
  const date = new Date(`${iso}T12:00:00`);
  const label = date.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric' });
  if (iso === today) return `Hoy, ${label}`;
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function formatNumber(value) {
  return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(Number(value) || 0);
}

export const SEDES = ['Cafetería Central', 'Cafetería Norte'];

export const MOMENTO_LABEL = {
  desayuno: 'Desayuno',
  almuerzo: 'Almuerzo',
  merienda: 'Merienda',
  cena: 'Cena',
};
