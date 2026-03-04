type Props = { params: { slug: string } };

export default function CategoryPage({ params }: Props) {
  return (
    <main>
      <h1>Categoria</h1>
      <p>Slug: {params.slug}</p>
    </main>
  );
}
