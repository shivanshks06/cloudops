exports.up = (pgm) => {
  pgm.addColumns("incidents", {
    alert_name: { type: "varchar(255)" },
    summary: { type: "text" },
    description: { type: "text" },
    fingerprint: { type: "varchar(255)" },
    acknowledged_at: { type: "timestamp" },
    acknowledged_by: { type: "varchar(100)" },
  });

  pgm.createIndex("incidents", "fingerprint");
  pgm.createIndex("incidents", ["service_id", "status"]);

  pgm.createTable("incident_events", {
    id: "id",
    incident_id: {
      type: "integer",
      notNull: true,
      references: "incidents",
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

  pgm.createIndex("incident_events", "incident_id");
};

exports.down = (pgm) => {
  pgm.dropTable("incident_events");
  pgm.dropColumns("incidents", [
    "alert_name",
    "summary",
    "description",
    "fingerprint",
    "acknowledged_at",
    "acknowledged_by",
  ]);
};
