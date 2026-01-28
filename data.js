export const data = {
  name: "Security Zone A",
  type: "zone",
  children: [
    {
      name: "PROD",
      type: "environment",
      children: [
        {
          name: "Web Tier",
          type: "tier",
          children: [
            {
              name: "Web App",
              type: "application",
              children: [
                { name: "web-prod-01", type: "host" },
                { name: "web-prod-02", type: "host" },
              ],
            },
          ],
        },
        {
          name: "Application Tier",
          type: "tier",
          children: [
            {
              name: "Backend API",
              type: "application",
              children: [{ name: "api-prod-01", type: "host" }],
            },
            {
              name: "Worker Service",
              type: "application",
              children: [
                { name: "worker-prod-01", type: "host" },
                { name: "worker-prod-02", type: "host" },
              ],
            },
          ],
        },
        {
          name: "Database Tier",
          type: "tier",
          children: [
            {
              name: "PostgreSQL",
              type: "application",
              children: [{ name: "db-prod-01", type: "host" }],
            },
          ],
        },
      ],
    },
    {
      name: "DR",
      type: "environment",
      children: [
        {
          name: "Web Tier",
          type: "tier",
          children: [
            {
              name: "Web App",
              type: "application",
              children: [{ name: "web-dr-01", type: "host" }],
            },
          ],
        },
        {
          name: "Database Tier",
          type: "tier",
          children: [
            {
              name: "PostgreSQL",
              type: "application",
              children: [
                { name: "db-dr-01", type: "host" },
                { name: "db-dr-02", type: "host" },
              ],
            },
          ],
        },
      ],
    },
  ],
};
