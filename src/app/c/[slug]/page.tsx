// TODO: Colleague detail page — tabs for Chat / Files / About
type Params = Promise<{ slug: string }>;

export default async function ColleagueDetailPage({
  params,
}: {
  params: Params;
}) {
  const { slug } = await params;
  return (
    <main>
      <h1>Colleague: {slug} (TODO)</h1>
    </main>
  );
}
