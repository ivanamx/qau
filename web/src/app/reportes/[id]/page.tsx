type Props = { params: Promise<{ id: string }> };

export default async function ReporteDetailPage({ params }: Props) {
  const { id } = await params;
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-white px-4 py-3">
        <a href="/" className="text-blue-600 hover:underline">← Inicio</a>
        <h1 className="text-xl font-semibold mt-2">Reporte {id}</h1>
      </header>
      <main className="flex-1 p-4">
        <p className="text-gray-600">Detalle del reporte (modal o página). (Fase 1)</p>
      </main>
    </div>
  );
}
