'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { UNITS, PROVINCES } from '@/lib/categories';
import { useCategories } from '@/context/CategoriesContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppShell from '@/components/AppShell';
import TopBar from '@/components/TopBar';
import Button from '@/components/Button';
import { Field, TextInput, TextArea, Select } from '@/components/Fields';
import { ErrorNote } from '@/components/Spinner';
import LocationPinField from '@/components/LocationPinField';
import CategoryPill from '@/components/CategoryPill';
import CategoryIcon from '@/components/CategoryIcon';
import { ImagePlus } from 'lucide-react';

function AddProductContent() {
  const { user } = useAuth();
  const { categories } = useCategories();
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [form, setForm] = useState({
    name: '',
    categoryId: '',
    price: '',
    quantity: '',
    unit: 'kg',
    description: '',
    location: user.location || '',
    province: user.province || '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [coords, setCoords] = useState(null);

  useEffect(() => {
    if (categories.length > 0 && !form.categoryId) {
      setForm((current) => ({ ...current, categoryId: categories[0].id }));
    }
  }, [categories, form.categoryId]);

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function onPickImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('categoryId', form.categoryId);
      fd.append('price', form.price);
      fd.append('quantity', form.quantity);
      fd.append('unit', form.unit);
      fd.append('description', form.description);
      fd.append('location', form.location);
      fd.append('province', form.province);
      fd.append('availability', 'available');
      if (coords) {
        fd.append('latitude', coords.lat.toFixed(6));
        fd.append('longitude', coords.lng.toFixed(6));
      }
      if (imageFile) fd.append('image', imageFile);

      const product = await api.createProduct(fd);
      router.replace(`/products/${product.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell nav={false} width="default">
      <TopBar title="Add Product" />
      <div className="px-4 pb-6 md:px-0">
        <div className="mx-auto max-w-2xl rounded-xl border bg-card p-5 shadow-sm md:p-8">
          <form onSubmit={handleSubmit}>
            <ErrorNote message={error} />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="mb-6 flex h-44 w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-lg border border-dashed border-input bg-muted/30 text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {imagePreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
          ) : (
            <>
              <ImagePlus className="h-6 w-6" />
              <span className="text-sm font-medium">Add product photo</span>
              <span className="text-xs">Click to upload</span>
            </>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
          className="hidden"
          onChange={onPickImage}
        />

        <Field label="Product Name" required>
          <TextInput
            placeholder="e.g. White Maize, Tomatoes"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            required
          />
        </Field>

        <Field label="Category" required>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <CategoryPill
                key={cat.id}
                icon={<CategoryIcon id={cat.id} className="h-3.5 w-3.5" />}
                label={cat.name}
                active={form.categoryId === cat.id}
                onClick={() => update('categoryId', cat.id)}
              />
            ))}
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Price (ZMW)" required>
            <TextInput
              type="number"
              min="0"
              step="0.01"
              placeholder="0"
              value={form.price}
              onChange={(e) => update('price', e.target.value)}
              required
            />
          </Field>
          <Field label="Quantity" required>
            <TextInput
              type="number"
              min="0"
              step="1"
              placeholder="0"
              value={form.quantity}
              onChange={(e) => update('quantity', e.target.value)}
              required
            />
          </Field>
        </div>

        <Field label="Unit" required>
          <div className="flex flex-wrap gap-2">
            {UNITS.map((unit) => (
              <button
                type="button"
                key={unit}
                onClick={() => update('unit', unit)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  form.unit === unit ? 'border-primary bg-primary text-primary-foreground' : 'border-input bg-background hover:bg-muted'
                }`}
              >
                {unit}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Description">
          <TextArea
            placeholder="Describe your product..."
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
          />
        </Field>

        <Field label="Location">
          <TextInput
            placeholder="e.g. Chongwe"
            value={form.location}
            onChange={(e) => update('location', e.target.value)}
          />
        </Field>

        <Field label="Province">
          <Select value={form.province} onChange={(e) => update('province', e.target.value)}>
            <option value="">Select province</option>
            {PROVINCES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Farm Location on Map" hint="Buyers use this to find you on Nearby Farms">
          <LocationPinField value={coords} onChange={setCoords} />
        </Field>

        <Button type="submit" loading={loading} className="mt-2">
              List Product
            </Button>
          </form>
        </div>
      </div>
    </AppShell>
  );
}

export default function AddProductPage() {
  return (
    <ProtectedRoute>
      <AddProductContent />
    </ProtectedRoute>
  );
}
