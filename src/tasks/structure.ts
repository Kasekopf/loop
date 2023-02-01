import { Quest as BaseQuest, Task as BaseTask, Limit } from "grimoire-kolmafia";
import { myDaycount } from "kolmafia";

export type Task = BaseTask & {
  tracking?: string;
  limit: Limit;
};
export type Quest = BaseQuest<Task>;

export function ascended(): boolean {
  return myDaycount() === 1;
}
