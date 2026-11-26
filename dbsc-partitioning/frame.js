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
    if (done) {
      result.dataset.state = "done";
      result.dataset.dbsc = dbsc || "";
      result.dataset.ordinary = ordinary || "";
      result.textContent = `DBSC ID: ${dbsc || "absent"}\nRegular cookie: ${ordinary || "absent"}`;
    } else {
      setTimeout(probe, 500);
    }
  } catch (error) {
    result.dataset.state = "done";
    result.textContent = String(error);
  }
}

probe();
