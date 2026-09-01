export const up = (pgm) => {
  pgm.createTable("incidents", {
    id: "id",

    service_id: {
      type: "integer",
      notNull: true,
      references: "services",
      onDelete: "CASCADE",
    },

    title: {
      type: "text",
      notNull: true,
    },

    severity: {
      type: "text",
      notNull: true,
      default: "critical",
    },

    status: {
      type: "text",
      notNull: true,
      default: "open",
    },

    started_at: {
      type: "timestamp",
      default: pgm.func("current_timestamp"),
    },

    resolved_at: {
      type: "timestamp",
    },

    mttr_seconds: {
      type: "integer",
    },
  });
};

export const down = (pgm) => {
  pgm.dropTable("incidents");
};