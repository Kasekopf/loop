import {
  buy,
  cliExecute,
  drink,
  fullnessLimit,
  getWorkshed,
  haveEffect,
  inebrietyLimit,
  myAdventures,
  myClass,
  myDaycount,
  myFamiliar,
  myFullness,
  myInebriety,
  myLevel,
  myPath,
  mySpleenUse,
  myStorageMeat,
  myTurncount,
  print,
  runChoice,
  spleenLimit,
  storageAmount,
  use,
  useSkill,
  visitUrl,
} from "kolmafia";
import {
  $class,
  $effect,
  $effects,
  $familiar,
  $item,
  $items,
  $location,
  $monster,
  $skill,
  ascend,
  get,
  have,
  haveInCampground,
  Lifestyle,
  Macro,
  Paths,
  prepareAscension,
  uneffect,
} from "libram";
import {
  Args,
  Task as BaseTask,
  CombatStrategy,
  Engine,
  getTasks,
  Quest,
  step,
} from "grimoire-kolmafia";
import { drive } from "libram/dist/resources/2017/AsdonMartin";

enum Leg {
  Aftercore = 0,
  GreyYou = 1,
  Casual = 2,
}

function getCurrentLeg(): number {
  if (myDaycount() > 1) return Leg.Aftercore;
  if (myPath() === "Grey You" || get("gooseReprocessed") !== "") return Leg.GreyYou;
  return Leg.Casual;
}

function canEat(): boolean {
  return (
    myFullness() < fullnessLimit() ||
    mySpleenUse() < spleenLimit() ||
    myInebriety() < inebrietyLimit() ||
    get("currentMojoFilters") < 3
  );
}

type Required<T, K extends keyof T> = T & { [P in K]-?: T[P] };
type WithRequired<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>> & Required<T, K>;
type Task = WithRequired<BaseTask, "limit">;

function stooperDrunk() {
  return (
    myInebriety() > inebrietyLimit() ||
    (myInebriety() === inebrietyLimit() && myFamiliar() === $familiar`Stooper`)
  );
}
function garboAscend(after: string[]): Task[] {
  return [
    {
      name: "Garbo",
      after: after,
      completed: () => (myAdventures() === 0 && !canEat()) || stooperDrunk(),
      do: () => {
        if (have($item`can of Rain-Doh`) && !have($item`Rain-Doh blue balls`))
          use($item`can of Rain-Doh`);
        cliExecute("garbo ascend");
      },
      limit: { tries: 1 },
    },
    {
      name: "Stooper",
      after: [...after, "Garbo"],
      do: () => cliExecute(`drink Sacramento wine`),
      completed: () => stooperDrunk(),
      outfit: { equip: $items`mafia pinky ring`, familiar: $familiar`Stooper` },
      effects: $effects`Ode to Booze`,
      limit: { tries: 1 },
    },
    {
      name: "Caldera",
      after: [...after, "Stooper"],
      acquire: [{ item: $item`heat-resistant sheet metal`, price: 5000, optional: true }],
      prepare: () => useSkill($skill`Cannelloni Cocoon`),
      do: $location`The Bubblin' Caldera`,
      completed: () =>
        $location`The Bubblin' Caldera`.turnsSpent >= 7 ||
        $location`The Bubblin' Caldera`.noncombatQueue.includes("Lava Dogs"),
      combat: new CombatStrategy().macro(new Macro().attack().repeat()),
      outfit: { modifier: "muscle", familiar: $familiar`Stooper` },
      limit: { tries: 10 }, // Clear intro adventure
    },
    {
      name: "Overdrink",
      after: [...after, "Stooper"],
      do: () => drink($item`Schrödinger's thermos`),
      completed: () => myInebriety() > inebrietyLimit(),
      effects: $effects`Ode to Booze`,
      limit: { tries: 1 },
    },
    {
      name: "Overdrunk",
      after: [...after, "Overdrink"],
      prepare: () => uneffect($effect`Drenched in Lava`),
      completed: () => myAdventures() === 0 && myInebriety() > inebrietyLimit(),
      do: () => cliExecute("garbo"),
      limit: { tries: 1 },
    },
  ];
}

const AftercoreQuest: Quest<Task> = {
  name: "Aftercore",
  completed: () => getCurrentLeg() > Leg.Aftercore,
  tasks: [...garboAscend([])],
};

const GyouQuest: Quest<Task> = {
  name: "Grey You",
  completed: () => getCurrentLeg() > Leg.GreyYou,
  tasks: [
    {
      name: "Ascend",
      completed: () => getCurrentLeg() >= Leg.GreyYou,
      after: ["Aftercore/Overdrunk"],
      do: () => {
        prepareAscension({
          eudora: "Our Daily Candles™ order form",
        });
        ascend(
          Paths.GreyYou,
          // eslint-disable-next-line libram/verify-constants
          $class`Grey Goo`,
          Lifestyle.softcore,
          "vole",
          $item`astral six-pack`,
          $item`astral mask`
        );
        if (visitUrl("main.php").includes("somewhat-human-shaped mass of grey goo nanites"))
          runChoice(-1);
      },
      limit: { tries: 1 },
    },
    {
      name: "Run",
      after: ["Ascend"],
      completed: () => step("questL13Final") !== -1,
      do: () => cliExecute("loopgyou delaytower pulls=19"),
      limit: { tries: 1 },
    },
    {
      name: "Hotres",
      after: ["Ascend", "Run"],
      acquire: [
        { item: $item`yellow rocket`, useful: () => !have($effect`Everything Looks Yellow`) },
      ],
      completed: () => have($item`heat-resistant gloves`) && have($item`lava-proof pants`),
      do: $location`LavaCo™ Lamp Factory`,
      combat: new CombatStrategy()
        .macro(
          () =>
            new Macro().externalIf(
              !have($effect`Everything Looks Yellow`),
              new Macro().item($item`yellow rocket`),
              new Macro().skill($skill`Double Nanovision`).repeat()
            ),
          [$monster`factory worker (male)`, $monster`factory worker (female)`]
        )
        .macro(new Macro().skill($skill`Infinite Loop`).repeat()),
      outfit: () => {
        if (!have($effect`Everything Looks Yellow`)) return {};
        else return { modifier: "item" };
      },
      limit: { soft: 10 },
    },
    {
      name: "Drill",
      after: ["Ascend", "Run"],
      completed: () => have($item`high-temperature mining drill`),
      do: () => cliExecute("pull high-temperature mining drill"),
      limit: { tries: 1 },
    },
    {
      name: "Volcano Initial",
      after: ["Ascend", "Hotres", "Drill"],
      completed: () => myTurncount() >= 1000,
      do: () => cliExecute(`minevolcano ${1000 - myTurncount()}`),
      limit: { tries: 2 },
    },
    {
      name: "Pull All",
      after: ["Ascend", "Volcano Initial"],
      completed: () => myStorageMeat() === 0 && storageAmount($item`festive warbear bank`) === 0, // arbitrary item,
      do: () => {
        cliExecute("pull all");
        cliExecute("refresh all");
      },
      limit: { tries: 1 },
    },
    {
      name: "Tower",
      after: ["Ascend", "Pull All", "Volcano Initial"],
      completed: () => step("questL13Final") > 11,
      do: () => cliExecute("loopgyou delaytower"),
      limit: { tries: 1 },
    },
    {
      name: "Volcano Final",
      after: ["Ascend", "Hotres", "Drill", "Tower"],
      // eslint-disable-next-line libram/verify-constants
      completed: () => myAdventures() <= 40 || myClass() !== $class`Grey Goo`,
      do: () => cliExecute(`minevolcano ${myAdventures() - 40}`),
      limit: { tries: 2 },
    },
    {
      name: "Prism",
      after: ["Ascend", "Volcano Final"],
      // eslint-disable-next-line libram/verify-constants
      completed: () => myClass() !== $class`Grey Goo`,
      do: () => cliExecute("loopgyou class=1"),
      limit: { tries: 1 },
    },
    {
      name: "Level",
      after: ["Ascend", "Prism", "Pull All"],
      // eslint-disable-next-line libram/verify-constants
      completed: () => myClass() !== $class`Grey Goo` && myLevel() >= 13,
      do: () => cliExecute("loopcasual goal=level"),
      limit: { tries: 1 },
    },
    ...garboAscend(["Ascend", "Prism", "Pull All", "Level"]),
  ],
};

const CasualQuest: Quest<Task> = {
  name: "Casual",
  tasks: [
    {
      name: "Ascend",
      completed: () => getCurrentLeg() >= Leg.Casual,
      after: ["Grey You/Overdrunk"],
      do: () => {
        prepareAscension({
          workshed: "Asdon Martin keyfob",
          garden: "packet of thanksgarden seeds",
          eudora: "GameInformPowerDailyPro subscription card",
          chateau: {
            desk: "continental juice bar",
            nightstand: "electric muscle stimulator",
            ceiling: "ceiling fan",
          },
        });

        ascend(
          Paths.Unrestricted,
          $class`Seal Clubber`,
          Lifestyle.casual,
          "knoll",
          $item`astral six-pack`,
          $item`astral pet sweater`
        );
      },
      limit: { tries: 1 },
    },
    {
      name: "Run",
      after: ["Ascend"],
      completed: () => step("questL13Final") > 11,
      do: () => cliExecute("loopcasual"),
      limit: { tries: 1 },
    },
    {
      name: "Workshed",
      after: ["Ascend", "Run"],
      completed: () => getWorkshed() !== $item`Asdon Martin keyfob` || get("_workshedItemUsed"),
      do: () => {
        if (haveEffect($effect`Driving Observantly`) < 900)
          drive($effect`Driving Observantly`, 900 - haveEffect($effect`Driving Observantly`));
        use($item`cold medicine cabinet`);
      },
      limit: { tries: 1 },
    },
    {
      name: "Garbo",
      after: ["Ascend", "Run", "Workshed"],
      completed: () => (myAdventures() === 0 && !canEat()) || myInebriety() > inebrietyLimit(),
      do: () => {
        if (have($item`can of Rain-Doh`) && !have($item`Rain-Doh blue balls`))
          use($item`can of Rain-Doh`);
        cliExecute("garbo");
      },
      limit: { tries: 1 },
    },
    {
      name: "Nightcap",
      after: ["Ascend", "Run", "Garbo"],
      completed: () => myInebriety() > inebrietyLimit(),
      do: () => cliExecute("CONSUME NIGHTCAP"),
      limit: { tries: 1 },
    },
    {
      name: "Sleep",
      completed: () => haveInCampground($item`clockwork maid`),
      after: ["Ascend", "Nightcap"],
      do: () => {
        if (!haveInCampground($item`clockwork maid`)) {
          if (!have($item`clockwork maid`)) buy(1, $item`clockwork maid`, 48000);
          use($item`clockwork maid`);
        }
      },
      outfit: { modifier: "adv", familiar: $familiar`Trick-or-Treating Tot` },
      limit: { tries: 1 },
    },
  ],
};

export const args = Args.create("loop", "A script for a full loop.", {
  actions: Args.number({
    help: "Maximum number of actions to perform, if given. Can be used to execute just a few steps at a time.",
  }),
});
export function main(command?: string): void {
  Args.fill(args, command);
  if (args.help) {
    Args.showHelp(args);
    return;
  }

  const tasks = getTasks([AftercoreQuest, GyouQuest, CasualQuest]);
  const engine = new Engine<never, Task>(tasks);
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
}
