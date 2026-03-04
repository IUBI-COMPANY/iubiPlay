export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <section>
      <header>
        <h1>Admin Panel</h1>
      </header>
      {children}
    </section>
  );
}
