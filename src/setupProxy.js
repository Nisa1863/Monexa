const { createProxyMiddleware } = require("http-proxy-middleware");

function resolveApiBase() {
  const raw = process.env.REACT_APP_API_URL || "http://localhost:5001/api";
  const trimmed = String(raw).replace(/\/$/, "");
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
}

module.exports = function setupProxy(app) {
  const apiBase = resolveApiBase();
  const rootTarget = apiBase.replace(/\/api\/?$/, "");
  const apiTarget = `${rootTarget}/api`;

  app.use("/api", createProxyMiddleware({
    target: apiTarget,
    changeOrigin: true,
    ws: true
  }));
  app.use("/predict", createProxyMiddleware({ target: rootTarget, changeOrigin: true, ws: true }));
  app.use("/train", createProxyMiddleware({ target: rootTarget, changeOrigin: true, ws: true }));
  app.use("/metrics", createProxyMiddleware({ target: rootTarget, changeOrigin: true, ws: true }));
};
