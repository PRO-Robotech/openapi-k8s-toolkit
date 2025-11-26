## 📘 openapi-k8s-toolkit

A modular, extensible UI toolkit for building Kubernetes-powered applications — without writing repetitive CRUD logic or UI boilerplate.

This toolkit provides:

- 🧩 **Composable UI blocks** (tables, terminals, log viewers, dashboards, cards)
- ⚙️ **Smart data providers** that fetch and normalize Kubernetes and OpenAPI-driven resources
- 📄 **Schema-based OpenAPI/Kubernetes forms** with validation, presets, and dynamic layouts
- 📡 **Real-time Websocket live data streaming** for Pods, Events, Logs, Terminals, etc.
- 🏗 **A powerful Factory Engine** that renders pages and components from declarative configuration (JSON/YAML)
- 🎨 **Customizable Storybook Docs** with live configuration playgrounds

Whether you're building a full Kubernetes console, a DevOps dashboard, a tenant-aware SaaS admin, or automation portal — this toolkit helps you build fast, stays extensible, and avoids reinventing the same patterns.

---

## 🚀 Key Concepts

### 🔧 1. Dynamic Component Factory

Instead of manually wiring dozens of components together, define **what** should render — not **how**.

```yaml
type: EnrichedTable
data:
  id: pods-table
  cluster: dev
  k8sResourceToFetch:
    plural: pods
    apiVersion: v1
```

The factory resolves:

- Routing context (`cluster`, `namespace`, `resource`)
- Data fetching configuration
- Permissions
- UI layout behavior

…and renders the right component — fully wired.

Storybook includes live playgrounds for each factory type.

---

### 📡 2. Smart Data Hooks

The toolkit includes advanced hooks that abstract K8s + OpenAPI internals:

- `useK8sSmartResource`
- `useMultiQuery`
- live event streams
- generative OpenAPI form helpers

They handle:

- label/field selectors
- live logs and terminals
- resource normalization
- error states + retry logic
- batching and subscription reuse

---

### 📑 3. Kubernetes Tables

Tables are:

- Cluster/WebSocket aware
- Automatically enriched using Kubernetes metadata
- Customizable (columns, sorting, grouping, row actions, links to forms, etc.)

---

### 🧪 4. Forms Powered by OpenAPI + Kubernetes

Forms are auto-built from CRDs, OpenAPI schemas, and Kubernetes metadata — but still fully overrideable:

- custom fields
- computed fields
- presets & blueprints
- etc

Think _"Kubernetes + JSON Schema form generator on steroids."_ 💉💪

---

### 📚 5. Storybook Included

Every major module ships with a **docs-only Storybook entry** and an interactive control system to generate YAML/JSON config.
You can preview factories components if they are not tightly wired to backend

## 🛠 Installation & Usage

```bash
npm install openapi-k8s-toolkit
```

Then import what you like

## ✨ Why this exists

Building Kubernetes-aware UIs repeatedly results in the same pain:

- API quirks
- forms from CRDs
- live resource tables
- labels/fields selectors
- permissions
- routing based on cluster/namespace/object

This toolkit abstracts those patterns into reusable building blocks so teams can focus on **intent and experience, not plumbing.**

---

## 🤝 Contributing
