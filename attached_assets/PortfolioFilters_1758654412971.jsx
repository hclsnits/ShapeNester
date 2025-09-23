import React, { useMemo, useState, useEffect } from "react";

/** rows: PortfolioRow[] (runtime, no types), onSelect(row|null) */
export default function PortfolioFilters({ rows, onSelect }) {
  const [dens, setDens] = useState("");
  const [thick, setThick] = useState("");
  const [color, setColor] = useState("");

  const densOptions = useMemo(() => {
    const s = new Set(rows.map(r => String(r.densiteit_raw).trim()).filter(Boolean));
    return Array.from(s).sort();
  }, [rows]);

  const thickOptions = useMemo(() => {
    const s = new Set(
      rows
        .filter(r => !dens || String(r.densiteit_raw).trim() === dens)
        .map(r => String(r.dikte_mm))
    );
    return Array.from(s).sort((a,b)=> BigInt(a) < BigInt(b) ? -1 : 1);
  }, [rows, dens]);

  const colorOptions = useMemo(() => {
    const s = new Set(
      rows
        .filter(r => (!dens || String(r.densiteit_raw).trim() === dens) &&
                     (!thick || String(r.dikte_mm) === thick))
        .map(r => String(r.kleur).trim())
        .filter(Boolean)
    );
    return Array.from(s).sort();
  }, [rows, dens, thick]);

  const filtered = useMemo(() => {
    return rows.filter(r =>
      (!dens || String(r.densiteit_raw).trim() === dens) &&
      (!thick || String(r.dikte_mm) === thick) &&
      (!color || String(r.kleur).trim() === color)
    );
  }, [rows, dens, thick, color]);

  useEffect(() => {
    onSelect?.(filtered.length === 1 ? filtered[0] : null);
  }, [filtered, onSelect]);

  return (
    <section className="rounded-2xl border bg-white p-4 shadow-sm">
      <h2 className="text-lg font-medium">Step 1 — Select material type</h2>
      <div className="mt-3 grid gap-3">
        <Sel label="Density (g/cm3)" value={dens} onChange={setDens} options={densOptions} placeholder="Choose…" />
        <Sel label="Thickness (mm)" value={thick} onChange={setThick} options={thickOptions} placeholder="Choose…" />
        <Sel label="Color" value={color} onChange={setColor} options={colorOptions} placeholder="Choose…" />
      </div>
      <div className="mt-2 text-sm">
        {filtered.length === 0 && <span className="text-red-600">No match — adjust filters</span>}
        {filtered.length > 1 && <span className="text-amber-600">Multiple matches — refine filters</span>}
        {filtered.length === 1 && <span className="text-emerald-700">✓ Exactly 1 article selected</span>}
      </div>
    </section>
  );
}

function Sel({ label, value, onChange, options, placeholder }) {
  return (
    <label className="block">
      <span className="text-sm text-gray-700">{label}</span>
      <select
        className="mt-1 w-full rounded-lg border px-3 py-2 text-sm bg-white"
        value={value}
        onChange={e => onChange(e.target.value)}
      >
        <option value="">{placeholder}</option>
        {options.map(v => <option key={v} value={v}>{v}</option>)}
      </select>
    </label>
  );
}
