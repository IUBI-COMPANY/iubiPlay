type Props = {
  placeholder?: string;
  action?: string;
  defaultValue?: string;
};

export function FiltersBar({ placeholder = 'Buscar', action = '/games', defaultValue = '' }: Props) {
  return (
    <form action={action} method="get" className="flex w-full items-center gap-3">
      <input
        name="search"
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-slate-300 focus:border-purple-300 focus:outline-none"
      />
      <button type="submit" className="btn-primary">Buscar</button>
    </form>
  );
}
