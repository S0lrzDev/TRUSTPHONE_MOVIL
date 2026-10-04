// Validaciones reutilizables en los formularios de la app
// (las mismas reglas que valida el backend)

export const EDAD_MINIMA = 18;
export const MIN_PASSWORD = 8;

export const isEmpty = (value) => value === undefined || value === null || String(value).trim() === '';

export const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email || '').trim());

export const isValidPhone = (phone) => /^[0-9+\-\s]{8,15}$/.test(String(phone || '').trim());

// Convierte DD/MM/AAAA a AAAA-MM-DD; devuelve null si la fecha no existe
export const parseDateDMY = (text) => {
  const match = String(text || '').trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const [, dd, mm, yyyy] = match;
  const date = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  if (date.getFullYear() !== Number(yyyy) || date.getMonth() !== Number(mm) - 1 || date.getDate() !== Number(dd)) {
    return null;
  }
  return `${yyyy}-${mm}-${dd}`;
};

export const calculateAge = (isoDate) => {
  const birth = new Date(`${isoDate}T00:00:00`);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

// Devuelve un mensaje de error para la fecha de nacimiento (DD/MM/AAAA) o null
export const validateBirthDate = (text) => {
  if (isEmpty(text)) return 'La fecha de nacimiento es requerida';
  const iso = parseDateDMY(text);
  if (!iso) return 'Usa el formato DD/MM/AAAA con una fecha válida';
  const age = calculateAge(iso);
  if (age < 0) return 'La fecha no puede ser futura';
  if (age < EDAD_MINIMA) return `Debes tener al menos ${EDAD_MINIMA} años`;
  if (age > 100) return 'Ingresa una fecha de nacimiento válida';
  return null;
};

// Aplica la máscara DD/MM/AAAA mientras el usuario escribe
export const formatDateInput = (text, previous = '') => {
  if (text.length < previous.length) return text;
  const digits = text.replace(/[^0-9]/g, '');
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
};
