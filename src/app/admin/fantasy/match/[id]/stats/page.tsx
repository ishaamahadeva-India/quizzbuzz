import { redirect } from 'next/navigation';

export default async function AdminFantasyMatchStatsAliasPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/admin/fantasy/ipl/match/${id}/stats`);
}
