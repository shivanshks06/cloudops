exports.up = (pgm) => {
    pgm.createTable("services", {
        id: {
            type: "serial",
            primaryKey: true,
        },

        name: {
            type: "varchar(100)",
            notNull: true,
        },

        description: {
            type: "text",
        },

        environment: {
            type: "varchar(50)",
            notNull: true,
            default: "development",
        },

        endpoint_url: {
            type: "text",
        },

        status: {
            type: "varchar(30)",
            notNull: true,
            default: "unknown",
        },

        created_at: {
            type: "timestamp",
            default: pgm.func("CURRENT_TIMESTAMP"),
        },

        updated_at: {
            type: "timestamp",
            default: pgm.func("CURRENT_TIMESTAMP"),
        },
    });
};

exports.down = (pgm) => {
    pgm.dropTable("services");
};