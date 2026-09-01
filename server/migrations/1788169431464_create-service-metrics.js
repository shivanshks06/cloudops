export const up = (pgm) => {
  pgm.createTable("service_metrics", {
    id: "id",

    service_id: {
      type: "integer",
      notNull: true,
      references: "services",
      onDelete: "CASCADE",
    },

    response_time: {
      type: "integer",
    },

    status: {
      type: "text",
      notNull: true,
    },

    checked_at: {
      type: "timestamp",
      default: pgm.func("current_timestamp"),
    },
  });
};

export const down = (pgm) => {
  pgm.dropTable("service_metrics");
};