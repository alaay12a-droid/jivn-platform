import { AlertCircle, ArrowRight } from 'lucide-react';
import { Link } from 'wouter';

export default function NotFound() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#2b160e] px-5 text-white" dir="rtl">
      <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-[#fffaf4] p-8 text-[#4b2415] shadow-2xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f7dfd0] text-[#c4542b]"><AlertCircle size={22} /></div>
          <div>
            <div className="text-xs font-bold tracking-[.18em] text-[#c4542b]">٤٠٤</div>
            <h1 className="text-2xl font-bold">الصفحة غير موجودة</h1>
          </div>
        </div>
        <p className="text-sm leading-7 text-[#806554]">يبدو أن الرابط تغيّر أو أن الصفحة أخذت استراحة. لنعد إلى البداية.</p>
        <Link href="/" className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#e86b32] px-5 py-3 text-sm font-bold text-white" data-testid="link-not-found-home">العودة إلى الموقع <ArrowRight size={16} /></Link>
      </div>
    </div>
  );
}
