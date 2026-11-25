const SAWERIA_URL = 'https://saweria.co/Yaudahiya9';

const SAWERIA_MESSAGE =
  'Halo ka, makasih udah mampir ke Gudang Ilmu. Web ini aku bangun dari nol, begadang, sambil belajar juga. Semua materinya gratis. Kalau kamu ngerasa terbantu, boleh banget traktir aku kopi. Ga harus banyak, seikhlasnya aja udah bikin aku semangat banget buat nambahin materi baru. Sekecil apapun dukungan kamu, bener-bener berarti buat aku. Makasih ya udah mau support';

interface SaweriaButtonProps {
  compact?: boolean;
}

export function SaweriaButton({ compact = false }: SaweriaButtonProps) {
  return (
    <a
      href={SAWERIA_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center rounded-lg bg-[#FAAE2B] font-semibold text-slate-950 transition-colors hover:bg-[#e89d1e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FAAE2B] whitespace-nowrap shrink-0 ${
        compact ? 'min-h-[38px] px-3.5 py-1.5 text-xs' : 'min-h-[42px] px-5 py-2.5 text-sm'
      }`}
    >
      <span className={compact ? 'hidden sm:inline' : ''}>☕ Traktir Kopi - Dukung Bri Tech</span>
      {compact && <span className="sm:hidden">☕ Traktir Kopi</span>}
    </a>
  );
}

export function SaweriaCard() {
  return (
    <section
      aria-label="Dukungan Saweria"
      className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
        <div className="max-w-2xl space-y-2">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Dukung Pengembangan Gudang Ilmu
          </h2>
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {SAWERIA_MESSAGE}
          </p>
        </div>
        <div className="shrink-0">
          <SaweriaButton />
        </div>
      </div>
    </section>
  );
}
