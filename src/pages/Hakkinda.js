import { Link } from "react-router-dom";
import {
  FaChartLine,
  FaLightbulb,
  FaMobileAlt,
  FaPiggyBank,
  FaRobot,
  FaShieldAlt,
  FaUserPlus,
  FaWallet
} from "react-icons/fa";
import MonexaLogo from "../components/MonexaLogo";
import "./hakkinda.css";

const SECTIONS = [
  {
    icon: FaWallet,
    title: "Monexa nedir?",
    text: "Monexa, gelir ve giderlerini tek yerde toplayıp anlaşılır özetler sunan kişisel finans uygulamasıdır. Karmaşık tablolar yerine grafikler, kısa yorumlar ve sana özel önerilerle paranı yönetmeni kolaylaştırır."
  },
  {
    icon: FaLightbulb,
    title: "Neden bu uygulamaya ihtiyaç duyuldu?",
    text: "Çoğu kişi harcamasının nereye gittiğini tam olarak bilmez; bütçe planı da genelde zor ve dağınık kalır. Monexa, günlük finansal kararları desteklemek için sade bir arayüz ve veriye dayalı geri bildirim sunar."
  },
  {
    icon: FaMobileAlt,
    title: "Uygulama nasıl kullanılır?",
    text: "Hesabını oluştur, harcamalarını ve gelirini kaydet, ana sayfa ve analiz ekranlarından özetini izle. İstersen banka bilgini bağla, koç önerilerini takip et ve detaylı risk değerlendirmesiyle planını netleştir."
  },
  {
    icon: FaPiggyBank,
    title: "Sana sağladığı avantajlar",
    list: [
      "Aylık harcamanı ve risk durumunu tek bakışta görürsün.",
      "Kategorilere göre nereye para gittiğini anlarsın.",
      "Gereksiz harcamayı erken fark edebilirsin.",
      "Tasarruf ve ödeme alışkanlıkların için somut ipuçları alırsın."
    ]
  },
  {
    icon: FaChartLine,
    title: "Grafikler ve analizler ne anlatır?",
    text: "Çizgi ve sütun grafikleri harcamanın zaman içindeki seyrini gösterir; pasta ve çubuk grafikleri ise hangi alana (market, ulaşım, fatura vb.) ne kadar gittiğini özetler. Altındaki kısa yorumlar, grafiği tek tek yorumlamana gerek kalmadan ne anlama geldiğini söyler."
  },
  {
    icon: FaRobot,
    title: "Akıllı öneriler ne işe yarar?",
    text: "Girdiğin bilgilere ve harcama alışkanlıklarına göre risk seviyeni, tasarruf potansiyelini ve dikkat etmen gereken kategorileri öne çıkarır. Amaç seni korkutmak değil; daha bilinçli ve planlı hareket etmeni sağlamaktır."
  },
  {
    icon: FaShieldAlt,
    title: "Günlük hayatta nasıl katkı sağlar?",
    text: "Alışverişten önce bütçene uyup uymadığını kontrol edebilir, ay sonunda sürpriz borçlarla karşılaşma riskini azaltabilirsin. Uzun vadede daha düzenli birikim ve daha az finansal stres hedeflenir."
  }
];

const USAGE_STEPS = [
  { title: "Hesap oluştur", desc: "E-posta ile kayıt ol ve güvenli giriş yap." },
  { title: "Gelir ve gider ekle", desc: "Profilden manuel harcama gir veya fiş tara." },
  { title: "Kategorilere göre incele", desc: "Market, ulaşım, fatura gibi alanlarda dağılımı gör." },
  { title: "Grafiklerden takip et", desc: "Ana sayfa ve analizde trend ve risk özetine bak." },
  { title: "Akıllı önerileri oku", desc: "Koç ve detaylı risk ekranından kişisel ipuçları al." },
  { title: "Bütçeni bilinçli yönet", desc: "Önerileri günlük harcama kararlarına yansıt." }
];

function SectionCard({ icon: Icon, title, text, list }) {
  return (
    <article className="hakkinda-card hakkinda-section">
      <div className="hakkinda-card__head">
        <span className="hakkinda-card__icon" aria-hidden>
          <Icon />
        </span>
        <h2 className="hakkinda-card__title">{title}</h2>
      </div>
      {text ? <p className="hakkinda-card__text">{text}</p> : null}
      {list ? (
        <ul className="hakkinda-card__list">
          {list.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}

export default function Hakkinda() {
  return (
    <div className="hakkinda-page">
      <header className="hakkinda-hero">
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
          <MonexaLogo size={56} />
        </div>
        <p className="hakkinda-hero__logo">Monexa</p>
        <h1 className="hakkinda-hero__slogan">Finansal geleceğini verilerle yönet.</h1>
        <p className="hakkinda-hero__lead">
          Monexa, gelir ve giderlerini analiz ederek daha bilinçli bütçe yönetimi yapmanı sağlayan yapay zeka destekli
          kişisel finans platformudur.
        </p>
      </header>

      <section className="hakkinda-card hakkinda-section" aria-labelledby="hakkinda-benefits-title">
        <h2 id="hakkinda-benefits-title" className="hakkinda-card__title" style={{ marginBottom: 10 }}>
          Kısaca ne kazanırsın?
        </h2>
        <div className="hakkinda-benefits">
          <div className="hakkinda-benefit">
            <strong>Net özet</strong>
            Harcama ve risk tek ekranda
          </div>
          <div className="hakkinda-benefit">
            <strong>Kolay takip</strong>
            Grafiklerle anında görüş
          </div>
          <div className="hakkinda-benefit">
            <strong>Kişisel öneri</strong>
            Sana uygun adımlar
          </div>
          <div className="hakkinda-benefit">
            <strong>Güvenli kullanım</strong>
            Sade ve anlaşılır arayüz
          </div>
        </div>
      </section>

      {SECTIONS.map((section) => (
        <SectionCard key={section.title} {...section} />
      ))}

      <section className="hakkinda-card hakkinda-section" aria-labelledby="hakkinda-flow-title">
        <h2 id="hakkinda-flow-title" className="hakkinda-card__title" style={{ marginBottom: 12 }}>
          Nasıl başlarsın?
        </h2>
        <div className="hakkinda-flow">
          {USAGE_STEPS.map((step, index) => (
            <div key={step.title} className="hakkinda-flow__step">
              <span className="hakkinda-flow__num">{index + 1}</span>
              <div>
                <p className="hakkinda-flow__label">{step.title}</p>
                <p className="hakkinda-flow__desc">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="hakkinda-cta">
        <Link to="/welcome" className="btn btn-primary">
          <FaUserPlus style={{ marginRight: 8, verticalAlign: "middle" }} />
          Hesap oluştur
        </Link>
        <p className="hakkinda-cta__links muted">
          Zaten hesabın var mı? <Link to="/">Giriş yap</Link>
        </p>
      </div>
    </div>
  );
}
