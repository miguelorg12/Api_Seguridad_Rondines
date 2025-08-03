import "reflect-metadata";

// Configurar module-alias según el entorno
const isCompiled = __dirname.includes("dist");
if (isCompiled) {
  // En producción, configurar los alias directamente
  const moduleAlias = require("module-alias");
  const path = require("path");

  moduleAlias.addAliases({
    "@controllers": path.join(__dirname, "controllers"),
    "@interfaces": path.join(__dirname, "interfaces"),
    "@services": path.join(__dirname, "services"),
    "@utils": path.join(__dirname, "utils"),
    "@configs": path.join(__dirname, "configs"),
    "@routes": path.join(__dirname, "routes"),
    "@validators": path.join(__dirname, "utils/validators"),
    "@entities": path.join(__dirname, "interfaces/entity"),
    "@dto": path.join(__dirname, "interfaces/dto"),
  });
} else {
  // En desarrollo, usar la configuración normal
  require("module-alias/register");
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

import app from "./app";
import { AppDataSource } from "./configs/data-source";

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
