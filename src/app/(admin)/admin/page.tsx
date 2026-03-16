import { Sparkles, Gamepad2, Tags, Users, TrendingUp } from 'lucide-react';

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Panel de Control</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-lg font-medium italic">&quot;Colabora con la comunidad para hacer de IubiPlay un lugar mejor&quot;</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Visitas totales', value: '2,450', icon: TrendingUp, color: 'text-violet-600', trend: '+12.5%' },
          { label: 'Recursos activos', value: '48', icon: Gamepad2, color: 'text-emerald-500', trend: 'Estable' },
          { label: 'Categorías', value: '12', icon: Tags, color: 'text-amber-500', trend: '+2 nuevas' },
          { label: 'Estudiantes', value: '890', icon: Users, color: 'text-blue-500', trend: '+5% este mes' },
        ].map((stat) => (
          <div key={stat.label} className="card-startup">
            <div className="card-startup-inner">
              <div className="flex items-center justify-between">
                <div className={cn("p-2 rounded-xl bg-slate-50 dark:bg-white/5", stat.color)}>
                  <stat.icon size={20} />
                </div>
                <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">{stat.trend}</span>
              </div>
              <div className="mt-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{stat.label}</p>
                <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 card-startup p-0!">
          <div className="card-startup-inner p-6!">
            <h3 className="text-lg font-bold">Actividad Reciente</h3>
            <div className="mt-6 space-y-6">
              {[
                { activity: "Nuevo recurso publicado", target: "Matemáticas Avanzadas", time: "Hace 2 horas" },
                { activity: "Categoría actualizada", target: "Ciencias", time: "Hace 5 horas" },
                { activity: "Nuevo registro de usuario", target: "David Smith", time: "Hace 1 día" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-2 h-2 rounded-full bg-violet-600" />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-800 dark:text-white">{item.activity}</p>
                    <p className="text-xs text-slate-500">{item.target}</p>
                  </div>
                  <p className="text-[10px] font-medium text-slate-400 whitespace-nowrap">{item.time}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card-startup p-0!">
          <div className="card-startup-inner p-6! bg-linear-to-br from-violet-600 to-indigo-700 text-white">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={20} />
              <h3 className="font-bold">Iubi Insight</h3>
            </div>
            <p className="text-sm text-indigo-100/90 leading-relaxed">
              Los recursos de &quot;Matemáticas&quot; están teniendo un 25% más de interacción este mes. Considera destacar nuevos juegos en esta categoría.
            </p>
            <button className="mt-6 w-full py-3 rounded-2xl bg-white text-violet-600 text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-900/40 hover:scale-105 transition-transform">
              Ver reporte detallado
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Internal utility since cn might be needed but we are in a server component-ish context sometimes
function cn(...inputs: (string | undefined | null | false)[]): string {
  return inputs.filter(Boolean).join(' ');
}
