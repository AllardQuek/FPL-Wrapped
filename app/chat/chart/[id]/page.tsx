import { getChartSpec } from '@/lib/chat/chart-storage';
import { ChartView } from '@/app/chat/chart/[id]/ChartView';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ChartPage({ params }: PageProps) {
  const { id } = await params;
  const specString = await getChartSpec(id);

  if (!specString) {
    notFound();
  }

  let spec;
  try {
    spec = JSON.parse(specString);
  } catch (e) {
    console.error('Failed to parse chart spec:', e);
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#0d0015] p-4 flex flex-col">
      <ChartView spec={spec} />
    </div>
  );
}
