'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, resolveImageUrl } from '@/lib/api';
import { UNITS, AVAILABILITY } from '@/lib/categories';
import { useCategories } from '@/context/CategoriesContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppShell from '@/components/AppShell';
import TopBar from '@/components/TopBar';
import Button from '@/components/Button';
import { Field, TextInput, TextArea } from '@/components/Fields';
import { ErrorNote } from '@/components/Spinner';
import Spinner from '@/components/Spinner';
import LocationPinField from '@/components/LocationPinField';
import CategoryPill from '@/components/CategoryPill';
import CategoryIcon from '@/components/CategoryIcon';
import { ImagePlus } from 'lucide-react';

function EditProductContent() {
  const { id } = useParams();
  const { categories } = useCategories();
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [coords, setCoords] = useState(null);

  useEffect(() => {
    api
      .getProduct(id)
      .then((p) => {
        setForm({
          name: p.name,
          categoryId: p.categoryId,
          price: p.price,
          quantity: p.quantity,
          unit: p.unit,
          availability: p.availability,
          description: p.description || '',
          imageUrl: p.imageUrl,
        });
        if (p.latitude != null && p.longitude != null) {
          setCoords({ lat: p.latitude, lng: p.longitude });
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

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
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('categoryId', form.categoryId);
      fd.append('price', form.price);
      fd.append('quantity', form.quantity);
      fd.append('unit', form.unit);
      fd.append('availability', form.availability);
      fd.append('description', form.description);
      if (coords) {
        fd.append('latitude', coords.lat.toFixed(6));
        fd.append('longitude', coords.lng.toFixed(6));
      }
      if (imageFile) fd.append('image', imageFile);

      await api.updateProduct(id, fd);
      router.replace(`/products/${id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading || !form) {
    return (
      <AppShell nav={false} width="default">
        <TopBar title="Edit Product" />
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell nav={false} width="default">
      <TopBar title="Edit Product" />
      <div className="px-4 pb-6 md:px-0">
        <div className="mx-auto max-w-2xl rounded-xl border bg-card p-5 shadow-sm md:p-8">
          <form onSubmit={handleSubmit}>
            <ErrorNote message={error} />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="mb-6 flex h-44 w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-lg border border-dashed border-input bg-muted/30 text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {imagePreview || form.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imagePreview || resolveImageUrl(form.imageUrl)}
              alt="Preview"
              className="h-full w-full object-cover"
            />
          ) : (
            <>
              <ImagePlus className="h-6 w-6" />
              <span className="text-sm font-medium">Add product photo</span>
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

        <Field label="Product Name">
          <TextInput value={form.name} onChange={(e) => update('name', e.target.value)} />
        </Field>

        <Field label="Category">
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
          <Field label="Price (ZMW)">
            <TextInput
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(e) => update('price', e.target.value)}
            />
          </Field>
          <Field label="Quantity">
            <TextInput
              type="number"
              min="0"
              step="1"
              value={form.quantity}
              onChange={(e) => update('quantity', e.target.value)}
            />
          </Field>
        </div>

        <Field label="Unit">
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

        <Field label="Status">
          <div className="flex flex-wrap gap-2">
            {AVAILABILITY.map((status) => (
              <button
                type="button"
                key={status.value}
                onClick={() => update('availability', status.value)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  form.availability === status.value
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-input bg-background hover:bg-muted'
                }`}
              >
                {status.label}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Description">
          <TextArea
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
          />
        </Field>

        <Field label="Farm Location on Map" hint="Buyers use this to find you on Nearby Farms">
          <LocationPinField
            value={coords}
            onChange={setCoords}
            center={coords ? [coords.lat, coords.lng] : undefined}
          />
        </Field>

        <Button type="submit" loading={saving} className="mt-2">
              Save Changes
            </Button>
          </form>
        </div>
      </div>
    </AppShell>
  );
}

export default function EditProductPage() {
  return (
    <ProtectedRoute>
      <EditProductContent />
    </ProtectedRoute>
  );
}
