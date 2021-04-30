import path from 'path'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import standaloneCode from 'ajv/dist/standalone'

import fs from 'fs'

const ajv = new Ajv({
  code: { source: true },
  strict: 'log',
  discriminator: true,
})
addFormats(ajv)

const modules = []

const files = fs.readdirSync('./src/json-schemas')
files.forEach(file => {
  const schema = require(`./src/json-schemas/${file}`)
  const [name] = file.split('.', 1)
  ajv.addSchema(schema, name + 'Schema')
})

ajv.getSchema("FieldTypeSchema")

// let moduleCode = standaloneCode(ajv)
// fs.writeFileSync(path.join(__dirname, 'src/validate.js'), moduleCode)
