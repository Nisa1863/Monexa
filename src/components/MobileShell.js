import IOSStatusBar from "./IOSStatusBar";
import IPhoneMockup from "./IPhoneMockup";
import PullDownSheet from "./PullDownSheet";
import QuickAccessRadial from "./QuickAccessRadial";

export default function MobileShell({ children, footer = null, showQuickAccess = true, routePath = "" }) {
  return (
    <div className="app-shell app-route-pane">
      <IPhoneMockup>
        <div className={`ios-app-column${footer ? " ios-app-column--tabbar" : ""} ${routePath === "/" ? "ios-app-column--login" : ""}`}>
          <IOSStatusBar />
          <div className="app-shell__scroll">{children}</div>
          {footer}
        </div>
        <PullDownSheet />
        {showQuickAccess ? <QuickAccessRadial /> : null}
      </IPhoneMockup>
    </div>
  );
}
