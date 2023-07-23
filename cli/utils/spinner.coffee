import ora from 'ora'
import { isatty } from 'tty'

spinner = (cb) => spinner.named '', cb
export default spinner

spinner.named = (label, cb) =>
  if isatty
    inst = ora(label).start()
    try
      result = await cb inst
      inst.succeed()
      return result
    catch error
      inst.fail()
      throw error
  else
    return await cb null
