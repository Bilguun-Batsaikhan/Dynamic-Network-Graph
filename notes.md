## The tree structure of the Data

```
const data: {
    name: string;
    type: string;
    children: {
        name: string;
        type: string;
        children: {
            name: any;
            type: string;
            children: {
                name: string;
                type: string;
                children: {
```

```json
{
  "type": "root",
  "name": "AllSecurityZones",
  "children": [
    {
      "type": "securityZone",
      "name": "SZ-DMZ",
      "children": [
        {
          "type": "environment",
          "name": "Production",
          "children": [
            {
              "type": "application",
              "name": "Payments",
              "children": [
                {
                  "type": "tier",
                  "name": "Web",
                  "children": [
                    {
                      "type": "host",
                      "id": "host-001",
                      "name": "payments-web-1"
                    },
                    {
                      "type": "host",
                      "id": "host-002",
                      "name": "payments-web-2"
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
    {
        "type": "securityZone",
      "name": "SZ-ADZ",
      "children": [...]
    }
  ]
}
```

## Model.js toNode

The raw **data** above is not what the **renderer** uses directly.

`model.js` → `toNode()` transforms every object into a richer runtime node.

### Example: same host after toNode()

This method is being called first in main.js

```javascript
{
  id: "AllSecurityZones/SZ-DMZ/Production/Payments/Web/payments-web-1",
  type: "host",
  name: "payments-web-1",

  parent: Node,        // pointer to parent tier
  children: null,      // hosts have no children
  expanded: false,     // also refers selected

  // layout
  r: 6,
  x: 0,
  y: 0,
  absX: 312,
  absY: 184,

  // metadata
  zone: "SZ-DMZ",
  env: "Production",

  // caching
  hostSet: Set(["host-001"]), // Set of host IDs under this node (itself only for hosts)
  hostList: [this] // Array of host node objects under this node (itself only for hosts)
}
```

### buildHostCaches

_It precomputes, for every node in the tree, which host nodes exist under it._

In other words:

- For a host node → “I represent exactly myself”
- For a tier / app / env / zone / root → “I represent all hosts in my subtree”

And it stores that info directly on each node so you don’t have to recompute it again and again.

On **every node**, it adds two cached fields:

- hostSet → fast lookup (O(1) .has(id))
- hostList → easy iteration (used when mapping to visible proxies)

### computeAbsPositions

`computeAbsolutePositions` walks the expanded tree and accumulates local offsets into final, scene-level coordinates used for rendering and link endpoints.

absX/absY describe where it lives on the screen

### indexAllNodes

It creates a map of node.id → node for all nodes in the tree, so you can quickly find any node by its ID.

```javascript
{
  "AllSecurityZones" → RootNode,
  "AllSecurityZones/SZ-DMZ" → ZoneNode,
  "AllSecurityZones/SZ-DMZ/Prod" → EnvNode,
  "…/host-001" → HostNode,
  ...
}
```

## links.js

```javascript
{
  source: "host-001",
  target: "host-045",
  traffic: "https"
}
```

After `recomputeAll()`

```javascript
{
  source: "host-001",
  target: "host-045",

  _sh: Node, // source host node
  _th: Node  // target host node
}
```

These pointers make rendering fast.

## Colors.js

Assigns a color to each security zone, and also provides a helper function to get the color of any node by looking up its zone.

## layout.js

### computeRadius and packWithPadding

`computeRadius(node)` → computes and assigns `node.r` based on its type and state (expanded/collapsed)
`packWithPadding(circles, pad)` → packs an array of circles (nodes) with padding between them

- uses d3.packSiblings and d3.packEnclose

Each node:

- waits for children
- decides its own size
- returns upward

One-sentence perfect summary

`computeRadius` walks the tree bottom-up and sets each node’s radius to either a fixed size (collapsed/leaf) or the smallest enclosing circle of its children (expanded).

### layout

`layout(node)` → positions the immediate children of an expanded node inside its circle, then recursively does the same for all descendants.

### recomputeAll

`recomputeAll(root, links)` → recomputes the entire layout and link endpoints based on the current tree state (expanded/collapsed nodes).

`linkEndpoints` is an array of objects like:

```javascript
{
  source: "host-001",
  target: "host-045",
  protocol: "https",
  _sh: Node,  // source host node
  _th: Node   // target host node
},
...
```

For `nodebyId`, see `indexAllNodes` above.
