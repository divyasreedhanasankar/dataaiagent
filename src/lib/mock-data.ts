import type { DatabaseInfo } from "@/types";

export const DATABASES: DatabaseInfo[] = [
  {
    id: "commerce-pg",
    name: "commerce_analytics",
    engine: "PostgreSQL",
    host: "db.datamind.cloud:5432",
    size: "1.4 GB",
    latencyMs: 18,
    status: "connected",
    tables: [
      {
        name: "customers",
        description: "Registered buyers with lifecycle and geography data.",
        rows: 48210,
        columns: [
          { name: "id", type: "uuid", primaryKey: true },
          { name: "full_name", type: "varchar(120)" },
          { name: "email", type: "varchar(160)" },
          { name: "country", type: "varchar(60)" },
          { name: "segment", type: "varchar(24)" },
          { name: "created_at", type: "timestamptz" },
        ],
      },
      {
        name: "orders",
        description: "Order headers including status, totals and channel.",
        rows: 192440,
        columns: [
          { name: "id", type: "uuid", primaryKey: true },
          { name: "customer_id", type: "uuid", foreignKey: "customers.id" },
          { name: "status", type: "varchar(20)" },
          { name: "channel", type: "varchar(20)" },
          { name: "total_amount", type: "numeric(12,2)" },
          { name: "placed_at", type: "timestamptz" },
        ],
      },
      {
        name: "order_items",
        description: "Line items linking orders to products.",
        rows: 611905,
        columns: [
          { name: "id", type: "bigserial", primaryKey: true },
          { name: "order_id", type: "uuid", foreignKey: "orders.id" },
          { name: "product_id", type: "uuid", foreignKey: "products.id" },
          { name: "quantity", type: "integer" },
          { name: "unit_price", type: "numeric(10,2)" },
        ],
      },
      {
        name: "products",
        description: "Catalog with pricing, category and supplier links.",
        rows: 5120,
        columns: [
          { name: "id", type: "uuid", primaryKey: true },
          { name: "name", type: "varchar(160)" },
          { name: "category_id", type: "uuid", foreignKey: "categories.id" },
          { name: "price", type: "numeric(10,2)" },
          { name: "stock", type: "integer" },
        ],
      },
      {
        name: "categories",
        description: "Product taxonomy used across reporting.",
        rows: 42,
        columns: [
          { name: "id", type: "uuid", primaryKey: true },
          { name: "name", type: "varchar(80)" },
          { name: "parent_id", type: "uuid", foreignKey: "categories.id", nullable: true },
        ],
      },
      {
        name: "payments",
        description: "Captured payments and refunds per order.",
        rows: 188932,
        columns: [
          { name: "id", type: "uuid", primaryKey: true },
          { name: "order_id", type: "uuid", foreignKey: "orders.id" },
          { name: "method", type: "varchar(20)" },
          { name: "amount", type: "numeric(12,2)" },
          { name: "captured_at", type: "timestamptz" },
        ],
      },
    ],
  },
  {
    id: "growth-mysql",
    name: "growth_metrics",
    engine: "MySQL",
    host: "mysql.datamind.cloud:3306",
    size: "620 MB",
    latencyMs: 31,
    status: "idle",
    tables: [
      {
        name: "signups",
        description: "Daily signup funnel counts by source.",
        rows: 91200,
        columns: [
          { name: "id", type: "bigint", primaryKey: true },
          { name: "source", type: "varchar(40)" },
          { name: "created_at", type: "datetime" },
        ],
      },
      {
        name: "sessions",
        description: "Product sessions with duration and device.",
        rows: 1420000,
        columns: [
          { name: "id", type: "bigint", primaryKey: true },
          { name: "user_id", type: "bigint" },
          { name: "duration_s", type: "int" },
          { name: "device", type: "varchar(20)" },
        ],
      },
    ],
  },
  {
    id: "events-sqlite",
    name: "events_local.db",
    engine: "SQLite",
    host: "local file",
    size: "84 MB",
    latencyMs: 3,
    status: "idle",
    tables: [
      {
        name: "events",
        description: "Raw product telemetry captured offline.",
        rows: 240300,
        columns: [
          { name: "id", type: "INTEGER", primaryKey: true },
          { name: "name", type: "TEXT" },
          { name: "payload", type: "TEXT" },
          { name: "ts", type: "INTEGER" },
        ],
      },
    ],
  },
  {
    id: "catalog-mongo",
    name: "catalog_docs",
    engine: "MongoDB",
    host: "mongo.datamind.cloud:27017",
    size: "2.1 GB",
    latencyMs: 44,
    status: "error",
    tables: [
      {
        name: "documents",
        description: "Denormalised catalog documents (collection).",
        rows: 78400,
        columns: [
          { name: "_id", type: "ObjectId", primaryKey: true },
          { name: "title", type: "string" },
          { name: "attributes", type: "object" },
        ],
      },
    ],
  },
];

export const EXAMPLE_PROMPTS = [
  "Show top 10 products by revenue",
  "Monthly sales trend",
  "Revenue by category",
  "Customer growth",
  "Inventory status",
  "Draw ER diagram",
  "Explain database schema",
  "Show order workflow",
];

export const QUICK_ACTIONS = [
  { label: "Sales Analysis", prompt: "Monthly sales trend", icon: "TrendingUp" },
  { label: "Customer Insights", prompt: "Customer growth", icon: "Users" },
  { label: "Inventory", prompt: "Inventory status", icon: "Boxes" },
  { label: "Orders", prompt: "Show order workflow", icon: "ShoppingCart" },
  { label: "Products", prompt: "Show top 10 products by revenue", icon: "Package" },
  { label: "Revenue", prompt: "Revenue by category", icon: "DollarSign" },
  { label: "Database Schema", prompt: "Explain database schema", icon: "Database" },
  { label: "Charts", prompt: "Draw ER diagram", icon: "BarChart3" },
] as const;

export const FAVORITE_QUERIES = [
  "Top 10 products by revenue",
  "Churn risk customers",
  "Refund rate by channel",
];
