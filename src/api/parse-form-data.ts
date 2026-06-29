// api/parse-form-data.ts
// Public re-export of the pure serializer. Lets consumers call the same
// parser the controller uses without instantiating a FormController.

export { parseFormData } from '../core/serialize'
