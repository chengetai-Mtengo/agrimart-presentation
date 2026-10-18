'use client';

import Link from 'next/link';
import Badge from './Badge';
import ProductImage from './ProductImage';
import { formatPrice } from '@/lib/format';
import { MapPin } from 'lucide-react';

export default function ProductCard({ product }) {
  return (
    <Link
      href={`/products/${product.id}`}
      className="group block overflow-hidden rounded-xl border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <ProductImage
        src={product.imageUrl}
        categoryId={product.categoryId}
        alt={product.name}
        className="h-36 w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
      />
      <div className="space-y-2 p-3.5">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-sm font-semibold text-foreground">{product.name}</p>
        </div>
        <Badge status={product.availability} />
        <p className="text-base font-semibold text-primary">
          {formatPrice(product.price)}{' '}
          <span className="text-[12px] font-medium text-muted-foreground">/ {product.unit}</span>
        </p>
        {product.supplierName && (
          <p className="truncate text-xs text-muted-foreground">{product.supplierName}</p>
        )}
        {product.location && (
          <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            {product.location}
            {product.province ? `, ${product.province}` : ''}
          </p>
        )}
      </div>
    </Link>
  );
}
