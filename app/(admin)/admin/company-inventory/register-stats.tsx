'use client';

import { Archive, Building2, Package, SearchX, UserCheck, Wrench } from 'lucide-react';
import { StatsCard } from '@/components/stats-card';

const cards = [
  { state: '', key: 'total', title: 'Total assets', description: 'All registered equipment', icon: Package, color: 'text-blue-600' },
  { state: 'Storage', key: 'Storage', title: 'In storage', description: 'Equipment held in storage', icon: Archive, color: 'text-green-600' },
  { state: 'Assigned', key: 'Assigned', title: 'With staff', description: 'Personally assigned equipment', icon: UserCheck, color: 'text-purple-600' },
  { state: 'Shared', key: 'Shared', title: 'Shared use', description: 'Department and office equipment', icon: Building2, color: 'text-blue-600' },
  { state: 'Repairs', key: 'Repairs', title: 'Under repair', description: 'Equipment receiving maintenance', icon: Wrench, color: 'text-orange-500' },
  { state: 'Missing', key: 'Missing', title: 'Missing', description: 'Equipment reported missing', icon: SearchX, color: 'text-red-600' },
];

export function RegisterStats({ counts, activeState, onChange }: { counts: Record<string, number>; activeState?: string; onChange: (state: string) => void }) {
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {cards.map(card => <StatsCard key={card.key} title={card.title} description={card.description}
      icon={card.icon} iconClassName={card.color} value={counts[card.key] ?? 0}
      active={(activeState || '') === card.state} onClick={() => onChange(card.state)} />)}
  </div>;
}
