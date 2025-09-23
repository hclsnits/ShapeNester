import React, { useRef, useState } from "react";
import { parsePortfolioXlsx } from "../portfolio/xlsx.ts";

export default function PortfolioUpload({ onParsed }) {
  const [name, setName] = useState("");
  const [count, setCount] = useState(0);
  const [err, setErr] = useState("");
  const inputRef = useRef(null);

  async function handleFile(f) {
    setErr("");
    try {
      setName(f.name);
      const rows = await parsePortfolioXlsx(f);
      setCount(rows.length);
      onParsed?.(rows);
    } catch (e) {
      console.error(e);
      setErr(String(e?.message || e));
    }
  }

  return (
    <section className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Upload portfolio (XLSX)</h2>
        <button
          className="rounded-md border px-3 py-1 text-sm bg-white hover:bg-gray-50"
          onClick={() => inputRef.current?.click()}
        >
          Choose file
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={e => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />
      </div>
      <div className="mt-2 text-sm text-gray-700">
        {name ? <>Loaded <b>{name}</b> — {count} rows</> : "No file selected"}
        {err && <div className="mt-2 text-red-600">{err}</div>}
      </div>
    </section>
  );
}
