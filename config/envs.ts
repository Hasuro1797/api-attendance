import 'dotenv/config';
import * as joi from 'joi';

interface EnvVars {
  DATABASE_URL: string;
  JWT_SECRET: string;
}

const envsSchema = joi
  .object({
    DATABASE_URL: joi.string().required(),
    JWT_SECRET: joi.string().required(),
  })
  .unknown(true);
const { error, value } = envsSchema.validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

const envVars: EnvVars = value;

export const envs = {
  databaseUrl: envVars.DATABASE_URL,
  jwtSecret: envVars.JWT_SECRET,
};
