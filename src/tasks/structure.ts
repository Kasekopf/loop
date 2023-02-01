import { Quest as BaseQuest, Task as BaseTask, Limit } from "grimoire-kolmafia";
import { myClass, myDaycount } from "kolmafia";
import { $class, get } from "libram";

export type Task = BaseTask & {
  tracking?: string;
  limit: Limit;
};
export type Quest = BaseQuest<Task>;

export enum Leg {
  Aftercore = 0,
  GreyYou = 1,
  Casual = 2,
}

export function getCurrentLeg(): number {
  if (myDaycount() > 1) return Leg.Aftercore;
  if (myClass() === $class`Grey Goo` || get("gooseReprocessed") !== "") return Leg.GreyYou;
  return Leg.Casual;
}
