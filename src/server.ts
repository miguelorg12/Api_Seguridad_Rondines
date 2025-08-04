import "reflect-metadata";

// Configurar module-alias con manejo de errores
try {
  require("module-alias/register");
  console.log("✅ module-alias configurado correctamente");
} catch (error) {
  console.error("❌ Error configurando module-alias:", error);
  console.error(
    "❌ Verificar que module-alias esté instalado: npm install module-alias"
  );
  process.exit(1);
}

// Cargar el archivo de entorno correcto según NODE_ENV
const envFile =
  process.env.NODE_ENV === "production"
    ? ".env.production"
    : process.env.NODE_ENV === "qa"
    ? ".env.qa"
    : ".env";

import { config } from "dotenv";
config({ path: envFile });

// Verificar variables de entorno críticas
console.log("🔍 Verificando variables de entorno:");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log(
  "SESSION_SECRET:",
  process.env.SESSION_SECRET ? "definido" : "no definido"
);
console.log("JWT_SECRET:", process.env.JWT_SECRET ? "definido" : "no definido");

try {
  import("./app")
    .then(({ default: app }) => {
      import("./configs/data-source")
        .then(({ AppDataSource }) => {
          const PORT = process.env.PORT || 3000;

          AppDataSource.initialize()
            .then(() => {
              console.log(
                `Data Source has been initialized for ${
                  process.env.NODE_ENV || "development"
                } environment!`
              );
            })
            .catch((err) => {
              console.error("Error during Data Source initialization:", err);
            });

          app.listen(PORT, () => {
            console.log(
              `Server is running on port ${PORT} in ${
                process.env.NODE_ENV || "development"
              } mode`
            );
          });
        })
        .catch((error) => {
          console.error("❌ Error importando data-source:", error);
          process.exit(1);
        });
    })
    .catch((error) => {
      console.error("❌ Error importando app:", error);
      process.exit(1);
    });
} catch (error) {
  console.error("❌ Error crítico en el servidor:", error);
  process.exit(1);
}
