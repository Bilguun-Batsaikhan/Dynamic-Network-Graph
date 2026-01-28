export const data = {
  name: "All Security Zones",
  type: "root",
  children: [
    {
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
    },
    {
      name: "Security Zone B",
      type: "zone",
      children: [
        {
          name: "STAGING",
          type: "environment",
          children: [
            {
              name: "Integration Tier",
              type: "tier",
              children: [
                {
                  name: "Middleware Bus",
                  type: "application",
                  children: [
                    { name: "ms-stage-01", type: "host" },
                    { name: "ms-stage-02", type: "host" },
                  ],
                },
              ],
            },
            {
              name: "Database Tier",
              type: "tier",
              children: [
                {
                  name: "Redis Cache",
                  type: "application",
                  children: [{ name: "cache-stage-01", type: "host" }],
                },
              ],
            },
          ],
        },
        {
          name: "LEGACY",
          type: "environment",
          children: [
            {
              name: "Mainframe Tier",
              type: "tier",
              children: [
                {
                  name: "Payment Gateway",
                  type: "application",
                  children: [
                    { name: "pay-leg-01", type: "host" },
                    { name: "pay-leg-02", type: "host" },
                    { name: "pay-leg-03", type: "host" },
                  ],
                },
              ],
            },
          ],
        },
        {
          name: "MANAGEMENT",
          type: "environment",
          children: [
            {
              name: "Ops Tier",
              type: "tier",
              children: [
                {
                  name: "Monitoring Tool",
                  type: "application",
                  children: [{ name: "mon-ops-01", type: "host" }],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
