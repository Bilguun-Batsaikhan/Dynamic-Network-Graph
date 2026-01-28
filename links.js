// links.js
export const links = [
  // SZ-1 internal: web -> db
  {
    id: "sz1_web1_to_db1",
    source: "Root/SZ-1/Production/Web/web-app-1/prod-web-app-1-host-1",
    target: "Root/SZ-1/Production/Database/db-cluster-1/prod-db-1-host-1",
    kind: "internal",
  },

  {
    id: "sz1_app1_to_db2",
    source: "Root/SZ-1/Production/Application/app-service-1/prod-app-1-host-1",
    target: "Root/SZ-1/Production/Database/db-cluster-2/prod-db-2-host-2",
    kind: "internal",
  },

  // SZ-2 internal: web -> db
  {
    id: "sz2_web3_to_db1",
    source: "Root/SZ-2/Production/Web/web-app-3/prod-web-app-3-sz2-host-2",
    target: "Root/SZ-2/Production/Database/db-cluster-1/prod-db-1-sz2-host-1",
    kind: "internal",
  },

  {
    id: "sz2_app2_to_app1",
    source:
      "Root/SZ-2/Production/Application/app-service-2/prod-app-2-sz2-host-1",
    target:
      "Root/SZ-2/Production/Application/app-service-1/prod-app-1-sz2-host-3",
    kind: "internal",
  },

  // Cross-zone links (SZ-1 -> SZ-2)
  {
    id: "cross_sz1_web1_to_sz2_app1",
    source: "Root/SZ-1/Production/Web/web-app-1/prod-web-app-1-host-2",
    target:
      "Root/SZ-2/Production/Application/app-service-1/prod-app-1-sz2-host-1",
    kind: "cross-zone",
  },

  {
    id: "cross_sz1_db1_to_sz2_db2",
    source: "Root/SZ-1/Production/Database/db-cluster-1/prod-db-1-host-3",
    target: "Root/SZ-2/Production/Database/db-cluster-2/prod-db-2-sz2-host-4",
    kind: "cross-zone",
  },

  // Cross-zone (SZ-2 -> SZ-1)
  {
    id: "cross_sz2_web2_to_sz1_app3",
    source: "Root/SZ-2/Production/Web/web-app-2/prod-web-app-2-sz2-host-1",
    target: "Root/SZ-1/Production/Application/app-service-3/prod-app-3-host-2",
    kind: "cross-zone",
  },
];
