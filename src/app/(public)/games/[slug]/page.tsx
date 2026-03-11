import Link from 'next/link';
import { GameGallery } from '@/src/components/games/game_gallery';
import { getGameBySlug, listGames } from '@/src/lib/db/games';
import { ArrowLeft, Play, LayoutDashboard, Share2, Sparkles } from 'lucide-react';
import { GameRowCarousel } from '@/src/components/games/game_row_carousel';

type Props = { params: Promise<{ slug: string }> };

export default async function GameDetailPage({ params }: Props) {
  const { slug } = await params;
  const game = await getGameBySlug(slug);

  if (!game) {
    return (
      <main className="min-h-[50vh] flex flex-col items-center justify-center">
        <h1 className="text-3xl font-black">Recurso no encontrado</h1>
        <Link href="/games" className="btn-primary mt-6">Volver al catálogo</Link>
      </main>
    );
  }

  // Prepara imágenes para la galería (simulando si no hay 3 al menos repetimos la portada para el efecto)
  const baseImg = game.cover_image_url || game.hero_image_url || '/file.svg';
  const imagesForGallery = [
    baseImg,
    game.hero_image_url || baseImg,
    baseImg
  ];

  const relatedList = await listGames({ status: 'published', limit: 6, throwOnError: false });

  return (
    <main className="space-y-12 pb-12">
      {/* Header y Navegación */}
      <div className="flex items-center gap-4">
        <Link href="/games" className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-800 transition-colors text-violet-400">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white">{game.title}</h1>
        </div>
      </div>

      {/* Hero Section (Galería Interactiva estilo Steam) */}
      <section className="bg-slate-900 rounded-3xl p-4 md:p-6 border border-slate-700 flex flex-col lg:flex-row gap-8">
        {/* Izquierda: Galería */}
        <div className="lg:w-[65%] w-full">
          <GameGallery title={game.title} images={imagesForGallery} />
        </div>

        {/* Derecha: Info y Call to Action */}
        <div className="flex-1 flex flex-col justify-between py-2 max-w-md mx-auto h-fit">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-violet-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400 border border-violet-500/20">
              <Sparkles size={14} className="text-violet-500" />
              Excelente recurso
            </div>
            
            <p className="text-lg text-white leading-relaxed font-medium">
              {game.short_description || "Explora interactuando con este increíble recurso educativo. Ideal para fortalecer los conocimientos de forma dinámica y entretenida."}
            </p>

            {game.description && (
              <div className="bg-white p-4 rounded-2xl border border-white text-sm text-slate-500 mt-2">
                 {game.description}
              </div>
            )}
          </div>

          <div className="pt-8 space-y-4">
            <Link 
              href={game.redirect_url || "#"} 
              target={game.redirect_url ? "_blank" : undefined}
              className="w-full btn-primary h-14 flex items-center justify-center gap-3 text-lg font-bold shadow-xl shadow-violet-500/20"
            >
              <Play size={24} fill="currentColor" />
              Comenzar a Jugar
            </Link>

            <div className="grid grid-cols-2 gap-3">
              <button className="h-12 rounded-xl border border-white bg-white font-bold flex items-center justify-center gap-2 text-slate-500 hover:bg-slate-100 transition">
                <LayoutDashboard size={18} />
                Añadir clase
              </button>
              <button className="h-12 rounded-xl border border-white bg-white font-bold flex items-center justify-center gap-2 text-slate-500 hover:bg-slate-100 transition">
                <Share2 size={18} />
                Compartir
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Carrusel Footer: Juegos Relacionados */}
      <section className="pt-8 border-t border-slate-200 dark:border-white/10">
        <GameRowCarousel title="También te podría interesar" games={relatedList.items} href="/games" />
      </section>
    </main>
  );
}
