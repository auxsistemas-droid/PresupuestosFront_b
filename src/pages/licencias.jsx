import { Bell, CalendarDays, Plus, Search, KeyRound } from "lucide-react";

const grupos = [
  {
    titulo: "Vencen en menos de 30 días",
    tono: "rose",
    items: [
      {
        nombre: "Certificado SSL del portal interno",
        proveedor: "DigiCert",
        vence: "02 nov 2026",
        dias: 13,
        costo: "$3,200",
      },
      {
        nombre: "Dominio institucional",
        proveedor: "GoDaddy",
        vence: "14 nov 2026",
        dias: 25,
        costo: "$480",
      },
    ],
  },
  {
    titulo: "Vencen este trimestre",
    tono: "amber",
    items: [
      {
        nombre: "Google Workspace for Education",
        proveedor: "Google",
        vence: "10 dic 2026",
        dias: 51,
        costo: "Sin costo",
      },
      {
        nombre: "SQL Server Standard (2 núcleos)",
        proveedor: "Microsoft",
        vence: "31 dic 2026",
        dias: 72,
        costo: "$28,900",
      },
    ],
  },
  {
    titulo: "Más adelante",
    tono: "emerald",
    items: [
      {
        nombre: "Visual Studio Professional",
        proveedor: "Microsoft",
        vence: "15 mar 2027",
        dias: 146,
        costo: "$9,700",
      },
      {
        nombre: "Antivirus de equipos",
        proveedor: "ESET",
        vence: "30 jun 2027",
        dias: 253,
        costo: "$14,500",
      },
    ],
  },
];

const colores = {
  rose: {
    barra: "bg-rose-500",
    chip: "bg-rose-100 text-rose-800",
    punto: "bg-rose-500",
  },
  amber: {
    barra: "bg-amber-500",
    chip: "bg-amber-100 text-amber-800",
    punto: "bg-amber-500",
  },
  emerald: {
    barra: "bg-emerald-500",
    chip: "bg-emerald-100 text-emerald-800",
    punto: "bg-emerald-500",
  },
};

function Fila({ item, tono }) {
  const c = colores[tono];
  const progreso = Math.max(6, 100 - Math.min(item.dias, 180) / 1.8);
  return (
    <li className="grid grid-cols-12 items-center gap-4 py-4">
      <div className="col-span-12 sm:col-span-5">
        <p className="font-medium text-slate-900">{item.nombre}</p>
        <p className="text-sm text-slate-500">{item.proveedor}</p>
      </div>
      <div className="col-span-6 sm:col-span-3">
        <div className="h-1.5 w-full rounded-full bg-slate-200">
          <div
            className={`h-1.5 rounded-full ${c.barra}`}
            style={{ width: `${progreso}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-slate-500">{item.vence}</p>
      </div>
      <div className="col-span-3 sm:col-span-2">
        <span className={`rounded-md px-2 py-1 text-xs font-medium ${c.chip}`}>
          {item.dias} días
        </span>
      </div>
      <div className="col-span-3 text-right sm:col-span-2">
        <button className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-600">
          Renovar
        </button>
      </div>
    </li>
  );
}

export default function RenovacionLicencias() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-700 text-white">
              <KeyRound size={18} />
            </div>
            <h1 className="text-lg font-semibold text-slate-900">
              Renovación de licencias
            </h1>
          </div>
          <button className="flex items-center gap-2 rounded-lg bg-sky-700 px-4 py-2 text-sm font-medium text-white hover:bg-sky-800 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:ring-offset-2">
            <Plus size={16} /> Agregar licencia
          </button>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-8 px-6 py-8 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <div className="mb-6 flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2">
            <Search size={16} className="text-slate-400" />
            <input
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
              placeholder="Buscar por nombre o proveedor"
            />
          </div>

          {grupos.map((g) => (
            <div key={g.titulo} className="mb-8">
              <div className="flex items-center gap-2 border-b border-slate-300 pb-2">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${colores[g.tono].punto}`}
                />
                <h2 className="font-semibold text-slate-900">{g.titulo}</h2>
                <span className="text-sm text-slate-500">
                  ({g.items.length})
                </span>
              </div>
              <ul className="divide-y divide-slate-200">
                {g.items.map((it) => (
                  <Fila key={it.nombre} item={it} tono={g.tono} />
                ))}
              </ul>
            </div>
          ))}
        </section>

        <aside className="space-y-6">
          <div className="rounded-xl bg-sky-900 p-6 text-white">
            <p className="text-sm text-sky-200">Próximo vencimiento</p>
            <p className="mt-1 text-4xl font-semibold">13 días</p>
            <p className="mt-2 text-sm text-sky-100">
              Certificado SSL del portal interno · 02 nov 2026
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="mb-4 flex items-center gap-2">
              <Bell size={16} className="text-slate-500" />
              <h2 className="font-semibold text-slate-900">Recordatorios</h2>
            </div>
            <ul className="space-y-3 text-sm">
              {["60 días antes", "30 días antes", "7 días antes"].map((r) => (
                <li key={r} className="flex items-center justify-between">
                  <span>{r}</span>
                  <span className="h-5 w-9 rounded-full bg-sky-700 p-0.5">
                    <span className="block h-4 w-4 translate-x-4 rounded-full bg-white" />
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="mb-3 flex items-center gap-2">
              <CalendarDays size={16} className="text-slate-500" />
              <h2 className="font-semibold text-slate-900">
                Gasto por renovar en 2026
              </h2>
            </div>
            <p className="text-2xl font-semibold text-slate-900">$32,580</p>
            <p className="text-sm text-slate-500">
              3 licencias con costo pendientes
            </p>
          </div>
        </aside>
      </main>
    </div>
  );
}
