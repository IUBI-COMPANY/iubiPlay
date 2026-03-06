import { Search } from 'lucide-react';

type Props = {
  placeholder?: string;
  action?: string;
  defaultValue?: string;
};

export function FiltersBar({ placeholder = 'Buscar herramientas...', action = '/games', defaultValue = '' }: Props) {
  return (
    <form action={action} method="get" className="flex w-full items-center gap-3">
      <div className="relative group w-full">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-500 transition-colors">
          <Search size={18} />
        </span>
        <input
          name="search"
          defaultValue={defaultValue}
          placeholder={placeholder}
          className="h-12 w-full glass-panel rounded-2xl bg-white/5 pl-11 pr-4 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 focus:border-violet-500/50 outline-none transition-all"
        />
      </div>
      <button type="submit" className="btn-primary min-w-[100px] h-12">
        Buscar
      </button>
    </form>
  );
}
