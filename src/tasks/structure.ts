import { Quest as BaseQuest, Task as BaseTask, Limit } from "grimoire-kolmafia";
import { holiday, myDaycount } from "kolmafia";
import { args } from "../main";

export type Task = BaseTask & {
  tracking?: string;
  limit: Limit;
};
export type Quest = BaseQuest<Task>;

export function ascended(): boolean {
  return myDaycount() === 1;
}

export function isHalloween(): boolean {
  return holiday() === "Halloween" && !args.skipholiday;
}
