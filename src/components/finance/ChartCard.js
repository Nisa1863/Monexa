import "./charts.css";

export default function ChartCard({ title, subtitle, insight, footer, children, className = "", bodyClassName = "" }) {
  return (
    <section className={`finance-chart-card ${className}`.trim()}>
      <header className="finance-chart-card__head">
        {title ? <h2 className="finance-chart-card__title">{title}</h2> : null}
        {subtitle ? <p className="finance-chart-card__subtitle">{subtitle}</p> : null}
      </header>
      <div className={`finance-chart-card__body ${bodyClassName}`.trim()}>{children}</div>
      {insight ? <p className="finance-chart-card__insight">{insight}</p> : null}
      {footer ? <footer className="finance-chart-card__footer">{footer}</footer> : null}
    </section>
  );
}
