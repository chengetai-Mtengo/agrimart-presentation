export function formatPrice(price) {
  const value = Number(price);
  if (Number.isNaN(value)) return 'K0';
  return `K${value % 1 === 0 ? value : value.toFixed(2)}`;
}

export function formatDateLong(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function initialsOf(name) {
  if (!name) return '?';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function phoneToWhatsApp(phone) {
  if (!phone) return '#';
  const digits = phone.replace(/[^0-9]/g, '');
  const withCountry = digits.startsWith('260') ? digits : `260${digits.replace(/^0/, '')}`;
  return `https://wa.me/${withCountry}`;
}

export function phoneToTel(phone) {
  if (!phone) return '#';
  return `tel:${phone}`;
}
