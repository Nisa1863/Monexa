const path = require("path");
const { spawn } = require("child_process");
const http = require("http");
const net = require("net");

function readArg(flag) {
  return process.argv.includes(flag);
}

const rootDir = path.resolve(__dirname, "..");
const backendDir = path.join(rootDir, "backend");

const basePort = process.env.PORT || "5000";
const flaskPort = process.env.FLASK_PORT || "5001";
const apiUrlBase = process.env.REACT_APP_API_URL || `http://localhost:${basePort}/api`;

const runBackend = !readArg("--frontend-only");
const runFrontend = !readArg("--backend-only");
const smokeTest = readArg("--smoke-test");

function startProcess(name, command, args, opts) {
  const child = spawn(command, args, {
    ...opts,
    stdio: "inherit"
  });
  child.on("exit", (code) => {
    if (!smokeTest) {
      console.log(`[${name}] exited with code ${code}`);
    }
  });
  return child;
}

function waitForBackendHealth(backendPort, timeoutMs = 15000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const req = http.request(
        {
          hostname: "localhost",
          port: backendPort,
          path: "/api/health",
          method: "GET",
          timeout: 2000
        },
        (res) => {
          let data = "";
          res.on("data", (d) => (data += d));
          res.on("end", () => {
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              return resolve(data);
            }
            if (Date.now() - start > timeoutMs) {
              return reject(new Error(`Backend unhealthy (HTTP ${res.statusCode})`));
            }
            setTimeout(attempt, 400);
          });
        }
      );
      req.on("timeout", () => {
        req.destroy();
        if (Date.now() - start > timeoutMs) return reject(new Error("Backend health check timeout"));
        setTimeout(attempt, 400);
      });
      req.on("error", () => {
        if (Date.now() - start > timeoutMs) return reject(new Error("Backend health check failed"));
        setTimeout(attempt, 400);
      });
      req.end();
    };
    attempt();
  });
}

function postLogin(backendPort, email, password, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ email, password });
    const req = http.request(
      {
        hostname: "localhost",
        port: backendPort,
        path: "/api/auth/login",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload)
        },
        timeout: timeoutMs
      },
      (res) => {
        let data = "";
        res.on("data", (d) => (data += d));
        res.on("end", () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const parsed = JSON.parse(data || "{}");
              return resolve(parsed);
            } catch (e) {
              return reject(new Error("Login response was not JSON"));
            }
          }
          reject(new Error(`Login unhealthy (HTTP ${res.statusCode})`));
        });
      }
    );

    req.on("error", () => reject(new Error("Login request failed")));
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Login request timeout"));
    });
    req.write(payload);
    req.end();
  });
}

(async () => {
  // Choose a free backend port so CRA always points to the right API URL.
  async function isPortOpen(p) {
    return await new Promise((resolve) => {
      const socket = net
        .connect({ port: Number(p), host: "127.0.0.1" })
        .on("connect", () => resolve(true))
        .on("error", () => resolve(false));
      socket.end();
    });
  }

  let backendPort = basePort;
  for (let i = 0; i <= 10; i++) {
    const candidate = String(Number(basePort) + i);
    const open = await isPortOpen(candidate);
    if (!open) {
      backendPort = candidate;
      break;
    }
  }

  const apiUrl = apiUrlBase.includes(basePort) ? apiUrlBase.replace(basePort, backendPort) : `http://localhost:${backendPort}/api`;

  const sharedEnv = {
    ...process.env,
    FLASK_PORT: flaskPort,
    REACT_APP_API_URL: apiUrl
  };
  const backendEnv = {
    ...sharedEnv,
    PORT: backendPort
  };
  const frontendEnv = {
    ...sharedEnv
  };
  // Avoid forcing CRA to backend's PORT (causes interactive "run on another port?" prompt).
  delete frontendEnv.PORT;

  let backendChild = null;
  let frontendChild = null;

  if (runBackend) {
    backendChild = startProcess("backend", "node", ["server.js"], {
      cwd: backendDir,
      env: backendEnv
    });
  }

  if (smokeTest) {
    try {
      await waitForBackendHealth(backendPort);
      const loginRes = await postLogin(backendPort, "demo@monexa.app", "anything");
      if (!loginRes || !loginRes.token) throw new Error("Login did not return token");
      // Ensure frontend compiles (without starting an interactive dev server).
      if (runFrontend) {
        await new Promise((resolve, reject) => {
          const buildChild = startProcess(
            "frontend(build)",
            "node",
            ["node_modules/react-scripts/scripts/build.js"],
            { cwd: rootDir, env: frontendEnv }
          );
          buildChild.on("exit", (code) => {
            if (code === 0) resolve();
            else reject(new Error(`Frontend build failed with code ${code}`));
          });
        });
      }
      process.exit(0);
    } catch (err) {
      console.error("Smoke test failed:", err.message);
      process.exit(1);
    }
  }

  if (runFrontend) {
    // CRA dev server
    frontendChild = startProcess("frontend", "node", ["node_modules/react-scripts/scripts/start.js"], {
      cwd: rootDir,
      env: frontendEnv
    });
  }

  // Keep running until one of the children exits or user interrupts.
  const shutdown = () => {
    if (backendChild) backendChild.kill("SIGINT");
    if (frontendChild) frontendChild.kill("SIGINT");
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
})();

