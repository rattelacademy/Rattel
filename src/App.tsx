import { brandNameAr, brandNameEn } from './brand/brand';
import { Logo } from './components/brand';
import { ActionAlert, Badge, Button, Card, TextField } from './components/ui';
import './components/ui/components.css';
import './styles/global.css';
import './app.css';

const palette = [
  ['الأخضر الزمردي', 'var(--color-primary)'],
  ['الأخضر العميق', 'var(--color-deep-green)'],
  ['العاجي الدافئ', 'var(--color-ivory)'],
  ['الذهبي الهادئ', 'var(--color-gold)'],
  ['الفحمي', 'var(--color-charcoal)'],
] as const;

export function App() {
  return (
    <main className="library-shell">
      <header className="library-header">
        <Logo />
        <div>
          <h1>{brandNameAr} <span className="library-divider">|</span> {brandNameEn}</h1>
          <p>أساسات الهوية ومكتبة المكونات</p>
        </div>
        <Badge tone="success">أساس المرحلة الأولى</Badge>
      </header>

      <section className="library-intro">
        <p className="eyebrow">لوحة النظام البصري</p>
        <h2>مكونات واضحة بهوية هادئة</h2>
        <p>الخط العربي Cairo، والخط اللاتيني Montserrat، مع اتجاه RTL أساسي ومسافات مبنية على شبكة 4px.</p>
      </section>

      <section className="library-section" aria-labelledby="palette-title">
        <h2 id="palette-title">الألوان الأساسية</h2>
        <div className="palette-grid">
          {palette.map(([name, color]) => <Card className="palette-swatch" key={name}>
            <span className="palette-swatch__color" style={{ backgroundColor: color }} />
            <strong>{name}</strong>
            <code>{color}</code>
          </Card>)}
        </div>
      </section>

      <section className="library-grid" aria-label="أمثلة المكونات">
        <Card className="library-panel">
          <h2>الأزرار والحالات</h2>
          <div className="component-row">
            <Button>إجراء أساسي</Button>
            <Button variant="secondary">إجراء ثانوي</Button>
            <Button variant="gold">تمييز ذهبي</Button>
            <Button variant="danger">إجراء خطر</Button>
          </div>
          <div className="component-row">
            <Badge tone="success">نشط</Badge>
            <Badge tone="warning">بانتظار المراجعة</Badge>
            <Badge tone="danger">عاجل</Badge>
            <Badge tone="gold">إنجاز</Badge>
          </div>
          <TextField label="البريد الإلكتروني" type="email" placeholder="name@example.com" hint="حقل نصي باتجاه RTL مع حالة تركيز واضحة." />
        </Card>

        <Card className="library-panel">
          <h2>تنبيه يتطلب إجراء</h2>
          <ActionAlert
            urgency="high"
            title="طلب إعادة جدولة بانتظار قرارك"
            description="راجع الطلب المرتبط بالجلسة واختر الإجراء المناسب."
            actionLabel="مراجعة الطلب"
            itemHref="#demo-action-target"
          />
          <div className="library-note" id="demo-action-target">
            <strong>عنصر الطلب المرتبط</strong>
            <span>وجهة تجريبية للتأكد من أن زر التنبيه يفتح العنصر المحدد مباشرة.</span>
          </div>
        </Card>

        <Card className="library-panel library-panel--wide">
          <h2>الأدوار والعزل المالي</h2>
          <ul className="policy-list">
            <li><Badge tone="gold">المالك</Badge><span>يراجع السجلات المالية وفق صلاحيات قاعدة البيانات.</span></li>
            <li><Badge tone="success">المعلمة</Badge><span>تقرأ مستحقاتها هي فقط؛ لا تملك صلاحية تعديلها.</span></li>
            <li><Badge tone="neutral">ولي الأمر</Badge><span>يرى إجمالي فاتورته فقط دون تقسيم مستحقات الأكاديمية والمعلمة.</span></li>
          </ul>
        </Card>
      </section>
      <footer className="library-footer">المرحلة الأولى — مكتبة الأساسات والمكونات</footer>
    </main>
  );
}
