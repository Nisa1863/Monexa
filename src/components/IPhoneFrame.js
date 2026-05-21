export default function IPhoneFrame({ children, footer = null }) {
  return (
    <div className="iphone-stage">
      <div className="iphone-orbit iphone-orbit--1" aria-hidden />
      <div className="iphone-orbit iphone-orbit--2" aria-hidden />
      <div className="iphone-orbit iphone-orbit--3" aria-hidden />
      

      <div className="iphone-device" role="presentation">
        <div className="iphone-bezel">
          <div className="iphone-notch-wrap">
            <div className="iphone-notch" />
          </div>
          <div className="iphone-status-bar">
            <span className="iphone-time">9:41</span>
            <div className="iphone-status-icons" aria-hidden>
              <span className="iphone-signal" />
              <span className="iphone-wifi" />
              <span className="iphone-battery" />
            </div>
          </div>
          <div className="iphone-screen">
            <div className="iphone-scroll">{children}</div>
            {footer}
          </div>
        </div>
      </div>
    </div>
  );
}
