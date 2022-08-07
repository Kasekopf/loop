import { print } from "kolmafia";
import { Engine } from "grimoire-kolmafia";
import { getCurrentLeg, Task } from "../tasks/structure";
import { ProfitRecord, ProfitTracker, Records } from "./profits";

export class ProfitTrackingEngine extends Engine<never, Task> {
  profits: ProfitTracker;
  constructor(tasks: Task[], key: string) {
    super(tasks);
    this.profits = new ProfitTracker(key);
  }

  execute(task: Task): void {
    try {
      super.execute(task);
    } finally {
      this.profits.record(`${getCurrentLeg()}@${task.tracking ?? "Misc"}`);
    }
  }

  destruct(): void {
    super.destruct();
    this.profits.save();
  }
}

function sum(record: Records, where: (key: string) => boolean): ProfitRecord {
  const included: ProfitRecord[] = [];
  for (const key in record) {
    if (where(key)) included.push(record[key]);
  }
  return {
    meat: included.reduce((v, p) => v + p.meat, 0),
    items: included.reduce((v, p) => v + p.items, 0),
    turns: included.reduce((v, p) => v + p.turns, 0),
    hours: included.reduce((v, p) => v + p.hours, 0),
  };
}

function numberWithCommas(x: number): string {
  const str = x.toString();
  if (str.includes(".")) return x.toFixed(2);
  return str.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function printProfitSegment(key: string, record: ProfitRecord, color: string) {
  if (record === undefined) return;
  print(
    `${key}: ${numberWithCommas(record.meat)} meat + ${numberWithCommas(
      record.items
    )} items (${numberWithCommas(record.turns)} turns + ${numberWithCommas(record.hours)} hours)`,
    color
  );
}

export function printProfits(records: Records): void {
  print("");
  print("== Daily Loop Profit ==");
  printProfitSegment(
    "Aftercore",
    sum(records, (key) => key.startsWith("0")),
    "blue"
  );
  printProfitSegment("* Garbo", records["0@Garbo"], "green");
  printProfitSegment("* Other", records["0@Misc"], "green");
  printProfitSegment(
    "Grey You",
    sum(records, (key) => key.startsWith("1")),
    "blue"
  );
  printProfitSegment("* Run", records["1@Run"], "green");
  printProfitSegment("* GooFarming", records["1@Goo Farming"], "green");
  printProfitSegment("* Garbo", records["1@Garbo"], "green");
  printProfitSegment("* Other", records["1@Misc"], "green");
  printProfitSegment(
    "Casual",
    sum(records, (key) => key.startsWith("2")),
    "blue"
  );
  printProfitSegment("* Run", records["2@Run"], "green");
  printProfitSegment("* Garbo", records["2@Garbo"], "green");
  printProfitSegment("* Other", records["2@Misc"], "green");
  printProfitSegment(
    "Total",
    sum(records, () => true),
    "black"
  );
}
