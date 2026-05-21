/**
 * İnce modern çerçeve + Dynamic Island; içerik gerçek uygulama gibi ekranda.
 * Sürükleme sınırları için ekran köküne id verilir.
 */
export default function IPhoneMockup({ children }) {
  return (
    <div className="iphone-mockup-stage">
      <div className="iphone-mockup-device">
        <div className="iphone-mockup-rim" aria-hidden />
        <div id="iphone-mockup-screen" className="iphone-mockup-screen">
          <div className="iphone-mockup-island" aria-hidden />
          {children}
        </div>
      </div>
    </div>
  );
}
