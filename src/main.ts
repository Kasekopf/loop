import { Item, print } from "kolmafia";
import { $item } from "libram";
import { Args, getTasks } from "grimoire-kolmafia";
import { AftercoreQuest } from "./tasks/aftercore";
import { GyouQuest } from "./tasks/greyyou";
import { CasualQuest } from "./tasks/casual";
import { printProfits, ProfitTrackingEngine } from "./engine/engine";

export const args = Args.create("loop", "A script for a full loop.", {
  actions: Args.number({
    help: "Maximum number of actions to perform, if given. Can be used to execute just a few steps at a time.",
  }),
  duplicate: Args.custom(
    { help: "Item to duplicate in the Deep Machine Tunnels.", default: $item`very fancy whiskey` },
    Item.get,
    "ITEM"
  ),
});
export function main(command?: string): void {
  Args.fill(args, command);
  if (args.help) {
    Args.showHelp(args);
    return;
  }

  const tasks = getTasks([AftercoreQuest, GyouQuest, CasualQuest]);
  const engine = new ProfitTrackingEngine(tasks, "loop_profit_tracker");
  try {
    engine.run(args.actions);

    // Print the next task that will be executed, if it exists
    const task = engine.getNextTask();
    if (task) {
      print(`Next: ${task.name}`, "blue");
    }

    // If the engine ran to completion, all tasks should be complete.
    // Print any tasks that are not complete.
    if (args.actions === undefined) {
      const uncompletedTasks = engine.tasks.filter((t) => !t.completed());
      if (uncompletedTasks.length > 0) {
        print("Uncompleted Tasks:");
        for (const t of uncompletedTasks) {
          print(t.name);
        }
      }
    }
  } finally {
    engine.destruct();
  }

  printProfits(engine.profits.all());
}
