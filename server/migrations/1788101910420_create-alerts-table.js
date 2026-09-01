export const up = (pgm) => {
  pgm.createTable("alerts", {
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
      default: "critical",
    },

    status: {
      type: "text",
      default: "active",
    },

    acknowledged: {
      type: "boolean",
      default: false,
    },

    created_at: {
      type: "timestamp",
      default: pgm.func("current_timestamp"),
    },
  });
};

export const down = (pgm) => {
  pgm.dropTable("alerts");
};