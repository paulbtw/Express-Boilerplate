export = {
  type: "postgres",
  url: process.env.DB_URL,
  synchronize: true,
  entities: ["src/entities/User.ts"],
};
