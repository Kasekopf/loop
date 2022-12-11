import { Engine } from "grimoire-kolmafia";
import { PropertiesManager } from "libram";
import { getCurrentLeg, Task } from "../tasks/structure";
import { printProfits, ProfitTracker } from "./profits";

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
      this.profits.record(`${getCurrentLeg()}@${task.tracking ?? "Other"}`);
    }
  }

  destruct(): void {
    super.destruct();
    this.profits.save();
    printProfits(this.profits.all());
  }

  initPropertiesManager(manager: PropertiesManager): void {
    super.initPropertiesManager(manager);
    manager.setChoices({
      1106: 3, // Ghost Dog Chow
      1107: 1, // tennis ball
      1340: 3, // Is There A Doctor In The House?
      1341: 1, // Cure her poison
      // June cleaver noncombats
      1467: 1,
      1468: 1,
      1469: 2,
      1470: 2,
      1471: 1,
      1472: 2,
      1473: 2,
      1474: 2,
      1475: 1,
    });
  }
}
