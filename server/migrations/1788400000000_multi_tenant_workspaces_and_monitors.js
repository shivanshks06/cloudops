exports.up = (pgm) => {
  // 1. Users Table
  pgm.createTable("users", {
    id: { type: "serial", primaryKey: true },
    name: { type: "varchar(255)", notNull: true },
    email: { type: "varchar(255)", notNull: true, unique: true },
    password_hash: { type: "varchar(255)", notNull: true },
    role: { type: "varchar(50)", default: "user" },
    avatar_url: { type: "text" },
    created_at: {
      type: "timestamptz",
      default: pgm.func("current_timestamp"),
    },
    updated_at: {
      type: "timestamptz",
      default: pgm.func("current_timestamp"),
    },
  });

  // 2. Projects Table
  pgm.createTable("projects", {
    id: { type: "serial", primaryKey: true },
    user_id: {
      type: "integer",
      notNull: true,
      references: '"users"',
      onDelete: "cascade",
    },
    name: { type: "varchar(255)", notNull: true },
    slug: { type: "varchar(255)", notNull: true },
    description: { type: "text" },
    slack_webhook_url: { type: "text" },
    discord_webhook_url: { type: "text" },
    email_notifications: { type: "boolean", default: true },
    created_at: {
      type: "timestamptz",
      default: pgm.func("current_timestamp"),
    },
    updated_at: {
      type: "timestamptz",
      default: pgm.func("current_timestamp"),
    },
  });

  // 3. Project Members Table (Collaboration)
  pgm.createTable("project_members", {
    id: { type: "serial", primaryKey: true },
    project_id: {
      type: "integer",
      notNull: true,
      references: '"projects"',
      onDelete: "cascade",
    },
    user_id: {
      type: "integer",
      notNull: true,
      references: '"users"',
      onDelete: "cascade",
    },
    role: { type: "varchar(50)", default: "member" }, // 'admin', 'member', 'viewer'
    created_at: {
      type: "timestamptz",
      default: pgm.func("current_timestamp"),
    },
  });
  pgm.addConstraint("project_members", "unique_project_user", {
    unique: ["project_id", "user_id"],
  });

  // 4. Enhance Services Table with Multi-Tenant & Advanced Monitor fields
  pgm.addColumns("services", {
    project_id: {
      type: "integer",
      references: '"projects"',
      onDelete: "cascade",
    },
    user_id: {
      type: "integer",
      references: '"users"',
      onDelete: "set null",
    },
    monitor_type: {
      type: "varchar(50)",
      default: "external_url", // 'external_url', 'api_endpoint', 'infrastructure'
    },
    http_method: {
      type: "varchar(10)",
      default: "GET",
    },
    expected_status_code: {
      type: "integer",
      default: 200,
    },
    check_interval_seconds: {
      type: "integer",
      default: 30, // 30s, 60s, 300s
    },
    timeout_ms: {
      type: "integer",
      default: 5000,
    },
    request_body: {
      type: "text",
    },
    custom_headers: {
      type: "jsonb",
      default: "{}",
    },
    ssl_check_enabled: {
      type: "boolean",
      default: true,
    },
    ssl_expires_at: {
      type: "timestamptz",
    },
    last_checked_at: {
      type: "timestamptz",
    },
    uptime_percentage: {
      type: "numeric(5,2)",
      default: 100.00,
    },
    total_checks: {
      type: "integer",
      default: 0,
    },
    successful_checks: {
      type: "integer",
      default: 0,
    },
  });

  // 5. User-Defined Alert Rules Table
  pgm.createTable("alert_rules", {
    id: { type: "serial", primaryKey: true },
    project_id: {
      type: "integer",
      notNull: true,
      references: '"projects"',
      onDelete: "cascade",
    },
    service_id: {
      type: "integer",
      references: '"services"',
      onDelete: "cascade",
    },
    name: { type: "varchar(255)", notNull: true },
    metric_type: { type: "varchar(50)", notNull: true }, // 'availability', 'latency', 'status_code'
    operator: { type: "varchar(10)", notNull: true }, // '>', '<', '!=', '='
    threshold_value: { type: "numeric", notNull: true },
    duration_seconds: { type: "integer", default: 60 },
    severity: { type: "varchar(50)", default: "warning" }, // 'critical', 'warning', 'info'
    notification_channel: { type: "varchar(50)", default: "slack" },
    is_active: { type: "boolean", default: true },
    created_at: {
      type: "timestamptz",
      default: pgm.func("current_timestamp"),
    },
  });

  // 6. Link Incidents and Deployments to Projects
  pgm.addColumns("incidents", {
    project_id: {
      type: "integer",
      references: '"projects"',
      onDelete: "cascade",
    },
  });

  pgm.addColumns("deployments", {
    project_id: {
      type: "integer",
      references: '"projects"',
      onDelete: "cascade",
    },
  });
};

exports.down = (pgm) => {
  pgm.dropColumns("deployments", ["project_id"]);
  pgm.dropColumns("incidents", ["project_id"]);
  pgm.dropTable("alert_rules");
  pgm.dropColumns("services", [
    "project_id",
    "user_id",
    "monitor_type",
    "http_method",
    "expected_status_code",
    "check_interval_seconds",
    "timeout_ms",
    "request_body",
    "custom_headers",
    "ssl_check_enabled",
    "ssl_expires_at",
    "last_checked_at",
    "uptime_percentage",
    "total_checks",
    "successful_checks",
  ]);
  pgm.dropTable("project_members");
  pgm.dropTable("projects");
  pgm.dropTable("users");
};
