export const up = (pgm) => {
  pgm.addColumn("services", {
    response_time: {
      type: "integer",
    },
  });
};

export const down = (pgm) => {
  pgm.dropColumn("services", "response_time");
};