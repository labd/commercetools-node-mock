import path from 'path'
import Ajv from 'ajv/dist/2020'
import addFormats from 'ajv-formats'
import standaloneCode from "ajv/dist/standalone"

import fs from 'fs'

const ajv = new Ajv({
  code: { source: true, esm: true },
  strict: 'log',
  allowMatchingProperties: true,
  allowUnionTypes: true,
  discriminator: true,
})
addFormats(ajv)

const modules = []

const files = fs.readdirSync('./json-schemas')
files.forEach(file => {
  const schema = require(`./json-schemas/${file}`)
  const [name] = file.split('.', 1)
  console.log(file)
  ajv.addSchema(schema, name + 'Schema')
})


let moduleCode = standaloneCode(ajv)
fs.writeFileSync(path.join(__dirname, 'src/validate.js'), moduleCode)
