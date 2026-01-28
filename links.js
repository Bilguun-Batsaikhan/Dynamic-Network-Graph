// links.js
export const links = [
  // internal within same zone
  {
    id: "a_web01_to_a_db01",
    source:
      "All Security Zones/Security Zone A/PROD/Web Tier/Web App/web-prod-01",
    target:
      "All Security Zones/Security Zone A/PROD/Database Tier/PostgreSQL/db-prod-01",
    kind: "internal",
  },

  // cross-zone (A -> B)
  {
    id: "a_api01_to_b_cache01",
    source:
      "All Security Zones/Security Zone A/PROD/Application Tier/Backend API/api-prod-01",
    target:
      "All Security Zones/Security Zone B/STAGING/Database Tier/Redis Cache/cache-stage-01",
    kind: "cross-zone",
  },
];
