import fs from 'node:fs/promises';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

export async function loadMapThemeSchemas(schemaDirectory) {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const files = (await fs.readdir(schemaDirectory))
    .filter((file) => file.endsWith('.schema.json'))
    .sort();
  const schemas = [];
  for (const file of files) {
    const schema = JSON.parse(await fs.readFile(path.join(schemaDirectory, file), 'utf8'));
    if (!schema.$id) throw new Error(`Schema has no $id: ${file}`);
    schemas.push({ file, schema });
    ajv.addSchema(schema, file);
  }
  return { ajv, schemas };
}

export function validateOrThrow(ajv, schemaId, value) {
  const validate = ajv.getSchema(schemaId);
  if (!validate) throw new Error(`Unknown schema: ${schemaId}`);
  if (!validate(value)) {
    throw new Error(`Schema validation failed: ${ajv.errorsText(validate.errors)}`);
  }
  return value;
}
