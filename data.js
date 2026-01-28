// export const data = {
//   name: "All Security Zones",
//   type: "root",
//   children: [
//     {
//       name: "Security Zone A",
//       type: "zone",
//       children: [
//         {
//           name: "PROD",
//           type: "environment",
//           children: [
//             {
//               name: "Web Tier",
//               type: "tier",
//               children: [
//                 {
//                   name: "Web App",
//                   type: "application",
//                   children: [
//                     { name: "web-prod-01", type: "host" },
//                     { name: "web-prod-02", type: "host" },
//                   ],
//                 },
//               ],
//             },
//             {
//               name: "Application Tier",
//               type: "tier",
//               children: [
//                 {
//                   name: "Backend API",
//                   type: "application",
//                   children: [{ name: "api-prod-01", type: "host" }],
//                 },
//                 {
//                   name: "Worker Service",
//                   type: "application",
//                   children: [
//                     { name: "worker-prod-01", type: "host" },
//                     { name: "worker-prod-02", type: "host" },
//                   ],
//                 },
//               ],
//             },
//             {
//               name: "Database Tier",
//               type: "tier",
//               children: [
//                 {
//                   name: "PostgreSQL",
//                   type: "application",
//                   children: [{ name: "db-prod-01", type: "host" }],
//                 },
//               ],
//             },
//           ],
//         },
//         {
//           name: "DR",
//           type: "environment",
//           children: [
//             {
//               name: "Web Tier",
//               type: "tier",
//               children: [
//                 {
//                   name: "Web App",
//                   type: "application",
//                   children: [{ name: "web-dr-01", type: "host" }],
//                 },
//               ],
//             },
//             {
//               name: "Database Tier",
//               type: "tier",
//               children: [
//                 {
//                   name: "PostgreSQL",
//                   type: "application",
//                   children: [
//                     { name: "db-dr-01", type: "host" },
//                     { name: "db-dr-02", type: "host" },
//                   ],
//                 },
//               ],
//             },
//           ],
//         },
//       ],
//     },
//     {
//       name: "Security Zone B",
//       type: "zone",
//       children: [
//         {
//           name: "STAGING",
//           type: "environment",
//           children: [
//             {
//               name: "Integration Tier",
//               type: "tier",
//               children: [
//                 {
//                   name: "Middleware Bus",
//                   type: "application",
//                   children: [
//                     { name: "ms-stage-01", type: "host" },
//                     { name: "ms-stage-02", type: "host" },
//                   ],
//                 },
//               ],
//             },
//             {
//               name: "Database Tier",
//               type: "tier",
//               children: [
//                 {
//                   name: "Redis Cache",
//                   type: "application",
//                   children: [{ name: "cache-stage-01", type: "host" }],
//                 },
//               ],
//             },
//           ],
//         },
//         {
//           name: "LEGACY",
//           type: "environment",
//           children: [
//             {
//               name: "Mainframe Tier",
//               type: "tier",
//               children: [
//                 {
//                   name: "Payment Gateway",
//                   type: "application",
//                   children: [
//                     { name: "pay-leg-01", type: "host" },
//                     { name: "pay-leg-02", type: "host" },
//                     { name: "pay-leg-03", type: "host" },
//                   ],
//                 },
//               ],
//             },
//           ],
//         },
//         {
//           name: "MANAGEMENT",
//           type: "environment",
//           children: [
//             {
//               name: "Ops Tier",
//               type: "tier",
//               children: [
//                 {
//                   name: "Monitoring Tool",
//                   type: "application",
//                   children: [{ name: "mon-ops-01", type: "host" }],
//                 },
//               ],
//             },
//           ],
//         },
//       ],
//     },
//   ],
// };
export const data = {
  name: "Root",
  type: "root",
  children: [
    {
      name: "SZ-1",
      type: "zone",
      children: [
        {
          name: "Production",
          type: "environment",
          children: [
            {
              name: "LoadBalancer",
              type: "tier",
              children: [
                {
                  name: "lb-app-1",
                  type: "application",
                  children: [
                    { name: "prod-lb-app-1-host-1", type: "host" },
                    { name: "prod-lb-app-1-host-2", type: "host" },
                  ],
                },
                {
                  name: "lb-app-2",
                  type: "application",
                  children: [
                    { name: "prod-lb-app-2-host-1", type: "host" },
                    { name: "prod-lb-app-2-host-2", type: "host" },
                  ],
                },
              ],
            },
            {
              name: "Web",
              type: "tier",
              children: Array.from({ length: 5 }, (_, i) => ({
                name: `web-app-${i + 1}`,
                type: "application",
                children: Array.from({ length: 6 }, (__, j) => ({
                  name: `prod-web-app-${i + 1}-host-${j + 1}`,
                  type: "host",
                })),
              })),
            },
            {
              name: "Application",
              type: "tier",
              children: Array.from({ length: 4 }, (_, i) => ({
                name: `app-service-${i + 1}`,
                type: "application",
                children: Array.from({ length: 6 }, (__, j) => ({
                  name: `prod-app-${i + 1}-host-${j + 1}`,
                  type: "host",
                })),
              })),
            },
            {
              name: "Database",
              type: "tier",
              children: Array.from({ length: 2 }, (_, i) => ({
                name: `db-cluster-${i + 1}`,
                type: "application",
                children: Array.from({ length: 6 }, (__, j) => ({
                  name: `prod-db-${i + 1}-host-${j + 1}`,
                  type: "host",
                })),
              })),
            },
          ],
        },
        {
          name: "Staging",
          type: "environment",
          children: [
            {
              name: "Web",
              type: "tier",
              children: Array.from({ length: 2 }, (_, i) => ({
                name: `stg-web-app-${i + 1}`,
                type: "application",
                children: Array.from({ length: 4 }, (__, j) => ({
                  name: `stg-web-${i + 1}-host-${j + 1}`,
                  type: "host",
                })),
              })),
            },
            {
              name: "Application",
              type: "tier",
              children: Array.from({ length: 2 }, (_, i) => ({
                name: `stg-app-${i + 1}`,
                type: "application",
                children: Array.from({ length: 6 }, (__, j) => ({
                  name: `stg-app-${i + 1}-host-${j + 1}`,
                  type: "host",
                })),
              })),
            },
          ],
        },
        {
          name: "Development",
          type: "environment",
          children: [
            {
              name: "Web",
              type: "tier",
              children: [
                {
                  name: "dev-web-app-1",
                  type: "application",
                  children: Array.from({ length: 4 }, (_, j) => ({
                    name: `dev-web-1-host-${j + 1}`,
                    type: "host",
                  })),
                },
              ],
            },
            {
              name: "Application",
              type: "tier",
              children: [
                {
                  name: "dev-app-1",
                  type: "application",
                  children: Array.from({ length: 6 }, (_, j) => ({
                    name: `dev-app-1-host-${j + 1}`,
                    type: "host",
                  })),
                },
              ],
            },
          ],
        },
      ],
    },
    {
      name: "SZ-2",
      type: "zone",
      children: [
        {
          name: "Production",
          type: "environment",
          children: [
            {
              name: "Web",
              type: "tier",
              children: Array.from({ length: 6 }, (_, i) => ({
                name: `web-app-${i + 1}`,
                type: "application",
                children: Array.from({ length: 6 }, (__, j) => ({
                  name: `prod-web-app-${i + 1}-sz2-host-${j + 1}`,
                  type: "host",
                })),
              })),
            },
            {
              name: "Application",
              type: "tier",
              children: Array.from({ length: 4 }, (_, i) => ({
                name: `app-service-${i + 1}`,
                type: "application",
                children: Array.from({ length: 6 }, (__, j) => ({
                  name: `prod-app-${i + 1}-sz2-host-${j + 1}`,
                  type: "host",
                })),
              })),
            },
            {
              name: "Database",
              type: "tier",
              children: Array.from({ length: 2 }, (_, i) => ({
                name: `db-cluster-${i + 1}`,
                type: "application",
                children: Array.from({ length: 6 }, (__, j) => ({
                  name: `prod-db-${i + 1}-sz2-host-${j + 1}`,
                  type: "host",
                })),
              })),
            },
          ],
        },
        {
          name: "Staging",
          type: "environment",
          children: [
            {
              name: "Web",
              type: "tier",
              children: [
                {
                  name: "stg-web-1",
                  type: "application",
                  children: [
                    { name: "stg-web-1-sz2-host-1", type: "host" },
                    { name: "stg-web-1-sz2-host-2", type: "host" },
                  ],
                },
              ],
            },
          ],
        },
        {
          name: "Development",
          type: "environment",
          children: [
            {
              name: "Application",
              type: "tier",
              children: [
                {
                  name: "dev-app-1",
                  type: "application",
                  children: Array.from({ length: 4 }, (_, j) => ({
                    name: `dev-app-1-sz2-host-${j + 1}`,
                    type: "host",
                  })),
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

// For convenience also export default
export default data;
