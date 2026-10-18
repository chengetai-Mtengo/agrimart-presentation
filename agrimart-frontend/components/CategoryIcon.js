import { Apple, Bean, Beef, Bird, Carrot, Fish, Milk, Sprout, Tractor, Wheat } from 'lucide-react';
import { cn } from '@/lib/utils';

const ICONS = {
  grains: Wheat,
  vegetables: Carrot,
  fruits: Apple,
  legumes: Bean,
  tubers: Sprout,
  dairy: Milk,
  livestock: Beef,
  poultry: Bird,
  fish: Fish,
  'farm-inputs': Tractor,
};

export default function CategoryIcon({ id, className }) {
  const Icon = ICONS[id] || Sprout;
  return <Icon className={cn('h-5 w-5', className)} aria-hidden />;
}
