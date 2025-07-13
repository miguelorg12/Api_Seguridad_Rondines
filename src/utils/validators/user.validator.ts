import { body } from "express-validator";

export const createUserValidator = [
  body("name").notEmpty().withMessage("El nombre es obligatorio"),
  body("last_name").notEmpty().withMessage("El apellido es obligatorio"),
  body("curp").isLength({ min: 18, max: 18 }).withMessage("La CURP debe tener 18 caracteres"),
  body("email").isEmail().withMessage("Email inválido"),
  body("password").isLength({ min: 8 }).withMessage("La contraseña debe tener al menos 8 caracteres"),
  body("role_id").isInt().withMessage("El rol debe ser un número"),
  body("active").isBoolean().withMessage("El campo active debe ser booleano"),
  body("biometric").optional().isString().withMessage("El campo biometric debe ser una cadena de texto")
];