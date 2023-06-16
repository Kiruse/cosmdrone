import ora from 'ora'

spinner = (cb) => spinner.named '', cb
export default spinner

spinner.named = (label, cb) =>
  inst = ora(label).start()
  try
    result = await cb inst
    inst.succeed()
    return result
  catch error
    inst.fail()
    throw error
