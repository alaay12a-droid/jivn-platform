import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type MouseEvent, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { ClerkProvider, SignIn, SignUp, useAuth, useClerk } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/shared/keys';
import {
  ArrowLeft, ArrowUpRight, Bell, Check, ChevronDown,
  CircleDollarSign, ClipboardList, ExternalLink,
  Gauge, Image as ImageIcon, LayoutDashboard, Mail, Menu, MessageCircle, Megaphone, MoreHorizontal, Pencil, Plus, RefreshCw,
  Rocket, Search, Settings2, ShieldCheck, Smartphone, Sparkles, Store, Trash2, Upload, Users,
  X, Zap, LogOut
} from 'lucide-react';
import {
  getGetAdminContentQueryKey, getGetAdminLeadsQueryKey, getGetAdminMediaQueryKey, getGetAdminNotificationsQueryKey, getGetAdminOrderCounterQueryKey, getGetAdminOverviewQueryKey,
  getGetAdminPlansQueryKey, getGetAdminRestaurantsQueryKey, getGetPublicPricingQueryKey,
  getGetPublicRestaurantsQueryKey, getGetPublicSiteQueryKey, useCreateAdminPlan,
  useCreateAdminMedia, useCreateAdminNotification, useCreateAdminRestaurant, useCreateLead, useDeleteAdminLead, useDeleteAdminMedia, useDeleteAdminNotification, useDeleteAdminPlan,
  useDeleteAdminRestaurant, useGetAdminContent, useGetAdminLeads, useGetAdminMedia, useGetAdminNotifications, useGetAdminOverview,
  useGetAdminOrderCounter, useGetAdminPlans, useGetAdminRestaurants, useGetPublicPricing, useGetPublicRestaurants,
  useGetPublicSite, useRequestUploadUrl, useUpdateAdminContent, useUpdateAdminLead,
  useUpdateAdminMedia, useUpdateAdminNotification, useUpdateAdminOrderCounter, useUpdateAdminPlan, useUpdateAdminRestaurant, useGetAdminContact, useUpdateAdminContact,
  getGetAdminContactQueryKey, type Feature, type Lead, type LeadStatus,
  type MarketingOrderCounter, type Notification, type PricingPlan, type PublicMarketingOrderCounter, type RestaurantLogo, type SiteContent, type SiteMedia, type ContactSettings
} from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import NotFound from '@/pages/not-found';
import { Route, Switch, Link, Redirect, Router as WouterRouter, useLocation, useSearch } from 'wouter';

const queryClient = new QueryClient();
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
const clerkPubKey = publishableKeyFromHost(window.location.hostname, import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const fallbackContent: SiteContent = {
  heroTitle: 'تطبيق مطعمك، في جيب عميلك',
  heroDescription: 'نصمم ونطوّر تطبيقات مطاعم تحمل هويتك، وتحوّل كل طلب إلى علاقة أطول مع عميلك.',
  primaryCta: 'ابدأ مشروعك',
  secondaryCta: 'شاهد أعمالنا',
  featuresTitle: 'كل ما يحتاجه مطعمك، في تجربة واحدة',
  howTitle: 'من الفكرة إلى أول طلب',
  workTitle: 'مطاعم تثق بنا',
  pricingTitle: 'استثمار واضح لنمو مطعمك',
  whyTitle: 'نحن لا نسلّمك تطبيقاً فقط',
  finalCta: 'جاهز أن تجعل مطعمك أقرب؟',
  finalCtaButton: 'تحدث مع فريق چڤن'
};

const iconMap: Record<string, typeof Sparkles> = { sparkles: Sparkles, smartphone: Smartphone, rocket: Rocket, bell: Bell, store: Store, zap: Zap };
const arStatus: Record<string, string> = { New: 'جديد', Contacted: 'تم التواصل', 'In Progress': 'قيد المتابعة', Completed: 'مكتمل', Cancelled: 'ملغى' };
const statusTone: Record<string, string> = { New: 'bg-[#fff0e9] text-[#c04d20]', Contacted: 'bg-[#f6eee5] text-[#855232]', 'In Progress': 'bg-[#eee8ff] text-[#6343b3]', Completed: 'bg-[#e7f5e9] text-[#318248]', Cancelled: 'bg-[#f4e9e7] text-[#9b5550]' };
const assetUrl = (path: string) => path.startsWith('http') ? path : `${basePath}/api/storage${path}`;

function Brand({ dark = false, small = false, onSecretGesture }: { dark?: boolean; small?: boolean; onSecretGesture?: () => void }) {
  const tapTimes = useRef<number[]>([]);
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!onSecretGesture) return;
    const now = Date.now();
    const recentTaps = tapTimes.current.filter((time) => now - time < 1500);
    recentTaps.push(now);
    tapTimes.current = recentTaps;
    if (recentTaps.length >= 4) {
      event.preventDefault();
      tapTimes.current = [];
      onSecretGesture();
    }
  };
  return <Link href="/" onClick={onSecretGesture ? handleClick : undefined} data-testid="link-brand" aria-label="چڤن" className={`flex items-center ${dark ? 'text-white' : 'text-[#4b2415]'}`}>
    <img src={`${basePath}/brand-logo.png`} alt="شعار چڤن" className={`${small ? 'h-11 w-7' : 'h-14 w-10'} object-contain`} />
  </Link>;
}

function Button({ children, onClick, href, variant = 'primary', className = '', type = 'button', testId, disabled = false }: { children: ReactNode; onClick?: () => void; href?: string; variant?: 'primary' | 'outline' | 'quiet' | 'dark'; className?: string; type?: 'button' | 'submit'; testId?: string; disabled?: boolean }) {
  const cls = `inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold transition duration-300 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e86b32] disabled:cursor-not-allowed disabled:opacity-50 ${variant === 'primary' ? 'bg-[#e86b32] text-white shadow-[0_12px_30px_rgba(232,107,50,.24)] hover:bg-[#d95c26]' : variant === 'dark' ? 'bg-[#4b2415] text-white hover:bg-[#63311e]' : variant === 'outline' ? 'border border-[#d3bda8] bg-transparent text-[#4b2415] hover:border-[#e86b32] hover:bg-[#fff4eb]' : 'text-[#734022] hover:bg-[#f4e6d9]'} ${className}`;
  if (href) return <Link href={href} className={cls} data-testid={testId}>{children}</Link>;
  return <button type={type} onClick={onClick} className={cls} disabled={disabled} data-testid={testId}>{children}</button>;
}

function SectionEyebrow({ children, light = false }: { children: ReactNode; light?: boolean }) {
  return <div className={`mb-4 flex items-center gap-2 text-[11px] font-bold tracking-[.22em] ${light ? 'text-[#f89b68]' : 'text-[#c25a2a]'}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{children}</div>;
}

function PhoneMockup() {
  return <div className="phone-float relative mx-auto h-[430px] w-[218px] rotate-[5deg] rounded-[34px] border-[7px] border-[#17100c] bg-[#f5ede4] p-2 shadow-[0_32px_70px_rgba(29,11,4,.45)] sm:h-[510px] sm:w-[260px]">
    <div className="absolute left-1/2 top-0 z-10 h-5 w-24 -translate-x-1/2 rounded-b-2xl bg-[#17100c]" />
    <div className="h-full overflow-hidden rounded-[25px] bg-[#fffaf3]">
      <div className="bg-[#4b2415] px-4 pb-5 pt-9 text-white">
        <div className="flex items-center justify-between text-[8px] opacity-80"><span>٩:٤١</span><span>● ● ●</span></div>
        <div className="mt-6 text-right"><div className="text-[10px] opacity-70">مرحباً بكم في</div><div className="text-xl font-bold">مذاق الدار</div></div>
      </div>
      <div className="space-y-4 px-3 py-4" dir="rtl">
        <div className="rounded-2xl bg-[#f8e8d9] p-3"><div className="text-[9px] text-[#8b5a3d]">عرض اليوم</div><div className="mt-1 text-sm font-bold text-[#4b2415]">وجبة العائلة</div><div className="mt-2 h-2 w-20 rounded-full bg-[#e86b32]" /></div>
        <div className="flex gap-2">{['الكل', 'مقبلات', 'رئيسي'].map((item, i) => <div key={item} className={`rounded-full px-2 py-1 text-[8px] ${i === 0 ? 'bg-[#e86b32] text-white' : 'bg-[#f3ebe4] text-[#7e6655]'}`}>{item}</div>)}</div>
        <div className="grid grid-cols-2 gap-2">{['برجر الدار', 'صحن المشاركة', 'باستا كريمية', 'حلى اليوم'].map((item, i) => <div key={item} className="rounded-xl bg-[#f7f1eb] p-2"><div className={`h-14 rounded-lg ${['bg-[#e1a36d]','bg-[#c76d42]','bg-[#d8b889]','bg-[#9f6d53]'][i]}`} /><div className="mt-2 text-[9px] font-bold">{item}</div><div className="mt-1 text-[8px] text-[#e86b32]">٢٥ ر.س</div></div>)}</div>
      </div>
    </div>
  </div>;
}

function EnquiryDialog({ open, onClose, plans }: { open: boolean; onClose: () => void; plans: PricingPlan[] }) {
  const createLead = useCreateLead();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ restaurantName: '', customerName: '', phone: '', whatsapp: '', email: '', city: '', branches: '1', businessType: 'مطعم', packageName: plans[0]?.name ?? 'مخصص', notes: '' });
  if (!open) return null;
  const update = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));
  const submit = (event: FormEvent) => {
    event.preventDefault(); setError('');
    if (!form.restaurantName || !form.customerName || !form.phone || !form.city) { setError('أكمل الحقول الأساسية لنعود إليك بشكل أسرع.'); return; }
    createLead.mutate({ data: { ...form, branches: Number(form.branches) } }, { onSuccess: () => setSent(true), onError: () => setError('تعذر إرسال الطلب حالياً. حاول مرة أخرى.') });
  };
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2a150d]/65 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
    <div className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-[28px] bg-[#fffaf4] p-6 shadow-2xl sm:p-9" dir="rtl">
      <div className="mb-7 flex items-start justify-between"><div><SectionEyebrow>لنبدأ</SectionEyebrow><h2 className="display text-3xl font-extrabold text-[#4b2415]">احكِ لنا عن مطعمك</h2><p className="mt-2 text-sm text-[#866c5c]">فريقنا سيراجع التفاصيل ويتواصل معك خلال يوم عمل.</p></div><button onClick={onClose} className="rounded-full p-2 text-[#795c4c] hover:bg-[#f3e4d6]" aria-label="إغلاق" data-testid="button-close-enquiry"><X size={20} /></button></div>
      {sent ? <div className="rounded-2xl bg-[#e7f5e9] p-8 text-center text-[#28683a]"><div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#c9e9cf]"><Check /></div><h3 className="text-2xl font-bold">وصل طلبك بنجاح</h3><p className="mt-2 text-sm">شكراً لثقتك. سنكون على تواصل قريباً.</p><Button className="mt-6" onClick={onClose} testId="button-close-success">العودة للموقع</Button></div> :
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          {([['restaurantName','اسم المطعم'],['customerName','اسمك الكريم'],['phone','رقم الجوال'],['whatsapp','رقم الواتساب'],['email','البريد الإلكتروني'],['city','المدينة'],['branches','عدد الفروع']] as const).map(([key, label]) => <label key={key} className={key === 'email' ? 'sm:col-span-2' : ''}><span className="mb-2 block text-xs font-bold text-[#604333]">{label}</span><input data-testid={`input-${key}`} type={key === 'email' ? 'email' : key === 'branches' ? 'number' : 'text'} min={key === 'branches' ? 1 : undefined} value={form[key]} onChange={e => update(key, e.target.value)} className="w-full rounded-xl border border-[#dbc7b7] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#e86b32] focus:ring-2 focus:ring-[#e86b32]/15" /></label>)}
          <label><span className="mb-2 block text-xs font-bold text-[#604333]">نوع النشاط</span><select data-testid="select-business-type" value={form.businessType} onChange={e => update('businessType', e.target.value)} className="w-full rounded-xl border border-[#dbc7b7] bg-white px-4 py-3 text-sm"><option>مطعم</option><option>مقهى</option><option>حلويات</option><option>عربة طعام</option></select></label>
          <label><span className="mb-2 block text-xs font-bold text-[#604333]">الباقة المناسبة</span><select data-testid="select-package" value={form.packageName} onChange={e => update('packageName', e.target.value)} className="w-full rounded-xl border border-[#dbc7b7] bg-white px-4 py-3 text-sm">{plans.length ? plans.map(plan => <option key={plan.id}>{plan.name}</option>) : <option>مخصص</option>}</select></label>
          <label className="sm:col-span-2"><span className="mb-2 block text-xs font-bold text-[#604333]">ملاحظات إضافية</span><textarea data-testid="input-notes" rows={3} value={form.notes} onChange={e => update('notes', e.target.value)} className="w-full resize-none rounded-xl border border-[#dbc7b7] bg-white px-4 py-3 text-sm outline-none focus:border-[#e86b32]" placeholder="ما الذي تريد أن يقدمه تطبيقك؟" /></label>
          {error && <div className="sm:col-span-2 rounded-xl bg-[#fff0ed] p-3 text-sm font-medium text-[#b34d3a]" role="alert">{error}</div>}
          <div className="flex items-center justify-between gap-4 pt-2 sm:col-span-2"><span className="text-xs text-[#987e6e]">بالإرسال، توافق على تواصل فريق چڤن معك.</span><Button type="submit" testId="button-submit-enquiry">{createLead.isPending ? 'جارٍ الإرسال…' : 'إرسال الطلب'}<ArrowLeft size={16} /></Button></div>
        </form>}
    </div>
  </div>;
}

function AdminUnlockDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  if (!open) return null;
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setPending(true);
    try {
      const response = await fetch(`${basePath}/api/admin/unlock`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      if (!response.ok) {
        setError(response.status === 503 ? 'لوحة الإدارة غير مهيأة حالياً.' : 'رمز الإدارة غير صحيح.');
        return;
      }
      window.location.href = `${basePath}/admin`;
    } catch {
      setError('تعذر فتح لوحة الإدارة حالياً.');
    } finally {
      setPending(false);
    }
  };
  return <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#2a150d]/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="admin-unlock-title">
    <form onSubmit={submit} className="w-full max-w-sm rounded-[28px] bg-[#fffaf4] p-7 text-right shadow-2xl" dir="rtl">
      <div className="mb-6 flex items-start justify-between gap-4"><div><SectionEyebrow>مساحة خاصة</SectionEyebrow><h2 id="admin-unlock-title" className="display text-2xl font-extrabold text-[#4b2415]">فتح الإدارة</h2><p className="mt-2 text-xs leading-6 text-[#8b7161]">أدخل رمز الوصول الخاص بك للمتابعة.</p></div><button type="button" onClick={onClose} className="rounded-full p-2 text-[#795c4c] hover:bg-[#f3e4d6]" aria-label="إغلاق"><X size={18} /></button></div>
      <label className="block"><span className="mb-2 block text-xs font-bold text-[#604333]">رمز الإدارة</span><input autoFocus type="password" value={code} onChange={event => setCode(event.target.value)} className="w-full rounded-xl border border-[#dbc7b7] bg-white px-4 py-3 text-center text-base tracking-[.25em] outline-none focus:border-[#e86b32] focus:ring-2 focus:ring-[#e86b32]/15" autoComplete="off" /></label>
      {error && <div className="mt-4 rounded-xl bg-[#fff0ed] p-3 text-sm font-medium text-[#b34d3a]" role="alert">{error}</div>}
      <div className="mt-6 flex justify-end gap-3"><Button type="button" variant="quiet" onClick={onClose}>إلغاء</Button><Button type="submit" disabled={pending || !code}>{pending ? 'جارٍ التحقق…' : 'دخول'}</Button></div>
    </form>
  </div>;
}

function PublicSite() {
  const [dialog, setDialog] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [adminUnlockOpen, setAdminUnlockOpen] = useState(false);
  const site = useGetPublicSite();
  const pricing = useGetPublicPricing();
  const restaurants = useGetPublicRestaurants();
  const content = site.data?.content ?? fallbackContent;
  const features = site.data?.features?.filter(f => f.active).sort((a, b) => a.sortOrder - b.sortOrder) ?? [];
  const plans = pricing.data ?? [];
  const logos = restaurants.data ?? [];
  const notifications = site.data?.notifications ?? [];
  const media = site.data?.media ?? [];
  const featureFallback: Feature[] = [
    { id: 1, title: 'هوية تليق بك', description: 'تصميم يحمل شخصية مطعمك ويجعله مألوفاً من أول لمسة.', icon: 'sparkles', sortOrder: 1, active: true },
    { id: 2, title: 'طلبات أسهل', description: 'قائمة رقمية مرتبة وتجربة طلب مصممة لسرعة القرار.', icon: 'smartphone', sortOrder: 2, active: true },
    { id: 3, title: 'جاهز للنشر', description: 'نجهز التطبيق للمتاجر ونبقى معك بعد الإطلاق.', icon: 'rocket', sortOrder: 3, active: true },
    { id: 4, title: 'قريب من عميلك', description: 'إشعارات وعروض تبقي علاقتك حاضرة طوال الأسبوع.', icon: 'bell', sortOrder: 4, active: true },
  ];
  const visibleFeatures = features.length ? features : featureFallback;
  return <div className="jivn-grain min-h-screen overflow-hidden bg-[#fffaf4] text-[#4b2415]" dir="rtl">
    <header className={`absolute inset-x-0 z-40 border-b border-white/10 text-white ${notifications[0] ? 'top-[88px] lg:top-12' : 'top-0'}`}><div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-10"><Brand dark onSecretGesture={() => setAdminUnlockOpen(true)} /><nav className="hidden items-center gap-8 text-sm font-semibold text-white/80 lg:flex"><a href="#features" className="transition hover:text-white" data-testid="link-features">المزايا</a><a href="#process" className="transition hover:text-white" data-testid="link-process">كيف نعمل</a><a href="#work" className="transition hover:text-white" data-testid="link-work">أعمالنا</a><a href="#pricing" className="transition hover:text-white" data-testid="link-pricing">الباقات</a></nav><div className="hidden items-center gap-3 lg:flex"><Button onClick={() => setDialog(true)} testId="button-header-enquiry">ابدأ الآن <ArrowLeft size={16} /></Button></div><button onClick={() => setMobileOpen(v => !v)} className="rounded-full border border-white/20 p-2 lg:hidden" aria-label="فتح القائمة" data-testid="button-mobile-menu">{mobileOpen ? <X size={20} /> : <Menu size={20} />}</button></div>{mobileOpen && <div className="mx-4 mb-4 rounded-2xl border border-white/10 bg-[#2b160e]/95 p-5 lg:hidden"><nav className="flex flex-col gap-4 text-right text-sm"><a href="#features" onClick={() => setMobileOpen(false)}>المزايا</a><a href="#process" onClick={() => setMobileOpen(false)}>كيف نعمل</a><a href="#pricing" onClick={() => setMobileOpen(false)}>الباقات</a><Button onClick={() => { setMobileOpen(false); setDialog(true); }} className="mt-2">ابدأ مشروعك</Button></nav></div>}</header>
     <main>
       {notifications[0] && <div className="bg-[#f4dfcf] px-5 py-3 text-[#4b2415]"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center text-sm lg:justify-between lg:px-10"><div className="flex items-center gap-2"><Megaphone size={15} className="text-[#d45d2b]" /><strong>{notifications[0].title}</strong><span className="text-[#795643]">{notifications[0].message}</span></div>{notifications[0].linkUrl && <a href={notifications[0].linkUrl} className="font-bold text-[#c04f21] underline underline-offset-4">{notifications[0].linkText || 'التفاصيل'} <ArrowLeft size={13} className="mr-1 inline" /></a>}</div></div>}
      <section className="relative isolate min-h-[760px] overflow-hidden bg-[#2b160e] text-white"><div className="absolute inset-0 hero-grid opacity-20" /><div className="absolute -left-24 top-24 h-96 w-96 rounded-full bg-[#e86b32]/15 blur-3xl" /><div className="absolute right-0 top-0 h-full w-1/2 bg-[radial-gradient(circle_at_30%_40%,rgba(232,107,50,.35),transparent_45%),linear-gradient(135deg,rgba(83,36,17,.15),rgba(34,17,10,.8))]" /><div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-40 lg:grid-cols-[1fr_1fr] lg:px-10 lg:pt-48"><div className="reveal max-w-xl"><SectionEyebrow light>شريكك الرقمي للمطاعم</SectionEyebrow><h1 className="display text-balance text-5xl font-extrabold leading-[1.12] sm:text-7xl">{content.heroTitle}<span className="mt-2 block text-[#f17a3d]">بطريقة تليق باسمك.</span></h1><p className="mt-7 max-w-lg text-lg leading-9 text-[#e9d8ca]">{content.heroDescription}</p><div className="mt-9 flex flex-wrap items-center gap-3"><Button onClick={() => setDialog(true)} testId="button-hero-primary">{content.primaryCta}<ArrowLeft size={18} /></Button><a href="#work" className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-3 text-sm font-bold text-white/80 transition hover:bg-white/10" data-testid="link-hero-secondary">{content.secondaryCta}<ArrowDownIcon /></a></div><div className="mt-12 flex items-center gap-6 text-sm text-white/60"><div className="flex -space-x-2 space-x-reverse"><span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#2b160e] bg-[#d79670] text-xs font-bold text-[#4b2415]">م</span><span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#2b160e] bg-[#b5c0a4] text-xs font-bold text-[#4b2415]">س</span><span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#2b160e] bg-[#d5b65d] text-xs font-bold text-[#4b2415]">ب</span></div><span>شراكات تبدأ من فهم التفاصيل</span></div></div><div className="relative flex min-h-[480px] items-center justify-center reveal delay-2"><div className="absolute h-[380px] w-[380px] rounded-full border border-[#f17a3d]/30 sm:h-[500px] sm:w-[500px]" /><div className="absolute h-[300px] w-[300px] rounded-full border border-white/10 sm:h-[400px] sm:w-[400px]" /><div className="absolute bottom-10 right-3 rounded-2xl border border-white/15 bg-white/10 p-4 text-right backdrop-blur-md sm:right-0"><div className="mb-1 text-xs text-white/60">تطبيقك، على بُعد نقرة</div><div className="flex items-center gap-2 text-sm font-bold"><span className="h-2 w-2 rounded-full bg-[#63d281]" /> متاح على مدار اليوم</div></div><PhoneMockup /></div></div></section>
      <section id="features" className="border-b border-[#e5d5c6] bg-[#fffaf4] py-12"><div className="mx-auto grid max-w-7xl grid-cols-2 gap-y-10 px-5 sm:grid-cols-4 lg:px-10">{visibleFeatures.map((item, index) => { const Icon = iconMap[item.icon] ?? Sparkles; return <div key={item.id} className={`reveal delay-${Math.min(index + 1, 3)} px-4 text-center ${index < 3 ? 'sm:border-l sm:border-[#eadbce]' : ''}`}><div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f5e6d7] text-[#c8602d]"><Icon size={21} /></div><h3 className="font-bold">{item.title}</h3><p className="mt-2 text-xs leading-6 text-[#8b7161]">{item.description}</p></div>; })}</div></section>
       <MarketingOrderCounterSection counter={site.data?.marketingOrderCounter} />
      <section id="process" className="bg-[#4b2415] py-24 text-white"><div className="mx-auto max-w-7xl px-5 lg:px-10"><div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr]"><div><SectionEyebrow light>كيف نعمل</SectionEyebrow><h2 className="display text-4xl font-extrabold leading-tight sm:text-5xl">{content.howTitle}<span className="mt-2 block text-[#f17a3d]">بخطوات واضحة.</span></h2><p className="mt-5 max-w-sm text-sm leading-8 text-[#d8bfb0]">نعتني بالتفاصيل التي لا تظهر في العرض، لكنها تصنع الفرق في الاستخدام اليومي.</p></div><div className="grid gap-4 sm:grid-cols-2">{[['01','نسمع فكرتك','نبدأ من هوية مطعمك، عملائك، وطريقة تشغيلك.'],['02','نبني التجربة','نحوّل رؤيتك إلى تطبيق جميل وسهل الاستخدام.'],['03','نطلق بثقة','نجهز كل شيء للنشر ونختبر التجربة معك.'],['04','نبقى قريبين','دعم وتحسينات مستمرة، لأن العمل لا ينتهي بالإطلاق.']].map(([num,title,desc], i) => <div key={num} className="group rounded-2xl border border-white/10 bg-white/[.04] p-6 transition hover:-translate-y-1 hover:bg-white/[.08]"><div className="mb-10 flex items-center justify-between"><span className="text-3xl font-bold text-[#f17a3d]/50">{num}</span><ArrowUpRight size={18} className="text-[#f17a3d] transition group-hover:translate-x-1 group-hover:-translate-y-1" /></div><h3 className="text-lg font-bold">{title}</h3><p className="mt-2 text-sm leading-7 text-[#d8bfb0]">{desc}</p></div>)}</div></div></div></section>
       <section id="work" className="bg-[#f4eadf] py-24"><div className="mx-auto max-w-7xl px-5 lg:px-10"><div className="flex flex-wrap items-end justify-between gap-6"><div><SectionEyebrow>أعمالنا</SectionEyebrow><h2 className="display text-4xl font-extrabold text-[#4b2415] sm:text-5xl">{content.workTitle}</h2></div><p className="max-w-sm text-sm leading-7 text-[#806554]">نصنع لكل مطعم مساحة رقمية تشبهه، لا نسخة أخرى من السوق.</p></div><div className="mt-12 flex gap-4 overflow-x-auto pb-3">{(logos.length ? logos : [{ id: 1, name: 'سفرة', logoPath: '', active: true, sortOrder: 1 }, { id: 2, name: 'مذاق', logoPath: '', active: true, sortOrder: 2 }, { id: 3, name: 'دار البن', logoPath: '', active: true, sortOrder: 3 }, { id: 4, name: 'وقت الحلى', logoPath: '', active: true, sortOrder: 4 }]).map((logo, i) => <div key={logo.id} className="group flex min-w-[190px] flex-1 flex-col justify-between rounded-3xl bg-[#fffaf4] p-5 shadow-[0_12px_30px_rgba(90,46,22,.06)] transition hover:-translate-y-1"><div className={`flex h-32 items-center justify-center rounded-2xl ${['bg-[#e9d4bf]','bg-[#dce1d3]','bg-[#e3d4de]','bg-[#f0d1b9]'][i % 4]}`}>{logo.logoPath ? <img src={assetUrl(logo.logoPath)} alt={logo.name} className="max-h-20 max-w-[70%] object-contain" /> : <span className="display text-2xl font-extrabold text-[#4b2415]">{logo.name}</span>}</div><div className="mt-5 flex items-center justify-between text-xs font-bold text-[#7f604e]"><span>{logo.name}</span><ArrowUpRight size={15} className="text-[#e86b32]" /></div></div>)}</div></div></section>
       {media.length > 0 && <section className="bg-[#fffaf4] py-20"><div className="mx-auto max-w-7xl px-5 lg:px-10"><div className="flex flex-wrap items-end justify-between gap-5"><div><SectionEyebrow>من أعمال چڤن</SectionEyebrow><h2 className="display text-4xl font-extrabold text-[#4b2415] sm:text-5xl">صور من التجربة</h2></div><p className="max-w-sm text-sm leading-7 text-[#806554]">مساحة مرنة لتحديث الصور والحملات من لوحة الإدارة.</p></div><div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{media.map(item => <figure key={item.id} className="overflow-hidden rounded-3xl border border-[#eaded4] bg-[#f6eadf]"><img src={assetUrl(item.mediaPath)} alt={item.altText || item.name} className="aspect-[4/3] w-full object-cover" /><figcaption className="p-4 text-sm font-bold">{item.name}</figcaption></figure>)}</div></div></section>}
      <section id="pricing" className="bg-[#fffaf4] py-24"><div className="mx-auto max-w-7xl px-5 lg:px-10"><div className="max-w-xl"><SectionEyebrow>الباقات</SectionEyebrow><h2 className="display text-4xl font-extrabold text-[#4b2415] sm:text-5xl">{content.pricingTitle}</h2><p className="mt-4 text-[#806554]">ابدأ بالحجم المناسب اليوم، ووسّع مع نموك غداً.</p></div><div className="mt-12 grid gap-5 lg:grid-cols-3">{(plans.length ? plans : [{ id: 1, name: 'البداية', price: 299, currency: 'ر.س', billingPeriod: 'شهرياً', description: 'للمطاعم التي تريد حضوراً رقمياً قوياً.', features: ['تطبيق يحمل هويتك','قائمة رقمية','دعم مستمر'], recommended: false }, { id: 2, name: 'الحضور', price: 599, currency: 'ر.س', billingPeriod: 'شهرياً', description: 'تجربة متكاملة لمطعم ينمو بسرعة.', features: ['كل مزايا البداية','إشعارات وعروض','تحليلات أساسية'], recommended: true }, { id: 3, name: 'مصمم لك', price: 0, currency: 'ر.س', billingPeriod: 'تواصل معنا', description: 'حل يتشكل حول فروعك وعملياتك.', features: ['تجربة مخصصة','تكاملات متقدمة','شريك نمو'], recommended: false }]).map(plan => <div key={plan.id} className={`relative rounded-3xl border p-7 ${plan.recommended ? 'border-[#e86b32] bg-[#4b2415] text-white shadow-[0_20px_50px_rgba(75,36,21,.18)]' : 'border-[#e3d2c2] bg-[#fffaf4]'}`}>{plan.recommended && <div className="absolute -top-3 right-6 rounded-full bg-[#e86b32] px-4 py-1 text-[10px] font-bold text-white">الأكثر طلباً</div>}<div className="flex items-start justify-between"><div><h3 className="text-xl font-bold">{plan.name}</h3><p className={`mt-2 text-sm ${plan.recommended ? 'text-[#d9bca9]' : 'text-[#896e5b]'}`}>{plan.description}</p></div><CircleDollarSign size={23} className="text-[#e86b32]" /></div><div className="my-8"><span className="display text-4xl font-extrabold">{plan.price ? plan.price.toLocaleString('ar-SA') : '—'}</span><span className={`mr-2 text-sm ${plan.recommended ? 'text-[#d9bca9]' : 'text-[#896e5b]'}`}>{plan.price ? `${plan.currency} / ${plan.billingPeriod}` : plan.billingPeriod}</span></div><div className={`space-y-3 border-t pt-6 text-sm ${plan.recommended ? 'border-white/15' : 'border-[#eadbd0]'}`}>{plan.features.map((feature, i) => <div key={i} className="flex items-center gap-3"><span className={`flex h-5 w-5 items-center justify-center rounded-full ${plan.recommended ? 'bg-[#e86b32]' : 'bg-[#f3e2d4] text-[#e86b32]'}`}><Check size={12} /></span>{feature}</div>)}</div><Button onClick={() => setDialog(true)} variant={plan.recommended ? 'primary' : 'outline'} className="mt-8 w-full">{plan.price ? 'اختر هذه الباقة' : 'صمّم باقتك'}<ArrowLeft size={15} /></Button></div>)}</div></div></section>
      <section className="relative overflow-hidden bg-[#f1dfce] py-24"><div className="absolute -left-28 top-0 h-80 w-80 rounded-full bg-[#e86b32]/10 blur-3xl" /><div className="relative mx-auto max-w-7xl px-5 lg:px-10"><div className="grid items-center gap-14 lg:grid-cols-[1.1fr_.9fr]"><div><SectionEyebrow>لماذا چڤن</SectionEyebrow><h2 className="display text-4xl font-extrabold leading-tight text-[#4b2415] sm:text-5xl">{content.whyTitle}<span className="mt-2 block text-[#c45b2a]">لأن التفاصيل هي المنتج.</span></h2></div><div className="grid gap-4 sm:grid-cols-2">{[['01','فهم السوق المحلي','نعرف إيقاع المطاعم السعودية وتوقعات عملائها.'],['02','فريق واحد معك','مصممون ومطورون يتحدثون معك بلغة العمل.'],['03','قرارات أذكى','نحوّل الملاحظات إلى تحسينات ملموسة.'],['04','جمال عملي','شكل جميل، لكنه قبل كل شيء سريع وواضح.']].map(([n,t,d]) => <div key={n} className="rounded-2xl bg-[#fffaf4]/70 p-5"><span className="text-xs font-bold text-[#e86b32]">{n}</span><h3 className="mt-5 font-bold text-[#4b2415]">{t}</h3><p className="mt-2 text-sm leading-7 text-[#806554]">{d}</p></div>)}</div></div></div></section>
       <section id="contact" className="bg-[#2b160e] py-24 text-white"><div className="mx-auto flex max-w-5xl flex-col items-center px-5 text-center"><div className="mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-[#e86b32]"><MessageCircle size={28} /></div><h2 className="display text-4xl font-extrabold sm:text-6xl">{content.finalCta}</h2><p className="mt-5 max-w-lg text-[#d5bcac]">شاركنا الفكرة، وسنخبرك كيف يمكن أن تصبح تجربة يومية يحبها عملاؤك.</p><Button onClick={() => setDialog(true)} className="mt-8" testId="button-final-enquiry">{content.finalCtaButton}<ArrowLeft size={16} /></Button></div></section>
    </main>
     <footer className="bg-[#21110a] px-5 py-7 text-white/70"><div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 sm:flex-row"><Brand dark small onSecretGesture={() => setAdminUnlockOpen(true)} /><div className="text-xs">حلول رقمية للمطاعم التي تريد أن تُرى وتُحَب.</div><div className="flex items-center gap-3"><a href={`mailto:${site.data?.contact.email ?? 'hello@jivn.sa'}`} className="rounded-full border border-white/10 p-2 hover:bg-white/10" aria-label="البريد الإلكتروني" data-testid="link-footer-email"><Mail size={15} /></a><a href={`https://wa.me/${site.data?.contact.whatsapp ?? ''}`} className="rounded-full border border-white/10 p-2 hover:bg-white/10" aria-label="واتساب" data-testid="link-footer-whatsapp"><MessageCircle size={15} /></a></div></div></footer>
     <EnquiryDialog open={dialog} onClose={() => setDialog(false)} plans={plans} />
     <AdminUnlockDialog open={adminUnlockOpen} onClose={() => setAdminUnlockOpen(false)} />
  </div>;
}

function MarketingOrderCounterSection({ counter }: { counter?: PublicMarketingOrderCounter }) {
  const sectionRef = useRef<HTMLElement>(null);
  const valueRef = useRef(0);
  const [entered, setEntered] = useState(false);
  const [displayValue, setDisplayValue] = useState(0);
  const fallbackValue = 12500;
  const target = counter?.displayedValue ?? fallbackValue;

  useEffect(() => {
    const element = sectionRef.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setEntered(true);
        observer.disconnect();
      }
    }, { threshold: 0.25 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!entered) return;
    const startValue = valueRef.current;
    const difference = target - startValue;
    if (difference === 0) return;
    const duration = Math.abs(difference) > 1000 ? 1800 : 900;
    let frame = 0;
    let startTime = 0;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min(1, (timestamp - startTime) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = Math.round(startValue + difference * eased);
      valueRef.current = next;
      setDisplayValue(next);
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [entered, target]);

  return <section ref={sectionRef} className="relative overflow-hidden bg-[#f4eadf] py-20 sm:py-24" aria-label="إحصائية تسويقية عن تطبيقات چڤن">
    <div className="absolute -left-28 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full bg-[#e86b32]/10 blur-3xl" />
    <div className="absolute -right-20 bottom-0 h-60 w-60 rounded-full bg-[#4b2415]/5 blur-3xl" />
    <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-5 lg:grid-cols-[.8fr_1.2fr] lg:px-10">
      <div className="text-center lg:text-right">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#e7cdb9] bg-[#fffaf4]/70 px-4 py-2 text-xs font-bold text-[#c45b2a]"><Gauge size={15} /> مؤشر إنجاز تسويقي</div>
        <h2 className="display text-4xl font-extrabold leading-tight text-[#4b2415] sm:text-5xl">🚀 أرقام تتحدث معك</h2>
        <p className="mx-auto mt-5 max-w-md text-sm leading-8 text-[#806554] lg:mx-0">أكثر من رقم؛ هي تجارب طلب ناجحة عبر تطبيقات طورتها چڤن لمطاعم تريد أن تكون أقرب لعملائها.</p>
      </div>
      <div className="relative overflow-hidden rounded-[2rem] border border-[#e3c8b2] bg-[#4b2415] p-7 text-white shadow-[0_25px_70px_rgba(75,36,21,.18)] sm:p-10">
        <div className="absolute -left-12 -top-12 h-40 w-40 rounded-full bg-[#f17a3d]/20 blur-2xl" />
        <div className="absolute bottom-0 right-0 h-28 w-28 rounded-full bg-[#e86b32]/15 blur-2xl" />
        <div className="relative flex flex-col items-center justify-center text-center">
          <div className="mb-4 flex items-center gap-2 text-sm text-[#e7c6b0]"><span className="h-2 w-2 animate-pulse rounded-full bg-[#f17a3d]" /> إنجاز يتزايد مع الوقت</div>
          <div className="display text-6xl font-extrabold tracking-tight text-[#f17a3d] sm:text-8xl" dir="ltr">+{displayValue.toLocaleString('en-US')}</div>
          <div className="mt-3 text-lg font-bold sm:text-xl">طلب تم تنفيذها عبر التطبيقات التي طورتها چڤن</div>
          <div className="mt-6 flex items-center gap-2 text-xs text-[#d6b8a5]"><span className="h-1.5 w-1.5 rounded-full bg-[#63d281]" /> رقم تسويقي تراكمي وليس إحصائية طلبات مباشرة</div>
        </div>
      </div>
    </div>
  </section>;
}

function ArrowDownIcon() { return <ChevronDown size={16} />; }

function AdminShell({ children, active, onSignOut, onNavigate }: { children: ReactNode; active: string; onSignOut: () => void; onNavigate: (tab: string) => void }) {
  const [mobile, setMobile] = useState(false);
  const items = [['overview','نظرة عامة',LayoutDashboard],['content','النصوص',Pencil],['counter','عداد الطلبات',Gauge],['notifications','الإشعارات',Megaphone],['media','الصور',ImageIcon],['plans','الباقات',CircleDollarSign],['restaurants','المطاعم',Store],['leads','الطلبات',ClipboardList],['settings','الإعدادات',Settings2]] as const;
  return <div className="min-h-screen bg-[#f8f2eb] text-[#4b2415]" dir="rtl"><aside className={`fixed inset-y-0 right-0 z-30 w-72 bg-[#2b160e] p-6 text-white transition-transform lg:translate-x-0 ${mobile ? 'translate-x-0' : 'translate-x-full'}`}><div className="mb-12 flex items-center justify-between"><Brand dark small /><button className="lg:hidden" onClick={() => setMobile(false)} aria-label="إغلاق القائمة"><X size={18} /></button></div><div className="mb-7 rounded-2xl border border-white/10 bg-white/5 p-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e86b32] font-bold">م</div><div><div className="text-sm font-bold">مدير چڤن</div><div className="text-xs text-white/50">مساحة الإدارة</div></div></div></div><nav className="space-y-1">{items.map(([id,label,Icon]) => <button type="button" key={id} onClick={() => { setMobile(false); onNavigate(id); }} className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-right text-sm transition ${active === id ? 'bg-[#e86b32] text-white' : 'text-white/60 hover:bg-white/10 hover:text-white'}`} data-testid={`link-admin-${id}`}><Icon size={18} />{label}</button>)}</nav><div className="absolute bottom-6 right-6 left-6 border-t border-white/10 pt-5"><button onClick={onSignOut} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-white/60 hover:bg-white/10 hover:text-white" data-testid="button-signout"><LogOut size={17} />تسجيل الخروج</button></div></aside>{mobile && <div onClick={() => setMobile(false)} className="fixed inset-0 z-20 bg-[#2b160e]/50 lg:hidden" />}<div className="lg:mr-72"><header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b border-[#e8dbcf] bg-[#f8f2eb]/90 px-5 backdrop-blur lg:px-10"><button onClick={() => setMobile(true)} className="rounded-xl border border-[#e0cec0] p-2 lg:hidden" aria-label="فتح القائمة" data-testid="button-admin-menu"><Menu size={19} /></button><div className="hidden text-sm text-[#8a6e5d] sm:block">الأحد، ١٤ يناير ٢٠٢٤</div><div className="flex items-center gap-3"><button className="relative rounded-xl border border-[#e0cec0] p-2 text-[#755b4a]" aria-label="الإشعارات" data-testid="button-notifications"><Bell size={18} /><span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-[#e86b32]" /></button><div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e9c7ae] text-sm font-bold text-[#6a371f]">م</div></div></header><main className="p-5 lg:p-10">{children}</main></div></div>;
}

function ArrowRightIcon() { return <ArrowLeft size={14} className="rotate-180" />; }

function LoadingCard() { return <div className="space-y-4 rounded-3xl border border-[#eaded4] bg-[#fffaf4] p-7"><div className="skeleton h-4 w-28 rounded" /><div className="skeleton h-10 w-48 rounded" /><div className="skeleton h-4 w-full rounded" /></div>; }
function AdminHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: ReactNode }) { return <div className="mb-8 flex flex-wrap items-end justify-between gap-5"><div><div className="mb-2 text-[10px] font-bold tracking-[.2em] text-[#c45a29]">{eyebrow}</div><h1 className="display text-3xl font-extrabold text-[#4b2415] sm:text-4xl">{title}</h1>{description && <p className="mt-2 text-sm text-[#876e5d]">{description}</p>}</div>{action}</div>; }

function OverviewTab({ goLeads }: { goLeads: () => void }) {
  const overview = useGetAdminOverview();
  const plans = useGetAdminPlans();
  const leads = useGetAdminLeads();
  if (overview.isLoading) return <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4"><LoadingCard /><LoadingCard /><LoadingCard /><LoadingCard /></div>;
  if (overview.isError) return <ErrorState retry={() => overview.refetch()} />;
  const stats = [{ title: 'كل الطلبات', value: overview.data?.total ?? 0, icon: ClipboardList, tone: 'bg-[#f5e2d3]' }, { title: 'طلبات جديدة', value: overview.data?.new ?? 0, icon: Bell, tone: 'bg-[#eee8ff]' }, { title: 'قيد المتابعة', value: overview.data?.inProgress ?? 0, icon: Zap, tone: 'bg-[#f5eacc]' }, { title: 'مكتملة', value: overview.data?.completed ?? 0, icon: Check, tone: 'bg-[#e1f1e4]' }];
  return <><AdminHeading eyebrow="لوحة القيادة" title="صباح الخير، فريق چڤن" description="هذه صورة سريعة عمّا يحدث في منصتك اليوم." action={<Button href="/" variant="outline" testId="link-view-site">عرض الموقع <ExternalLink size={15} /></Button>} /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{stats.map(stat => <div key={stat.title} className="rounded-3xl border border-[#eaded4] bg-[#fffaf4] p-5"><div className="flex items-start justify-between"><div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${stat.tone} text-[#8a4b2e]`}><stat.icon size={20} /></div><MoreHorizontal size={18} className="text-[#bca99c]" /></div><div className="mt-7 text-3xl font-extrabold">{stat.value}</div><div className="mt-1 text-sm text-[#876e5d]">{stat.title}</div></div>)}</div><div className="mt-6 grid gap-5 xl:grid-cols-[1.25fr_.75fr]"><div className="rounded-3xl border border-[#eaded4] bg-[#fffaf4] p-6"><div className="mb-6 flex items-center justify-between"><div><h2 className="text-lg font-bold">آخر الطلبات</h2><p className="mt-1 text-xs text-[#967b6a]">تابع أحدث فرص التعاون.</p></div><Button variant="quiet" onClick={goLeads} testId="button-view-all-leads">عرض الكل <ArrowLeft size={14} /></Button></div>{leads.isLoading ? <div className="space-y-3"><div className="skeleton h-14 rounded-xl" /><div className="skeleton h-14 rounded-xl" /></div> : (leads.data ?? []).slice(0, 4).map(lead => <LeadRow key={lead.id} lead={lead} compact />)}</div><div className="rounded-3xl bg-[#4b2415] p-7 text-white"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e86b32]"><Rocket size={20} /></div><h2 className="mt-7 text-xl font-bold">حافظ على الواجهة حية</h2><p className="mt-2 text-sm leading-7 text-[#d7bca9]">لديك {plans.data?.filter(p => p.active).length ?? 0} باقات ظاهرة للعملاء. راجع المحتوى قبل حملتك القادمة.</p><Button href="/admin?tab=content" variant="primary" className="mt-6" testId="link-review-content">مراجعة المحتوى <ArrowLeft size={14} /></Button></div></div></>;
}

function ErrorState({ retry }: { retry: () => void }) { return <div className="rounded-3xl border border-[#f0cbc1] bg-[#fff5f1] p-10 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f6d8d0] text-[#bb4d35]"><RefreshCw size={20} /></div><h2 className="mt-4 font-bold">تعذر تحميل البيانات</h2><p className="mt-2 text-sm text-[#926b5c]">تحقق من الاتصال وحاول مرة أخرى.</p><Button onClick={retry} variant="outline" className="mt-5" testId="button-retry">إعادة المحاولة</Button></div>; }
function LeadRow({ lead, compact = false }: { lead: Lead; compact?: boolean }) { return <div className="flex items-center justify-between gap-4 border-b border-[#f0e4da] py-3 last:border-0"><div className="min-w-0"><div className="truncate text-sm font-bold">{lead.restaurantName}</div><div className="mt-1 truncate text-xs text-[#927966]">{lead.customerName} · {lead.city}</div></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${statusTone[lead.status]}`}>{arStatus[lead.status]}</span>{!compact && <span className="hidden text-xs text-[#927966] sm:block">{new Date(lead.createdAt).toLocaleDateString('ar-SA')}</span>}</div>; }

function ContentTab() {
  const content = useGetAdminContent();
  const update = useUpdateAdminContent();
  const qc = useQueryClient();
  const [form, setForm] = useState<SiteContent | null>(null);
  const values = form ?? content.data ?? fallbackContent;
  const fields: [keyof SiteContent, string][] = [['heroTitle','عنوان الواجهة'],['heroDescription','وصف الواجهة'],['primaryCta','الزر الأساسي'],['secondaryCta','الزر الثانوي'],['featuresTitle','عنوان المزايا'],['howTitle','عنوان كيف نعمل'],['workTitle','عنوان أعمالنا'],['pricingTitle','عنوان الباقات'],['whyTitle','عنوان لماذا چڤن'],['finalCta','النداء الأخير'],['finalCtaButton','زر النداء الأخير']];
  const save = (e: FormEvent) => { e.preventDefault(); update.mutate({ data: values }, { onSuccess: next => { setForm(next); qc.invalidateQueries({ queryKey: getGetAdminContentQueryKey() }); qc.invalidateQueries({ queryKey: getGetPublicSiteQueryKey() }); } }); };
  if (content.isLoading) return <LoadingCard />;
  if (content.isError) return <ErrorState retry={() => content.refetch()} />;
  return <><AdminHeading eyebrow="المحتوى" title="صوت چڤن على الموقع" description="حرّر الكلمات التي يسمعها صاحب المطعم قبل أن يتواصل معك." /><form onSubmit={save} className="rounded-3xl border border-[#eaded4] bg-[#fffaf4] p-6 sm:p-8"><div className="grid gap-5 sm:grid-cols-2">{fields.map(([key,label]) => <label key={key} className={key === 'heroDescription' || key === 'featuresTitle' || key === 'howTitle' || key === 'workTitle' || key === 'pricingTitle' || key === 'whyTitle' || key === 'finalCta' ? 'sm:col-span-2' : ''}><span className="mb-2 block text-xs font-bold">{label}</span>{key === 'heroDescription' ? <textarea rows={4} value={values[key]} onChange={e => setForm({...values, [key]: e.target.value})} className="w-full resize-none rounded-xl border border-[#ddcabc] bg-white px-4 py-3 text-sm" /> : <input value={values[key]} onChange={e => setForm({...values, [key]: e.target.value})} className="w-full rounded-xl border border-[#ddcabc] bg-white px-4 py-3 text-sm" />}</label>)}</div><div className="mt-7 flex items-center justify-end border-t border-[#eee1d6] pt-6"><Button type="submit" disabled={update.isPending} testId="button-save-content">{update.isPending ? 'جارٍ الحفظ…' : 'حفظ التغييرات'}<Check size={16} /></Button></div></form></>;
}

function MarketingCounterTab() {
  const query = useGetAdminOrderCounter();
  const update = useUpdateAdminOrderCounter();
  const qc = useQueryClient();
  const [form, setForm] = useState({ currentValue: 12500, minDailyIncrease: 8, maxDailyIncrease: 24, enabled: true, resetDailyCycle: false });

  useEffect(() => {
    if (query.data) {
      setForm({
        currentValue: query.data.currentValue,
        minDailyIncrease: query.data.minDailyIncrease,
        maxDailyIncrease: query.data.maxDailyIncrease,
        enabled: query.data.enabled,
        resetDailyCycle: false,
      });
    }
  }, [query.data]);

  if (query.isLoading) return <><AdminHeading eyebrow="التسويق" title="عداد الطلبات" description="إدارة الرقم التسويقي الظاهر في الموقع." /><LoadingCard /></>;
  if (query.isError) return <><AdminHeading eyebrow="التسويق" title="عداد الطلبات" description="إدارة الرقم التسويقي الظاهر في الموقع." /><ErrorState retry={() => query.refetch()} /></>;

  const save = (resetDailyCycle = form.resetDailyCycle) => {
    if (form.minDailyIncrease > form.maxDailyIncrease) return;
    update.mutate({ data: { ...form, resetDailyCycle } }, {
      onSuccess: () => {
        setForm(current => ({ ...current, resetDailyCycle: false }));
        qc.invalidateQueries({ queryKey: getGetAdminOrderCounterQueryKey() });
        qc.invalidateQueries({ queryKey: getGetPublicSiteQueryKey() });
      },
    });
  };

  return <><AdminHeading eyebrow="التسويق" title="عداد الطلبات" description="رقم تراكمي تسويقي لعرض أثر تطبيقات چڤن، وليس إحصائية طلبات مباشرة أو لحظية." /><div className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]"><form onSubmit={event => { event.preventDefault(); save(); }} className="rounded-3xl border border-[#eaded4] bg-[#fffaf4] p-6 sm:p-8"><div className="mb-6 flex items-center justify-between gap-4"><div><h2 className="text-lg font-bold">إعدادات الظهور</h2><p className="mt-1 text-xs text-[#8a6e5d]">تُحفظ التغييرات وتظهر في الواجهة العامة بعد التحديث.</p></div><label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={form.enabled} onChange={event => setForm({ ...form, enabled: event.target.checked })} /> مفعّل</label></div><div className="grid gap-5 sm:grid-cols-2"><Field label="إجمالي الرقم الظاهر"><input type="number" min={0} value={form.currentValue} onChange={event => setForm({ ...form, currentValue: Math.max(0, Number(event.target.value)) })} /></Field><Field label="الحد الأدنى للزيادة اليومية"><input type="number" min={0} value={form.minDailyIncrease} onChange={event => setForm({ ...form, minDailyIncrease: Math.max(0, Number(event.target.value)) })} /></Field><Field label="الحد الأعلى للزيادة اليومية"><input type="number" min={0} value={form.maxDailyIncrease} onChange={event => setForm({ ...form, maxDailyIncrease: Math.max(0, Number(event.target.value)) })} /></Field></div>{form.minDailyIncrease > form.maxDailyIncrease && <div className="mt-4 rounded-xl bg-[#fff0ed] p-3 text-sm text-[#b34d3a]">يجب أن يكون الحد الأدنى أقل من أو يساوي الحد الأعلى.</div>}<label className="mt-6 flex items-start gap-3 rounded-2xl border border-[#eaded4] bg-white/60 p-4 text-sm"><input type="checkbox" checked={form.resetDailyCycle} onChange={event => setForm({ ...form, resetDailyCycle: event.target.checked })} /><span><strong className="block">إعادة بدء دورة الزيادة</strong><span className="mt-1 block text-xs leading-6 text-[#8a6e5d]">ابدأ توزيع الزيادة اليومية من الآن دون تغيير الإجمالي الأساسي.</span></span></label><div className="mt-7 flex flex-wrap justify-end gap-3 border-t border-[#eee1d6] pt-6"><Button type="button" variant="quiet" onClick={() => save(true)} disabled={update.isPending || form.minDailyIncrease > form.maxDailyIncrease}>إعادة ضبط الدورة</Button><Button type="submit" disabled={update.isPending || form.minDailyIncrease > form.maxDailyIncrease}>{update.isPending ? 'جارٍ الحفظ…' : 'حفظ التغييرات'}<Check size={16} /></Button></div></form><div className="relative overflow-hidden rounded-3xl bg-[#4b2415] p-7 text-white shadow-[0_20px_50px_rgba(75,36,21,.15)]"><div className="absolute -left-10 -top-10 h-36 w-36 rounded-full bg-[#f17a3d]/20 blur-2xl" /><div className="relative"><div className="flex items-center gap-2 text-sm text-[#e7c6b0]"><Gauge size={17} /> المعاينة الحالية</div><div className="mt-8 display text-6xl font-extrabold text-[#f17a3d]" dir="ltr">+{query.data?.displayedValue.toLocaleString('en-US')}</div><p className="mt-3 text-lg font-bold">طلب تم تنفيذها عبر تطبيقات چڤن</p><div className="mt-7 space-y-3 border-t border-white/10 pt-5 text-sm text-[#d6b8a5]"><div className="flex items-center justify-between"><span>الزيادة المختارة للدورة الحالية</span><strong className="text-white">+{query.data?.dailyIncrease}</strong></div><div className="flex items-center justify-between"><span>الحالة</span><strong className={query.data?.enabled ? 'text-[#82da92]' : 'text-[#f4b08c]'}>{query.data?.enabled ? 'يظهر ويتزايد تدريجياً' : 'متوقف'}</strong></div></div></div></div></div></>;
}

function NotificationsTab() {
  const query = useGetAdminNotifications();
  const qc = useQueryClient();
  const create = useCreateAdminNotification();
  const update = useUpdateAdminNotification();
  const remove = useDeleteAdminNotification();
  const [editing, setEditing] = useState<Notification | null>(null);
  const [open, setOpen] = useState(false);
  const blank = { title: '', message: '', linkText: '', linkUrl: '', active: true, sortOrder: (query.data?.length ?? 0) + 1 };
  const save = (data: typeof blank) => {
    const done = () => { setOpen(false); setEditing(null); qc.invalidateQueries({ queryKey: getGetAdminNotificationsQueryKey() }); qc.invalidateQueries({ queryKey: getGetPublicSiteQueryKey() }); };
    editing ? update.mutate({ id: editing.id, data }, { onSuccess: done }) : create.mutate({ data }, { onSuccess: done });
  };
  return <><AdminHeading eyebrow="المحتوى" title="الإشعارات والإعلانات" description="أضف شريطاً إعلانياً أو رسالة مؤقتة تظهر أعلى الموقع." action={<Button onClick={() => { setEditing(null); setOpen(true); }} testId="button-add-notification"><Plus size={16} /> إضافة إشعار</Button>} />{query.isLoading ? <LoadingCard /> : query.isError ? <ErrorState retry={() => query.refetch()} /> : <div className="grid gap-5 md:grid-cols-2">{(query.data ?? []).map(item => <div key={item.id} className="rounded-3xl border border-[#eaded4] bg-[#fffaf4] p-6"><div className="flex items-start justify-between gap-4"><div><div className="mb-2 flex items-center gap-2 text-xs text-[#c45a29]"><Megaphone size={14} /> إشعار #{item.sortOrder}</div><h2 className="font-bold">{item.title}</h2></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${item.active ? 'bg-[#e5f4e8] text-[#328049]' : 'bg-[#eee7e0] text-[#927a68]'}`}>{item.active ? 'ظاهر' : 'مخفي'}</span></div><p className="mt-4 text-sm leading-7 text-[#856b5a]">{item.message}</p>{item.linkText && <div className="mt-3 text-xs text-[#c45a29]">{item.linkText} · {item.linkUrl || 'بدون رابط'}</div>}<div className="mt-6 flex gap-2 border-t border-[#eee1d6] pt-4"><Button onClick={() => { setEditing(item); setOpen(true); }} variant="quiet" className="flex-1" testId={`button-edit-notification-${item.id}`}><Pencil size={14} /> تعديل</Button><Button onClick={() => window.confirm('هل تريد حذف هذا الإشعار؟') && remove.mutate({ id: item.id }, { onSuccess: () => { qc.invalidateQueries({ queryKey: getGetAdminNotificationsQueryKey() }); qc.invalidateQueries({ queryKey: getGetPublicSiteQueryKey() }); } })} variant="quiet" className="text-[#b64c36]" testId={`button-delete-notification-${item.id}`}><Trash2 size={14} /></Button></div></div>)}</div>}{open && <NotificationModal initial={editing ?? blank} onClose={() => setOpen(false)} onSave={save} saving={create.isPending || update.isPending} />}</>;
}

function NotificationModal({ initial, onClose, onSave, saving }: { initial: any; onClose: () => void; onSave: (data: any) => void; saving: boolean }) {
  const [form, setForm] = useState({ ...initial });
  const set = (key: string, value: string | boolean | number) => setForm((current: any) => ({ ...current, [key]: value }));
  return <Modal title={initial.id ? 'تعديل الإشعار' : 'إضافة إشعار'} onClose={onClose}><div className="space-y-4"><Field label="عنوان الإشعار"><input value={form.title} onChange={e => set('title', e.target.value)} /></Field><Field label="نص الإشعار"><textarea rows={3} value={form.message} onChange={e => set('message', e.target.value)} /></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="نص الرابط"><input value={form.linkText} onChange={e => set('linkText', e.target.value)} placeholder="مثال: ابدأ الآن" /></Field><Field label="الرابط"><input value={form.linkUrl} onChange={e => set('linkUrl', e.target.value)} placeholder="#contact أو https://..." /></Field><Field label="ترتيب الظهور"><input type="number" value={form.sortOrder} onChange={e => set('sortOrder', Number(e.target.value))} /></Field><label className="flex items-end gap-2 pb-3 text-sm"><input type="checkbox" checked={form.active} onChange={e => set('active', e.target.checked)} /> يظهر على الموقع</label></div></div><div className="mt-6 flex justify-end gap-3"><Button variant="quiet" onClick={onClose}>إلغاء</Button><Button onClick={() => onSave(form)} disabled={saving}>{saving ? 'جارٍ الحفظ…' : 'حفظ الإشعار'}</Button></div></Modal>;
}

function MediaTab() {
  const query = useGetAdminMedia();
  const qc = useQueryClient();
  const create = useCreateAdminMedia();
  const update = useUpdateAdminMedia();
  const remove = useDeleteAdminMedia();
  const upload = useRequestUploadUrl();
  const [editing, setEditing] = useState<SiteMedia | null>(null);
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ name: '', mediaPath: '', altText: '', placement: 'gallery', active: true, sortOrder: 1 });
  const edit = (item?: SiteMedia) => { setEditing(item ?? null); setForm(item ? { name: item.name, mediaPath: item.mediaPath, altText: item.altText, placement: item.placement, active: item.active, sortOrder: item.sortOrder } : { name: '', mediaPath: '', altText: '', placement: 'gallery', active: true, sortOrder: (query.data?.length ?? 0) + 1 }); setOpen(true); };
  const file = async (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (!selected) return;
    setUploading(true);
    try {
      const result = await new Promise<any>((resolve, reject) => upload.mutate({ data: { name: selected.name, size: selected.size, contentType: selected.type as any } }, { onSuccess: resolve, onError: reject }));
      await fetch(result.uploadURL, { method: 'PUT', headers: { 'Content-Type': selected.type }, body: selected });
      setForm(current => ({ ...current, mediaPath: result.objectPath }));
    } finally {
      setUploading(false);
    }
  };
  const save = () => {
    const done = () => { setOpen(false); setEditing(null); qc.invalidateQueries({ queryKey: getGetAdminMediaQueryKey() }); qc.invalidateQueries({ queryKey: getGetPublicSiteQueryKey() }); };
    editing ? update.mutate({ id: editing.id, data: form }, { onSuccess: done }) : create.mutate({ data: form }, { onSuccess: done });
  };
  return <><AdminHeading eyebrow="المحتوى المرئي" title="صور الموقع" description="ارفع صور الحملات والأعمال لتظهر في الموقع العام." action={<Button onClick={() => edit()} testId="button-add-media"><Plus size={16} /> إضافة صورة</Button>} />{query.isLoading ? <LoadingCard /> : query.isError ? <ErrorState retry={() => query.refetch()} /> : <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{(query.data ?? []).map(item => <div key={item.id} className="overflow-hidden rounded-3xl border border-[#eaded4] bg-[#fffaf4]"><div className="relative flex aspect-[4/3] items-center justify-center bg-[#f1e1d3]">{item.mediaPath && <img src={assetUrl(item.mediaPath)} alt={item.altText || item.name} className="h-full w-full object-cover" />}<span className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold ${item.active ? 'bg-[#e5f4e8] text-[#328049]' : 'bg-[#eee7e0] text-[#927a68]'}`}>{item.active ? 'ظاهرة' : 'مخفية'}</span></div><div className="p-4"><h3 className="font-bold">{item.name}</h3><p className="mt-1 text-xs text-[#927766]">{item.altText || 'بدون وصف للصورة'}</p><div className="mt-4 flex gap-2"><Button onClick={() => edit(item)} variant="quiet" className="flex-1" testId={`button-edit-media-${item.id}`}><Pencil size={14} /> تعديل</Button><Button onClick={() => window.confirm('هل تريد حذف هذه الصورة؟') && remove.mutate({ id: item.id }, { onSuccess: () => { qc.invalidateQueries({ queryKey: getGetAdminMediaQueryKey() }); qc.invalidateQueries({ queryKey: getGetPublicSiteQueryKey() }); } })} variant="quiet" className="text-[#b64c36]" testId={`button-delete-media-${item.id}`}><Trash2 size={14} /></Button></div></div></div>)}</div>}{open && <Modal title={editing ? 'تعديل صورة' : 'إضافة صورة'} onClose={() => setOpen(false)}><div className="space-y-4"><Field label="اسم الصورة"><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="مثال: حملة رمضان" /></Field><Field label="ملف الصورة"><div className="flex items-center gap-3"><label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-[#d9c3b2] px-4 py-3 text-sm text-[#7f6250]"><Upload size={16} />{uploading ? 'جارٍ الرفع…' : 'رفع صورة'}<input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={file} /></label>{form.mediaPath && <span className="max-w-[220px] truncate text-xs text-[#43834f]">تم رفع الصورة</span>}</div></Field><Field label="النص البديل"><input value={form.altText} onChange={e => setForm({ ...form, altText: e.target.value })} placeholder="وصف مختصر للصورة" /></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="مكان العرض"><select value={form.placement} onChange={e => setForm({ ...form, placement: e.target.value })}><option value="gallery">معرض الأعمال</option><option value="hero">الواجهة الرئيسية</option><option value="campaign">حملة إعلانية</option></select></Field><Field label="ترتيب الظهور"><input type="number" value={form.sortOrder} onChange={e => setForm({ ...form, sortOrder: Number(e.target.value) })} /></Field></div><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} /> تظهر على الموقع</label><div className="flex justify-end gap-3 pt-3"><Button variant="quiet" onClick={() => setOpen(false)}>إلغاء</Button><Button onClick={save} disabled={uploading || !form.mediaPath || create.isPending || update.isPending}>{create.isPending || update.isPending ? 'جارٍ الحفظ…' : 'حفظ الصورة'}</Button></div></div></Modal>}</>;
}

function PlansTab() {
  const query = useGetAdminPlans(); const qc = useQueryClient(); const create = useCreateAdminPlan(); const update = useUpdateAdminPlan(); const remove = useDeleteAdminPlan();
  const [editing, setEditing] = useState<PricingPlan | null>(null); const [open, setOpen] = useState(false);
  const blank = { name: '', price: 0, currency: 'ر.س', billingPeriod: 'شهرياً', description: '', features: [''], recommended: false, active: true, sortOrder: 1 };
  const save = (data: any) => { const payload = { ...data, price: Number(data.price), sortOrder: Number(data.sortOrder), features: data.features.filter(Boolean) }; const done = () => { setOpen(false); setEditing(null); qc.invalidateQueries({ queryKey: getGetAdminPlansQueryKey() }); qc.invalidateQueries({ queryKey: getGetPublicPricingQueryKey() }); }; editing ? update.mutate({ id: editing.id, data: payload }, { onSuccess: done }) : create.mutate({ data: payload }, { onSuccess: done }); };
  return <><AdminHeading eyebrow="التسعير" title="الباقات والخدمات" description="اجعل قيمة التعاون واضحة، وحافظ على مرونة خياراتك." action={<Button onClick={() => { setEditing(null); setOpen(true); }} testId="button-add-plan"><Plus size={16} /> إضافة باقة</Button>} />{query.isLoading ? <div className="grid gap-5 md:grid-cols-3"><LoadingCard /><LoadingCard /><LoadingCard /></div> : query.isError ? <ErrorState retry={() => query.refetch()} /> : <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{(query.data ?? []).map(plan => <div key={plan.id} className="rounded-3xl border border-[#eaded4] bg-[#fffaf4] p-6"><div className="flex items-start justify-between"><div><h2 className="font-bold">{plan.name}</h2><div className="mt-2 text-2xl font-extrabold">{plan.price.toLocaleString('ar-SA')} <span className="text-xs font-medium text-[#967b6a]">{plan.currency}</span></div></div><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${plan.active ? 'bg-[#e5f4e8] text-[#328049]' : 'bg-[#eee7e0] text-[#927a68]'}`}>{plan.active ? 'نشطة' : 'مخفية'}</span></div><p className="mt-4 text-sm leading-7 text-[#856b5a]">{plan.description}</p><div className="mt-4 space-y-2 text-xs text-[#604a3b]">{plan.features.map((f, i) => <div key={i} className="flex items-center gap-2"><Check size={13} className="text-[#e86b32]" />{f}</div>)}</div><div className="mt-6 flex gap-2 border-t border-[#eee1d6] pt-4"><Button onClick={() => { setEditing(plan); setOpen(true); }} variant="quiet" className="flex-1" testId={`button-edit-plan-${plan.id}`}><Pencil size={14} /> تعديل</Button><Button onClick={() => window.confirm('هل تريد حذف هذه الباقة؟') && remove.mutate({ id: plan.id }, { onSuccess: () => qc.invalidateQueries({ queryKey: getGetAdminPlansQueryKey() }) })} variant="quiet" className="text-[#b64c36] hover:bg-[#fff0ed]" testId={`button-delete-plan-${plan.id}`}><Trash2 size={15} /></Button></div></div>)}</div>}{open && <PlanModal initial={editing ?? blank} onClose={() => setOpen(false)} onSave={save} saving={create.isPending || update.isPending} />}</>;
}

function PlanModal({ initial, onClose, onSave, saving }: { initial: any; onClose: () => void; onSave: (data: any) => void; saving: boolean }) {
  const [form, setForm] = useState({...initial, features: initial.features.length ? initial.features : ['']}); const set = (key: string, value: any) => setForm({...form, [key]: value});
  return <Modal title={initial.id ? 'تعديل الباقة' : 'إضافة باقة'} onClose={onClose}><div className="grid gap-4 sm:grid-cols-2"><Field label="اسم الباقة"><input value={form.name} onChange={e => set('name', e.target.value)} /></Field><Field label="السعر"><input type="number" value={form.price} onChange={e => set('price', e.target.value)} /></Field><Field label="العملة"><input value={form.currency} onChange={e => set('currency', e.target.value)} /></Field><Field label="الفترة"><input value={form.billingPeriod} onChange={e => set('billingPeriod', e.target.value)} /></Field><Field label="الوصف" wide><textarea rows={2} value={form.description} onChange={e => set('description', e.target.value)} /></Field><Field label="المزايا، كل ميزة في سطر" wide><textarea rows={4} value={form.features.join('\n')} onChange={e => set('features', e.target.value.split('\n'))} /></Field><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.recommended} onChange={e => set('recommended', e.target.checked)} /> باقة موصى بها</label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.active} onChange={e => set('active', e.target.checked)} /> تظهر على الموقع</label></div><div className="mt-6 flex justify-end gap-3"><Button variant="quiet" onClick={onClose}>إلغاء</Button><Button testId="button-save-plan" onClick={() => onSave(form)} disabled={saving}>{saving ? 'جارٍ الحفظ…' : 'حفظ الباقة'}</Button></div></Modal>;
}

function Field({ label, children, wide = false }: { label: string; children: ReactNode; wide?: boolean }) { return <label className={wide ? 'sm:col-span-2' : ''}><span className="mb-2 block text-xs font-bold">{label}</span>{children}</label>; }
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) { return <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#2a150d]/55 p-4 backdrop-blur-sm"><div className="max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-[26px] bg-[#fffaf4] p-6 sm:p-8" dir="rtl"><div className="mb-6 flex items-center justify-between"><h2 className="text-xl font-bold">{title}</h2><button onClick={onClose} aria-label="إغلاق" className="rounded-full p-2 hover:bg-[#f2e3d6]"><X size={18} /></button></div>{children}</div></div>; }

function RestaurantsTab() {
  const query = useGetAdminRestaurants(); const qc = useQueryClient(); const create = useCreateAdminRestaurant(); const update = useUpdateAdminRestaurant(); const remove = useDeleteAdminRestaurant(); const upload = useRequestUploadUrl();
  const [editing, setEditing] = useState<RestaurantLogo | null>(null); const [open, setOpen] = useState(false); const [form, setForm] = useState({ name: '', logoPath: '', active: true, sortOrder: 1 }); const [uploading, setUploading] = useState(false);
  const edit = (item?: RestaurantLogo) => { setEditing(item ?? null); setForm(item ? { name: item.name, logoPath: item.logoPath, active: item.active, sortOrder: item.sortOrder } : { name: '', logoPath: '', active: true, sortOrder: (query.data?.length ?? 0) + 1 }); setOpen(true); };
  const file = async (event: ChangeEvent<HTMLInputElement>) => { const selected = event.target.files?.[0]; if (!selected) return; setUploading(true); try { const result = await new Promise<any>((resolve, reject) => upload.mutate({ data: { name: selected.name, size: selected.size, contentType: selected.type as any } }, { onSuccess: resolve, onError: reject })); await fetch(result.uploadURL, { method: 'PUT', headers: { 'Content-Type': selected.type }, body: selected }); setForm(prev => ({...prev, logoPath: result.objectPath})); } catch { } finally { setUploading(false); } };
  const save = () => { const done = () => { setOpen(false); qc.invalidateQueries({ queryKey: getGetAdminRestaurantsQueryKey() }); qc.invalidateQueries({ queryKey: getGetPublicRestaurantsQueryKey() }); }; editing ? update.mutate({ id: editing.id, data: form }, { onSuccess: done }) : create.mutate({ data: form }, { onSuccess: done }); };
   return <><AdminHeading eyebrow="الهوية" title="المطاعم والشعارات" description="ارفع شعار الشريك هنا، وسيظهر بدل النص داخل كرت المطعم في الموقع." action={<Button onClick={() => edit()} testId="button-add-restaurant"><Plus size={16} /> إضافة مطعم</Button>} />{query.isLoading ? <LoadingCard /> : query.isError ? <ErrorState retry={() => query.refetch()} /> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{(query.data ?? []).map(item => <div key={item.id} className="overflow-hidden rounded-3xl border border-[#eaded4] bg-[#fffaf4]"><div className="flex h-36 items-center justify-center bg-[#f1e1d3]">{item.logoPath ? <img src={assetUrl(item.logoPath)} alt={item.name} className="max-h-24 max-w-[70%] object-contain" /> : <span className="text-xl font-bold text-[#6e4027]">{item.name}</span>}</div><div className="p-4"><div className="flex items-center justify-between"><h3 className="font-bold">{item.name}</h3><span className={`h-2 w-2 rounded-full ${item.active ? 'bg-[#49a965]' : 'bg-[#b7a69b]'}`} /></div><div className="mt-4 flex gap-2"><Button onClick={() => edit(item)} variant="quiet" className="flex-1" testId={`button-edit-restaurant-${item.id}`}><Pencil size={14} /> تعديل</Button><Button onClick={() => window.confirm('هل تريد حذف هذا المطعم؟') && remove.mutate({ id: item.id }, { onSuccess: () => qc.invalidateQueries({ queryKey: getGetAdminRestaurantsQueryKey() }) })} variant="quiet" className="text-[#b64c36]" testId={`button-delete-restaurant-${item.id}`}><Trash2 size={14} /></Button></div></div></div>)}</div>}{open && <Modal title={editing ? 'تعديل مطعم' : 'إضافة مطعم'} onClose={() => setOpen(false)}><div className="space-y-4"><Field label="اسم المطعم"><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></Field><Field label="شعار المطعم"><div className="flex flex-wrap items-center gap-3"><label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-[#d9c3b2] px-4 py-3 text-sm text-[#7f6250]"><Upload size={16} />{uploading ? 'جارٍ الرفع…' : 'رفع ملف'}<input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={file} /></label>{form.logoPath && <div className="flex items-center gap-2 rounded-xl bg-[#f3e8de] px-3 py-2"><img src={assetUrl(form.logoPath)} alt="معاينة الشعار" className="h-10 w-10 object-contain" /><span className="text-xs text-[#43834f]">تم رفع الشعار</span></div>}</div></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="ترتيب الظهور"><input type="number" value={form.sortOrder} onChange={e => setForm({...form, sortOrder: Number(e.target.value)})} /></Field><label className="flex items-end gap-2 pb-3 text-sm"><input type="checkbox" checked={form.active} onChange={e => setForm({...form, active: e.target.checked})} /> يظهر على الموقع</label></div><div className="flex justify-end gap-3 pt-3"><Button variant="quiet" onClick={() => setOpen(false)}>إلغاء</Button><Button testId="button-save-restaurant" onClick={save} disabled={uploading || create.isPending || update.isPending}>{create.isPending || update.isPending ? 'جارٍ الحفظ…' : 'حفظ المطعم'}</Button></div></div></Modal>}</>;
}

function normalizeWhatsAppNumber(value: string) {
  const cleaned = value.trim().replace(/[^\d+]/g, '');
  if (cleaned.startsWith('00')) return cleaned.slice(2);
  if (cleaned.startsWith('+')) return cleaned.slice(1);
  if (cleaned.startsWith('0')) return `966${cleaned.slice(1)}`;
  return cleaned;
}

function LeadDetailModal({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const [message, setMessage] = useState('');
  useEffect(() => {
    setMessage(`مرحباً ${lead.customerName}، معك فريق چڤن. شكرًا لتواصلكم معنا بخصوص ${lead.restaurantName}. وصلنا طلبكم وسنتواصل معكم قريبًا.`);
  }, [lead]);
  const whatsappNumber = normalizeWhatsAppNumber(lead.whatsapp || lead.phone);
  const whatsappUrl = whatsappNumber ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}` : '';
  return <Modal title="تفاصيل طلب التواصل" onClose={onClose}>
    <div className="space-y-5">
      <div className="rounded-2xl bg-[#f8eee5] p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="text-xs text-[#967b6a]">العميل</div><h3 className="mt-1 text-xl font-bold text-[#4b2415]">{lead.customerName}</h3><p className="mt-1 text-sm text-[#856b5a]">{lead.restaurantName} · {lead.city}</p></div><span className={`rounded-full px-3 py-1.5 text-xs font-bold ${statusTone[lead.status]}`}>{arStatus[lead.status]}</span></div></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><div className="text-xs text-[#967b6a]">رقم الجوال</div><a href={`tel:${lead.phone}`} className="mt-1 block font-bold text-[#c45a29] hover:underline" dir="ltr">{lead.phone}</a></div>
        <div><div className="text-xs text-[#967b6a]">رقم الواتساب</div><a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noreferrer" className="mt-1 block font-bold text-[#328049] hover:underline" dir="ltr">{lead.whatsapp || 'غير مضاف'}</a></div>
        <div><div className="text-xs text-[#967b6a]">البريد الإلكتروني</div><div className="mt-1 break-all font-bold">{lead.email || 'غير مضاف'}</div></div>
        <div><div className="text-xs text-[#967b6a]">نوع النشاط وعدد الفروع</div><div className="mt-1 font-bold">{lead.businessType} · {lead.branches} {lead.branches === 1 ? 'فرع' : 'فروع'}</div></div>
        <div><div className="text-xs text-[#967b6a]">الباقة المطلوبة</div><div className="mt-1 font-bold">{lead.packageName}</div></div>
        <div><div className="text-xs text-[#967b6a]">تاريخ الطلب</div><div className="mt-1 font-bold">{new Date(lead.createdAt).toLocaleString('ar-SA')}</div></div>
      </div>
      <div className="rounded-2xl border border-[#eaded4] bg-[#fffaf4] p-4"><div className="text-xs font-bold text-[#967b6a]">ملاحظات العميل</div><p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[#604a3b]">{lead.notes || 'لا توجد ملاحظات إضافية.'}</p></div>
      <div><label className="mb-2 block text-xs font-bold text-[#604333]">رسالة ترحيبية عبر واتساب</label><textarea value={message} onChange={event => setMessage(event.target.value)} rows={4} className="w-full resize-none rounded-xl border border-[#ddcabc] bg-white px-4 py-3 text-sm leading-7 outline-none focus:border-[#e86b32] focus:ring-2 focus:ring-[#e86b32]/15" /></div>
      {!whatsappNumber && <div className="rounded-xl bg-[#fff0ed] p-3 text-sm text-[#b34d3a]">لا يوجد رقم صالح لفتح الواتساب لهذا الطلب.</div>}
      <div className="flex flex-wrap justify-end gap-3 border-t border-[#eee1d6] pt-5"><Button variant="quiet" onClick={onClose}>إغلاق</Button>{whatsappNumber && <a href={whatsappUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#2e9b52] px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#258746]" data-testid={`button-whatsapp-lead-${lead.id}`}><MessageCircle size={16} /> فتح واتساب بالرسالة</a>}</div>
    </div>
  </Modal>;
}

function LeadsTab() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<LeadStatus | undefined>();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const query = useGetAdminLeads({ search: search || undefined, status });
  const update = useUpdateAdminLead();
  const remove = useDeleteAdminLead();
  const qc = useQueryClient();
  const refresh = () => {
    qc.invalidateQueries({ queryKey: getGetAdminLeadsQueryKey({ search: search || undefined, status }) });
    qc.invalidateQueries({ queryKey: getGetAdminOverviewQueryKey() });
  };
  return <><AdminHeading eyebrow="العلاقات" title="طلبات التواصل" description="اضغط على أي طلب لعرض التفاصيل والرد على العميل." action={<Button variant="outline" onClick={() => query.refetch()} testId="button-refresh-leads"><RefreshCw size={15} /> تحديث</Button>} /><div className="mb-5 flex flex-wrap gap-3"><div className="relative min-w-[230px] flex-1"><Search size={16} className="absolute right-3 top-3.5 text-[#a58e80]" /><input data-testid="input-search-leads" value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث باسم المطعم أو العميل" className="w-full rounded-xl border border-[#ddcabc] bg-[#fffaf4] py-3 pr-10 pl-4 text-sm" /></div><select data-testid="select-lead-status" value={status ?? ''} onChange={e => setStatus((e.target.value || undefined) as LeadStatus | undefined)} className="rounded-xl border border-[#ddcabc] bg-[#fffaf4] px-4 py-3 text-sm"><option value="">كل الحالات</option>{Object.entries(arStatus).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></div>{query.isLoading ? <LoadingCard /> : query.isError ? <ErrorState retry={() => query.refetch()} /> : <div className="overflow-x-auto rounded-3xl border border-[#eaded4] bg-[#fffaf4]"><table className="w-full min-w-[760px] text-right text-sm"><thead className="border-b border-[#eaded4] bg-[#fbf5ef] text-xs text-[#866d5d]"><tr><th className="px-5 py-4 font-bold">المطعم / العميل</th><th className="px-5 py-4 font-bold">التواصل</th><th className="px-5 py-4 font-bold">الباقة</th><th className="px-5 py-4 font-bold">الحالة</th><th className="px-5 py-4 font-bold">إجراء</th></tr></thead><tbody>{(query.data ?? []).map(lead => <tr key={lead.id} onClick={() => setSelectedLead(lead)} className="cursor-pointer border-b border-[#f0e5db] transition hover:bg-[#fff8f1] last:border-0" title="اضغط لعرض التفاصيل"><td className="px-5 py-4"><div className="font-bold">{lead.restaurantName}</div><div className="mt-1 text-xs text-[#947968]">{lead.customerName} · {lead.city}</div></td><td className="px-5 py-4"><div className="text-xs">{lead.phone}</div><div className="mt-1 text-xs text-[#947968]">{lead.email || '—'}</div></td><td className="px-5 py-4 text-xs">{lead.packageName}</td><td className="px-5 py-4"><select value={lead.status} onClick={event => event.stopPropagation()} onChange={e => update.mutate({ id: lead.id, data: { status: e.target.value as LeadStatus } }, { onSuccess: refresh })} className={`rounded-full border-0 px-3 py-1.5 text-[11px] font-bold outline-none ${statusTone[lead.status]}`} data-testid={`select-status-${lead.id}`}>{Object.entries(arStatus).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></td><td className="px-5 py-4"><button onClick={event => { event.stopPropagation(); if (window.confirm('هل تريد حذف هذا الطلب؟')) remove.mutate({ id: lead.id }, { onSuccess: refresh }); }} className="rounded-lg p-2 text-[#ad5a46] hover:bg-[#fff0ed]" aria-label="حذف الطلب" data-testid={`button-delete-lead-${lead.id}`}><Trash2 size={16} /></button></td></tr>)}</tbody></table>{!(query.data ?? []).length && <div className="p-14 text-center text-sm text-[#927766]"><ClipboardList className="mx-auto mb-3 text-[#c9afa0]" size={28} /><p>لا توجد طلبات مطابقة بعد.</p></div>}</div>}{selectedLead && <LeadDetailModal lead={selectedLead} onClose={() => setSelectedLead(null)} />}</>;
}

function SettingsTab() {
  const contact = useGetAdminContact();
  const update = useUpdateAdminContact();
  const qc = useQueryClient();
  const [form, setForm] = useState<ContactSettings | null>(null);
  const values = form ?? contact.data;
  if (contact.isLoading || !values) return <LoadingCard />;
  const save = (event: FormEvent) => {
    event.preventDefault();
    if (!form) return;
    update.mutate({ data: form }, { onSuccess: (next) => { setForm(next); qc.invalidateQueries({ queryKey: getGetAdminContactQueryKey() }); qc.invalidateQueries({ queryKey: getGetPublicSiteQueryKey() }); } });
  };
  return <><AdminHeading eyebrow="الإعدادات" title="قنوات التواصل" description="حدّث البيانات الظاهرة لزوار الموقع مباشرة." /><div className="grid gap-5 md:grid-cols-[1.1fr_.9fr]"><form onSubmit={save} className="rounded-3xl border border-[#eaded4] bg-[#fffaf4] p-7"><h2 className="font-bold">قنوات چڤن</h2><p className="mt-2 text-sm text-[#8d7463]">كل تعديل يظهر فوراً في أزرار التواصل والفوتر.</p><div className="mt-6 space-y-4">{([['whatsapp','واتساب'],['email','البريد الإلكتروني'],['instagram','إنستغرام'],['twitter','تويتر'],['tiktok','تيك توك']] as const).map(([key, label]) => <label key={key} className="block"><span className="mb-2 block text-xs font-bold">{label}</span><input type={key === 'email' ? 'email' : 'text'} value={values[key]} onChange={event => setForm({ ...values, [key]: event.target.value })} className="w-full rounded-xl border border-[#ddcabc] bg-white px-4 py-3 text-sm" /></label>)}</div><Button type="submit" testId="button-save-contact" className="mt-6 w-full" disabled={update.isPending}>{update.isPending ? 'جارٍ الحفظ…' : 'حفظ إعدادات التواصل'}<Check size={16} /></Button></form><div className="rounded-3xl bg-[#4b2415] p-7 text-white"><ShieldCheck className="text-[#f18a52]" size={27} /><h2 className="mt-7 text-xl font-bold">حماية مساحة الإدارة</h2><p className="mt-3 text-sm leading-7 text-[#d9c0af]">لا تشارك بيانات الدخول. سجّل الخروج دائماً عند استخدام جهاز مشترك.</p><div className="mt-8 flex items-center gap-3 text-xs text-white/60"><span className="h-2 w-2 rounded-full bg-[#63d281]" /> جلسة الإدارة محمية</div></div></div></>;
}

function AdminPage() {
  const [location, setLocation] = useLocation();
  const search = useSearch();
  const { isLoaded, isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const [accessChecked, setAccessChecked] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const params = new URLSearchParams(search);
  const e2eQuery = params.get('e2e-auth') === '1';
  if (import.meta.env.DEV && e2eQuery) window.sessionStorage.setItem('jivn-e2e-auth', '1');
  const e2eAuth = import.meta.env.DEV && (e2eQuery || window.sessionStorage.getItem('jivn-e2e-auth') === '1');
  const active = params.get('tab') ?? 'overview';
  useEffect(() => {
    if (e2eAuth) {
      setUnlocked(true);
      setAccessChecked(true);
      return;
    }
    if (!isLoaded) return;
    let activeRequest = true;
    setAccessChecked(false);
    fetch(`${basePath}/api/admin/access`, { credentials: 'include' })
      .then(response => response.ok ? response.json() : { unlocked: false })
      .then(result => {
        if (activeRequest) {
          setUnlocked(Boolean(result.unlocked));
          setAccessChecked(true);
        }
      })
      .catch(() => {
        if (activeRequest) {
          setUnlocked(false);
          setAccessChecked(true);
        }
      });
    return () => { activeRequest = false; };
  }, [e2eAuth, isLoaded]);
  if (!e2eAuth && (!isLoaded || !accessChecked)) return <div className="flex min-h-screen items-center justify-center bg-[#2b160e] text-white">جارٍ التحقق…</div>;
  if (!e2eAuth && !unlocked) return isSignedIn ? <Redirect to={basePath || '/'} /> : <Redirect to="/sign-in" />;
  const tabs: Record<string, ReactNode> = { overview: <OverviewTab goLeads={() => setLocation('/admin?tab=leads')} />, content: <ContentTab />, counter: <MarketingCounterTab />, notifications: <NotificationsTab />, media: <MediaTab />, plans: <PlansTab />, restaurants: <RestaurantsTab />, leads: <LeadsTab />, settings: <SettingsTab /> };
  return <AdminShell active={active} onNavigate={(tab) => setLocation(`/admin${tab === 'overview' ? '' : `?tab=${tab}`}`)} onSignOut={() => {
    if (e2eAuth) return;
    void (async () => {
      await fetch(`${basePath}/api/admin/unlock`, { method: 'DELETE', credentials: 'include' });
      if (isSignedIn) await signOut({ redirectUrl: basePath || '/' });
      else setLocation(basePath || '/');
    })();
  }}>{tabs[active] ?? tabs.overview}</AdminShell>;
}

function AuthPage({ signUp = false }: { signUp?: boolean }) {
  return <div className="flex min-h-screen bg-[#2b160e]" dir="rtl"><div className="hidden flex-1 items-center justify-center overflow-hidden bg-[#4b2415] p-16 text-white lg:flex"><div className="max-w-lg"><Brand dark /><SectionEyebrow light>مساحة خاصة</SectionEyebrow><h1 className="display mt-8 text-6xl font-extrabold leading-tight">{signUp ? 'ابنِ حضوراً لا يُنسى.' : 'أهلاً بك في مساحة چڤن.'}</h1><p className="mt-6 text-lg leading-9 text-[#dbc1b1]">كل ما تحتاجه لتقديم تجربة رقمية تليق بمطعمك، في مكان واحد.</p></div></div><div className="flex flex-1 items-center justify-center bg-[#fffaf4] p-5 sm:p-12"><div className="w-full max-w-md"><div className="mb-8 flex justify-between"><Brand /><Link href="/" className="flex items-center gap-1 text-xs text-[#886c5b]">العودة للموقع <ArrowLeft size={13} /></Link></div>{signUp ? <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} appearance={clerkAppearance} /> : <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} appearance={clerkAppearance} />}</div></div></div>;
}

const clerkAppearance = {
  variables: {
    colorPrimary: '#e86b32',
    colorForeground: '#4b2415',
    colorMutedForeground: '#876e5d',
    colorBackground: '#fffaf4',
    colorInput: '#ffffff',
    colorInputForeground: '#4b2415',
    colorNeutral: '#ddcabc',
    fontFamily: 'IBM Plex Sans Arabic',
    borderRadius: '0.75rem',
  },
  elements: {
    cardBox: 'bg-[#fffaf4] shadow-none w-full',
    card: '!shadow-none !bg-transparent',
    footer: '!bg-transparent',
    headerTitle: 'text-[#4b2415]',
    headerSubtitle: 'text-[#876e5d]',
    formFieldLabel: 'text-[#604333]',
    formFieldInput: 'border-[#ddcabc] rounded-xl',
    formButtonPrimary: 'bg-[#e86b32] hover:bg-[#d95c26]',
  },
};

function Router() {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}><Switch><Route path="/" component={PublicSite} /><Route path="/admin" component={AdminPage} /><Route path="/sign-in/*?" component={() => <AuthPage />} /><Route path="/sign-up/*?" component={() => <AuthPage signUp />} /><Route component={NotFound} /></Switch></ErrorBoundary>;
}

function App() {
  return <ClerkProvider publishableKey={clerkPubKey} proxyUrl={clerkProxyUrl} appearance={clerkAppearance} signInUrl={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`}><QueryClientProvider client={queryClient}><WouterRouter base={basePath}><Router /></WouterRouter></QueryClientProvider></ClerkProvider>;
}

export default App;
