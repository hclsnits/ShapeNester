import { PortfolioRow } from "@/lib/portfolio-parser";

interface PortfolioSummaryProps {
  row: PortfolioRow | null;
}

export function PortfolioSummary({ row }: PortfolioSummaryProps) {
  return (
    <div className="rounded-lg border p-3">
      <div className="font-medium mb-1">Material specifications</div>
      {row ? (
        <div className="rounded-md border overflow-visible">
          <table className="w-full text-sm">
            <tbody className="[&_tr]:border-b [&_tr:last-child]:border-0">
              <tr>
                <th
                  scope="row"
                  className="w-1/2 bg-gray-50 px-3 py-2 text-left font-medium"
                >
                  Material type
                </th>
                <td className="px-3 py-2 text-right">
                  {row.materiaalsoort ?? "—"}
                </td>
              </tr>
              <tr>
                <th
                  scope="row"
                  className="bg-gray-50 px-3 py-2 text-left font-medium"
                >
                  Product code
                </th>
                <td className="px-3 py-2 text-right">
                  {row.artikelcode ?? "—"}
                </td>
              </tr>
              <tr>
                <th
                  scope="row"
                  className="bg-gray-50 px-3 py-2 text-left font-medium"
                >
                  Density
                </th>
                <td className="px-3 py-2 text-right">
                  {row.densiteit_raw != null && row.densiteit_raw !== ""
                    ? `${Number(row.densiteit_raw).toLocaleString(undefined, { maximumFractionDigits: 3 })} g/cm³`
                    : "—"}
                </td>
              </tr>
              <tr>
                <th
                  scope="row"
                  className="bg-gray-50 px-3 py-2 text-left font-medium"
                >
                  Thickness
                </th>
                <td className="px-3 py-2 text-right">
                  {row.dikte_mm != null ? `${String(row.dikte_mm)} mm` : "—"}
                </td>
              </tr>
              <tr>
                <th
                  scope="row"
                  className="bg-gray-50 px-3 py-2 text-left font-medium"
                >
                  Color
                </th>
                <td className="px-3 py-2 text-right">{row.kleur ?? "—"}</td>
              </tr>
              <tr>
                <th
                  scope="row"
                  className="bg-gray-50 px-3 py-2 text-left font-medium"
                >
                  Fabric width
                </th>
                <td className="px-3 py-2 text-right">
                  {row.doekbreedte_mm != null
                    ? `${String(row.doekbreedte_mm)} mm`
                    : "—"}
                </td>
              </tr>
              <tr>
                <th
                  scope="row"
                  className="bg-gray-50 px-3 py-2 text-left font-medium"
                >
                  Price
                </th>
                <td className="px-3 py-2 text-right">
                  {row.prijs_per_m2_cents != null
                    ? `€ ${(Number(row.prijs_per_m2_cents) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / m²`
                    : "—"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-sm text-red-600">
          Select exactly one material type to continue.
        </div>
      )}
    </div>
  );
}
