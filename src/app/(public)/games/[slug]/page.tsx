type Props = { params: Promise<{ slug: string }> };

export default async function GameDetailPage({ params }: Props) {
  const { slug } = await params;

  return (
    <main>
      <h1>Detalle del juego</h1>
      <p>Slug: {slug}</p>
    </main>
  );
}
