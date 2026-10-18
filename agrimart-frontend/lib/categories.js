export const UNITS = ['kg', '25kg bag', '50kg bag', 'crate', 'bunch', 'litre'];

export const AVAILABILITY = [
  { value: 'available', label: 'Available' },
  { value: 'limited', label: 'Limited Stock' },
  { value: 'sold_out', label: 'Sold Out' },
  { value: 'hidden', label: 'Hidden' },
];

export const PROVINCES = [
  'Lusaka',
  'Copperbelt',
  'Central',
  'Eastern',
  'Southern',
  'Northern',
  'Luapula',
  'Muchinga',
  'North-Western',
  'Western',
];

export function availabilityLabel(value) {
  const found = AVAILABILITY.find((a) => a.value === value);
  return found ? found.label : value;
}

export function availabilityStyle(value) {
  if (value === 'limited') return { bg: '#FBE7CE', text: '#B45309', dot: '#F59E0B' };
  if (value === 'sold_out') return { bg: '#FCE4E4', text: '#B91C1C', dot: '#DC2626' };
  if (value === 'hidden') return { bg: '#E4E7E1', text: '#71797A', dot: '#71797A' };
  return { bg: '#E3F1E9', text: '#0B6E4F', dot: '#0B6E4F' };
}
