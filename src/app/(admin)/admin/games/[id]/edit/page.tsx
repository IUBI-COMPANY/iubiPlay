type Props = { params: { id: string } };

export default function EditGamePage({ params }: Props) {
  return (
    <main>
      <h2>Editar juego</h2>
      <p>ID: {params.id}</p>
    </main>
  );
}
