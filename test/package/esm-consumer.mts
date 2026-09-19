import Forms, { newForm } from '@samline/forms/browser'
import type { FormDataPrimitive, FormFieldWatcher } from '@samline/forms'

const primitive: FormDataPrimitive = 'value'
const watcher: FormFieldWatcher = () => undefined

void Forms.available
void newForm
void primitive
void watcher
