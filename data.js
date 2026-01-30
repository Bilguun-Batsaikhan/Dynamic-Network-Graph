// data.js
// Structure: sz -> env -> application -> tier -> host
// ~100 applications total, some tiers named "n/a"

function makeHosts(appName, count) {
  return Array.from({ length: count }, (_, i) => ({
    name: `${appName}-host-${i + 1}`,
    type: "host",
  }));
}

function makeTiers(appName, tierCount) {
  return Array.from({ length: tierCount }, (_, i) => ({
    name: Math.random() < 0.12 ? "n/a" : `tier-${i + 1}`,
    type: "tier",
    children: makeHosts(appName, 2 + ((i + appName.length) % 4)),
  }));
}

function makeApplications(envName, count) {
  return Array.from({ length: count }, (_, i) => {
    const appName = `${envName.toLowerCase()}-app-${i + 1}`;
    return {
      name: appName,
      type: "application",
      children: makeTiers(appName, 1 + (i % 3)),
    };
  });
}

function makeEnvironment(name, appCount) {
  return {
    name,
    type: "environment",
    children: makeApplications(name, appCount),
  };
}

export const data = {
  name: "Root",
  type: "root",
  children: ["SZ-1", "SZ-2"].map((sz) => ({
    name: sz,
    type: "zone",
    children: [
      makeEnvironment("Production", 20),
      makeEnvironment("Staging", 15),
      makeEnvironment("Development", 10),
      makeEnvironment("DR", 5),
    ],
  })),
};

export default data;
