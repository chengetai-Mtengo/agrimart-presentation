'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertTriangle, RefreshCw, Sparkles, TrendingUp } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppShell from '@/components/AppShell';
import TopBar from '@/components/TopBar';
import Button from '@/components/Button';
import Spinner, { ErrorNote } from '@/components/Spinner';
import { Field, Select } from '@/components/Fields';
import { useAuth } from '@/context/AuthContext';
import { formatPrice } from '@/lib/format';
import { MlApiError, mlApi } from '@/lib/ml-api';

function errorMessage(error) {
  if (error instanceof MlApiError && error.details?.closest?.length) {
    return `${error.message}. Closest matches: ${error.details.closest.join(', ')}.`;
  }
  return error?.message || 'Unable to load the forecast.';
}

function ForecastCard({ forecast }) {
  return (
    <article className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-foreground">{forecast.province}</h3>
          <p className="text-xs text-muted-foreground">{forecast.commodity} · {forecast.unit}</p>
        </div>
        <span className="rounded-full bg-primary-light px-3 py-1 text-xs font-semibold text-primary">
          Forecast: {forecast.forecast_date}
        </span>
      </div>

      <p className="mt-5 text-3xl font-semibold tracking-tight text-primary">
        {formatPrice(forecast.predicted_price)}
        <span className="ml-2 text-sm font-medium text-muted-foreground">per {forecast.unit}</span>
      </p>

      <dl className="mt-4 grid gap-3 rounded-lg bg-muted/60 p-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs text-muted-foreground">Expected range</dt>
          <dd className="mt-1 text-sm font-semibold">
            {formatPrice(forecast.lower_bound)} – {formatPrice(forecast.upper_bound)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Last observation</dt>
          <dd className="mt-1 text-sm font-semibold">
            {formatPrice(forecast.last_observed_price)} · {forecast.last_observation_date}
          </dd>
        </div>
      </dl>

      {forecast.warning && (
        <div className="mt-4 flex gap-2 rounded-lg border border-accent/30 bg-accent-bg p-3 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          <p className="leading-relaxed text-foreground">{forecast.warning}</p>
        </div>
      )}
    </article>
  );
}

function PredictionsContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const productCommodity = searchParams.get('commodity') || '';
  const productProvince = searchParams.get('province') || '';
  const productUnit = searchParams.get('unit') || '';
  const auto = searchParams.get('auto') === '1';

  const [catalogue, setCatalogue] = useState(null);
  const [commodity, setCommodity] = useState(productCommodity);
  const [province, setProvince] = useState(productProvince || user?.province || '');
  const [unit, setUnit] = useState('');
  const [result, setResult] = useState(null);
  const [catalogueLoading, setCatalogueLoading] = useState(true);
  const [predicting, setPredicting] = useState(false);
  const [error, setError] = useState('');
  const autoRequested = useRef(false);

  const selected = useMemo(
    () => catalogue?.commodities.find((item) => item.commodity.toLowerCase() === commodity.toLowerCase()),
    [catalogue, commodity]
  );

  const loadCatalogue = useCallback(async () => {
    setCatalogueLoading(true);
    setError('');
    try {
      const next = await mlApi.commodities();
      setCatalogue(next);
      const requestedCommodity = productCommodity || next.commodities[0]?.commodity || '';
      const item = next.commodities.find(
        (entry) => entry.commodity.toLowerCase() === requestedCommodity.toLowerCase()
      );
      const preferredProvince = productProvince || user?.province || '';
      setCommodity(requestedCommodity);
      setProvince(
        item?.provinces.includes(preferredProvince)
          ? preferredProvince
          : item?.provinces[0] || preferredProvince || next.provinces[0] || ''
      );
      setUnit(
        item?.units.includes(productUnit)
          ? productUnit
          : item?.units.length === 1
            ? item.units[0]
            : ''
      );
    } catch (nextError) {
      setError(errorMessage(nextError));
    } finally {
      setCatalogueLoading(false);
    }
  }, [productCommodity, productProvince, productUnit, user?.province]);

  useEffect(() => {
    loadCatalogue();
  }, [loadCatalogue]);

  const runPrediction = useCallback(async (request = { commodity, province, unit }) => {
    if (!request.commodity) return;
    setPredicting(true);
    setError('');
    setResult(null);
    try {
      const next = await mlApi.predict(request);
      setResult(next);
      setCommodity(next.matched_commodity);
    } catch (nextError) {
      setError(errorMessage(nextError));
    } finally {
      setPredicting(false);
    }
  }, [commodity, province, unit]);

  useEffect(() => {
    if (!catalogueLoading && catalogue && auto && commodity && !autoRequested.current) {
      autoRequested.current = true;
      runPrediction({ commodity, province, unit });
    }
  }, [auto, catalogue, catalogueLoading, commodity, province, runPrediction, unit]);

  const provinces = selected?.provinces || catalogue?.provinces || [];
  const units = selected?.units || [];
  const customCommodity = commodity && !catalogue?.commodities.some(
    (item) => item.commodity.toLowerCase() === commodity.toLowerCase()
  );

  if (catalogueLoading) {
    return (
      <AppShell nav={false} width="default">
        <TopBar title="Price Predictions" />
        <div className="flex flex-col items-center gap-3 py-20">
          <Spinner size={30} />
          <p className="text-sm text-muted-foreground">Loading forecast catalogue…</p>
        </div>
      </AppShell>
    );
  }

  if (!catalogue) {
    return (
      <AppShell nav={false} width="default">
        <TopBar title="Price Predictions" />
        <div className="px-4 py-8 md:px-0">
          <ErrorNote message={error} />
          <Button type="button" onClick={loadCatalogue}>
            <RefreshCw className="h-4 w-4" /> Retry
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell nav={false} width="default">
      <TopBar title="Price Predictions" />
      <div className="px-4 pb-8 md:px-0">
        <section className="rounded-xl border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-light text-primary">
              <TrendingUp className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Province price forecast</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Request a one-month-ahead ZMW estimate directly from the Zambia Prices ML service.
              </p>
            </div>
          </div>

          <form
            className="mt-6 grid gap-x-4 sm:grid-cols-3"
            onSubmit={(event) => {
              event.preventDefault();
              runPrediction();
            }}
          >
            <Field label="Commodity" required>
              <Select
                value={commodity}
                onChange={(event) => {
                  const value = event.target.value;
                  const item = catalogue.commodities.find((entry) => entry.commodity === value);
                  setCommodity(value);
                  setProvince(item?.provinces.includes(user?.province) ? user.province : item?.provinces[0] || '');
                  setUnit(item?.units.length === 1 ? item.units[0] : '');
                  setResult(null);
                }}
              >
                {customCommodity && <option value={commodity}>{commodity} (product name)</option>}
                {catalogue.commodities.map((item) => (
                  <option key={item.commodity} value={item.commodity}>{item.commodity}</option>
                ))}
              </Select>
            </Field>

            <Field label="Province" required>
              <Select value={province} onChange={(event) => { setProvince(event.target.value); setResult(null); }}>
                {provinces.map((item) => <option key={item} value={item}>{item}</option>)}
              </Select>
            </Field>

            <Field label="Unit" hint={units.length > 1 ? 'Select the market unit.' : 'Selected automatically when available.'}>
              <Select value={unit} onChange={(event) => { setUnit(event.target.value); setResult(null); }} disabled={units.length <= 1}>
                <option value="">Automatic</option>
                {units.map((item) => <option key={item} value={item}>{item}</option>)}
              </Select>
            </Field>

            <div className="sm:col-span-3">
              <Button type="submit" loading={predicting} disabled={!commodity || !province}>
                <Sparkles className="h-4 w-4" /> Generate forecast
              </Button>
            </div>
          </form>
        </section>

        {error && <div className="mt-5"><ErrorNote message={error} /></div>}

        {result && (
          <section className="mt-6">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold">Forecast result</h2>
                <p className="text-sm text-muted-foreground">
                  Matched {result.matched_commodity} · {Math.round(result.match_score * 100)}% confidence
                </p>
              </div>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              {result.forecasts.map((forecast) => (
                <ForecastCard key={`${forecast.province}-${forecast.unit}`} forecast={forecast} />
              ))}
            </div>
            <div className="mt-4 flex gap-3 rounded-xl border border-accent/30 bg-accent-bg p-4 text-sm">
              <AlertTriangle className="h-5 w-5 shrink-0 text-accent" />
              <p className="leading-relaxed">
                These are estimates based on historical market data, not guaranteed selling prices. Verify current local prices before making a transaction.
              </p>
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}

export default function PredictionsPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><Spinner /></div>}>
        <PredictionsContent />
      </Suspense>
    </ProtectedRoute>
  );
}
