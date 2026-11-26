const A_ORIGIN = "https://test-website-a.pages.dev";
const mode = location.pathname.replace(/\/+$/, "").endsWith("/seed")
  ? "seed" : "observe";
const result = document.getElementById("result");
let attempts = 0;

async function probe() {
  attempts += 1;
  try {
    const response = await fetch("/dbsc-partitioning/probe", {
      cache: "no-store",
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error(`Probe returned HTTP ${response.status}`);
    }

    const { dbsc, ordinary } = await response.json();
    const done = Boolean(dbsc) || attempts >= 12;
    const data = {
      type: "dbsc-probe",
      mode,
      dbsc: dbsc || null,
      ordinary: ordinary || null,
      attempts,
      done,
    };
    result.dataset.state = done ? "done" : "checking";
    result.dataset.dbsc = data.dbsc || "";
    result.dataset.ordinary = data.ordinary || "";
    result.textContent = `DBSC: ${data.dbsc || "absent"}\nCookie: ${data.ordinary || "absent"}`;

    if (window.parent !== window) {
      window.parent.postMessage(data, A_ORIGIN);
    }
    if (!done) {
      setTimeout(probe, 500);
    }
  } catch (error) {
    const data = {
      type: "dbsc-probe",
      mode,
      dbsc: null,
      ordinary: null,
      attempts,
      done: true,
      error: String(error),
    };
    result.dataset.state = "done";
    result.textContent = data.error;
    if (window.parent !== window) {
      window.parent.postMessage(data, A_ORIGIN);
    }
  }
}

probe();
