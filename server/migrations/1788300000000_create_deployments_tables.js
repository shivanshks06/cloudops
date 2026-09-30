exports.up = (pgm) => {
  pgm.createTable("deployments", {
    id: "id",
    service_id: {
      type: "integer",
      notNull: true,
      references: "services",
      onDelete: "CASCADE",
    },
    version: {
      type: "varchar(50)",
      notNull: true,
    },
    commit_sha: {
      type: "varchar(40)",
    },
    commit_message: {
      type: "text",
    },
    branch: {
      type: "varchar(100)",
      default: "main",
    },
    author: {
      type: "varchar(100)",
      default: "CI/CD Pipeline",
    },
    status: {
      type: "varchar(30)",
      notNull: true,
      default: "QUEUED",
    },
    environment: {
      type: "varchar(50)",
      notNull: true,
      default: "development",
    },
    started_at: {
      type: "timestamp",
      default: pgm.func("current_timestamp"),
    },
    completed_at: {
      type: "timestamp",
    },
    duration_seconds: {
      type: "integer",
    },
    jenkins_build: {
      type: "varchar(50)",
    },
    jenkins_build_url: {
      type: "text",
    },
    docker_image: {
      type: "varchar(255)",
    },
    deployment_type: {
      type: "varchar(30)",
      default: "DEPLOYMENT",
    },
    rollback_from_version: {
      type: "varchar(50)",
    },
    created_at: {
      type: "timestamp",
      default: pgm.func("current_timestamp"),
    },
  });

  pgm.createIndex("deployments", "service_id");
  pgm.createIndex("deployments", "status");
  pgm.createIndex("deployments", "environment");
  pgm.createIndex("deployments", "started_at");

  pgm.createTable("deployment_events", {
    id: "id",
    deployment_id: {
      type: "integer",
      notNull: true,
      references: "deployments",
      onDelete: "CASCADE",
    },
    event_type: {
      type: "varchar(50)",
      notNull: true,
    },
    message: {
      type: "text",
      notNull: true,
    },
    metadata: {
      type: "jsonb",
      default: "{}",
    },
    created_at: {
      type: "timestamp",
      default: pgm.func("current_timestamp"),
    },
  });

  pgm.createIndex("deployment_events", "deployment_id");
};

exports.down = (pgm) => {
  pgm.dropTable("deployment_events");
  pgm.dropTable("deployments");
};
