import { Event } from './events.js'

const tasks: string[] = [];

type Fn<Args extends any[] = any[], R = any> = (...args: Args) => R;
type TasksUpdateType = 'create' | 'success' | 'fail';
type TaskDecorator<Args extends any[], R> = (method: Fn<Args, Promise<R>>, ctx: ClassMethodDecoratorContext) => Fn<Args, Promise<R>>;

/** Decorate a function or method to wrap its contents into a task. */
export function task<Args extends any[], R>(name: string): TaskDecorator<Args, R>;
/** Push a task to the chain of tasks. It is automatically popped when the promise resolves or rejects, returning its result. */
export function task<R>(name: string, cb: () => Promise<R>): Promise<R>;
export function task(name: string, cb?: () => Promise<any>) {
  if (!cb) {
    // decorator factory
    return function(method: Fn, ctx: ClassMethodDecoratorContext) {
      // replacement method
      return function(this: any, ...args: any[]) {
        const n = name
          .replace(/(?<!\$)\$(\d+)/g, (_, i) => args[Number(i) - 1])
          .replace(/\$\$/g, '$');
        return task(n, () => method.apply(this, args));
      }
    };
  }
  else {
    tasks.push(name);
    onTaskPush.emit({ task: name });
    onTasksUpdate.emit({ tasks, type: 'create' });
    return cb()
      .then((value: any) => {
        tasks.pop();
        onTaskPop.emit({ task: name });
        onTasksUpdate.emit({ tasks, type: 'success' });
        return value;
      })
      .catch((error: any) => {
        tasks.pop();
        onTaskPop.emit({ task: name, error });
        onTasksUpdate.emit({ tasks, type: 'fail' });
        throw error;
      })
  }
}

export const onTasksUpdate = Event<{ tasks: string[], type: TasksUpdateType }>()
export const onTaskPush    = Event<{ task: string }>();
export const onTaskPop     = Event<{ task: string, error?: any }>();
