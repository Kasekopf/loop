import { CombatStrategy, step } from "grimoire-kolmafia";
import {
  autosell,
  buy,
  buyUsingStorage,
  cliExecute,
  descToItem,
  getFuel,
  getWorkshed,
  hippyStoneBroken,
  itemAmount,
  myAdventures,
  myAscensions,
  myClass,
  myLevel,
  myStorageMeat,
  myTurncount,
  restoreMp,
  runChoice,
  storageAmount,
  toInt,
  totalTurnsPlayed,
  use,
  visitUrl,
} from "kolmafia";
import {
  $class,
  $effect,
  $effects,
  $familiar,
  $item,
  $location,
  $monster,
  $skill,
  ascend,
  AsdonMartin,
  ensureEffect,
  get,
  getKramcoWandererChance,
  have,
  Lifestyle,
  Macro,
  Pantogram,
  Paths,
  prepareAscension,
  RetroCape,
  set,
  SourceTerminal,
} from "libram";
import { getCurrentLeg, Leg, Quest, Task } from "./structure";
import { args } from "../main";
import { garboAscend, pvp } from "./aftercore";

const gear: Task[] = [
  {
    name: "Pants",
    after: [],
    completed: () => have($item`pantogram pants`),
    do: () => {
      if (step("questM05Toot") === -1) visitUrl("council.php");
      if (step("questM05Toot") === 0) visitUrl("tutorial.php?action=toot");
      if (have($item`letter from King Ralph XI`)) use($item`letter from King Ralph XI`);
      if (have($item`pork elf goodies sack`)) use($item`pork elf goodies sack`);
      if (!have($item`porquoise`)) {
        if (storageAmount($item`porquoise`) === 0) buyUsingStorage($item`porquoise`);
        cliExecute("pull 1 porquoise");
      }
      Pantogram.makePants(
        "Muscle",
        "Stench Resistance: 2",
        "Maximum MP: 20",
        "Combat Rate: 5",
        "Meat Drop: 60"
      );
      autosell($item`hamethyst`, itemAmount($item`hamethyst`));
      autosell($item`baconstone`, itemAmount($item`baconstone`));
    },
    limit: { tries: 1 },
  },
  {
    name: "Lucky Gold Ring",
    after: [],
    completed: () => have($item`lucky gold ring`),
    do: () => cliExecute("pull lucky gold ring"),
    limit: { tries: 1 },
  },
  {
    name: "Pointer Finger",
    after: [],
    completed: () => have($item`mafia pointer finger ring`),
    do: () => cliExecute("pull mafia pointer finger ring"),
    limit: { tries: 1 },
  },
  {
    name: "Asdon",
    after: [],
    completed: () =>
      have($item`Asdon Martin keyfob`) ||
      have($item`cold medicine cabinet`) ||
      storageAmount($item`Asdon Martin keyfob`) === 0,
    do: () => cliExecute("pull Asdon Martin keyfob"),
    limit: { tries: 1 },
  },
];

export const GyouQuest: Quest = {
  name: "Grey You",
  completed: () => getCurrentLeg() > Leg.GreyYou,
  tasks: [
    {
      name: "Ascend",
      completed: () => getCurrentLeg() >= Leg.GreyYou,
      after: ["Aftercore/Overdrunk", "Aftercore/Fights"],
      do: (): void => {
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
          $item`astral pistol`
        );
        if (visitUrl("main.php").includes("somewhat-human-shaped mass of grey goo nanites"))
          runChoice(-1);
      },
      limit: { tries: 1 },
    },
    ...gear,
    {
      name: "Break Stone",
      completed: () => hippyStoneBroken() || !args.pvp,
      do: (): void => {
        visitUrl("peevpee.php?action=smashstone&pwd&confirm=on", true);
        visitUrl("peevpee.php?place=fight");
      },
      limit: { tries: 1 },
    },
    {
      name: "Run",
      after: ["Ascend", "Break Stone", ...gear.map((task) => task.name)],
      completed: () =>
        step("questL13Final") !== -1 && get("gooseReprocessed").split(",").length === 73,
      do: () => cliExecute("loopgyou delaytower tune=wombat"),
      limit: { tries: 1 },
      tracking: "Run",
    },
    {
      name: "In-Run Farm Initial",
      after: ["Ascend", "Run", ...gear.map((task) => task.name)],
      completed: () => myTurncount() >= 1000,
      do: $location`Barf Mountain`,
      acquire: [{ item: $item`wad of used tape` }],
      prepare: (): void => {
        RetroCape.tuneToSkill($skill`Precision Shot`);

        if (have($item`How to Avoid Scams`)) ensureEffect($effect`How to Scam Tourists`);

        // Use only the first source terminal enhance, save the others for aftercore
        if (get("_sourceTerminalEnhanceUses") === 0) SourceTerminal.enhance($effect`meat.enh`);

        // Prepare latte
        if (
          have($item`latte lovers member's mug`) &&
          !get("latteModifier").includes("Meat Drop: 40") &&
          get("_latteRefillsUsed") < 2
        ) {
          const modifiers = [];
          if (get("latteUnlocks").includes("wing")) modifiers.push("wing");
          if (get("latteUnlocks").includes("cajun")) modifiers.push("cajun");
          modifiers.push("cinnamon", "pumpkin", "vanilla");
          cliExecute(`latte refill ${modifiers.slice(0, 3).join(" ")}`); // Always unlocked
        }

        // Swap to asdon when all extrovermectins are done
        if (
          have($item`Asdon Martin keyfob`) &&
          getWorkshed() === $item`cold medicine cabinet` &&
          get("_coldMedicineConsults") >= 5
        ) {
          use($item`Asdon Martin keyfob`);
        }

        // Prepare Asdon buff
        if (AsdonMartin.installed() && !have($effect`Driving Observantly`)) {
          if (getFuel() < 37 && itemAmount($item`wad of dough`) < 8) {
            // Get more wads of dough. We must do this ourselves since
            // retrieveItem($item`loaf of soda bread`) in libram will not
            // consider all-purpose flower.
            buy($item`all-purpose flower`);
            use($item`all-purpose flower`);
          }
          AsdonMartin.drive(AsdonMartin.Driving.Observantly);
        }
      },
      post: getExtros,
      outfit: {
        back: $item`unwrapped knock-off retro superhero cape`,
        weapon: $item`astral pistol`,
        offhand:
          getKramcoWandererChance() > 0.05
            ? $item`Kramco Sausage-o-Matic™`
            : $item`latte lovers member's mug`,
        acc1: $item`lucky gold ring`,
        acc2: $item`mafia pointer finger ring`,
        acc3: $item`mafia thumb ring`,
        familiar: $familiar`Space Jellyfish`,
        modifier: "meat",
      },
      combat: new CombatStrategy()
        .macro(
          new Macro()
            .trySkill($skill`Bowl Straight Up`)
            .skill($skill`Extract Jelly`)
            .skill($skill`Sing Along`)
            .skill($skill`Precision Shot`)
            .skill($skill`Double Nanovision`)
            .repeat()
        )
        .macro(new Macro().skill($skill`Double Nanovision`).repeat(), $monster`sausage goblin`),
      limit: { tries: 550 },
      tracking: "GooFarming",
    },
    {
      name: "Pull All",
      after: ["Ascend", "In-Run Farm Initial"],
      completed: () => myStorageMeat() === 0 && storageAmount($item`festive warbear bank`) === 0, // arbitrary item,
      do: (): void => {
        cliExecute("pull all");
        cliExecute("refresh all");
      },
      limit: { tries: 1 },
      tracking: "Run",
    },
    {
      name: "Tower",
      after: ["Ascend", "Pull All", "In-Run Farm Initial"],
      completed: () => step("questL13Final") > 11,
      do: () => cliExecute("loopgyou delaytower"),
      limit: { tries: 1 },
      tracking: "Run",
    },
    {
      name: "In-Run Farm Final",
      after: ["Ascend", "Tower", ...gear.map((task) => task.name)],
      // eslint-disable-next-line libram/verify-constants
      completed: () => myAdventures() <= 40 || myClass() !== $class`Grey Goo`,
      prepare: (): void => {
        restoreMp(10);

        // Prepare Asdon buff
        if (AsdonMartin.installed() && !have($effect`Driving Observantly`))
          AsdonMartin.drive(AsdonMartin.Driving.Observantly);
      },
      do: $location`Barf Mountain`,
      outfit: {
        modifier: "meat",
        weapon: $item`haiku katana`,
        offhand:
          getKramcoWandererChance() > 0.05
            ? $item`Kramco Sausage-o-Matic™`
            : $item`latte lovers member's mug`,
        acc1: $item`lucky gold ring`,
        acc2: $item`mafia pointer finger ring`,
        familiar: $familiar`Space Jellyfish`,
      },
      effects: $effects`How to Scam Tourists`,
      combat: new CombatStrategy()
        .macro(
          new Macro()
            .trySkill($skill`Bowl Straight Up`)
            .skill($skill`Extract Jelly`)
            .skill($skill`Sing Along`)
            .skill($skill`Summer Siesta`)
            .skill($skill`Double Nanovision`)
            .repeat()
        )
        .macro(new Macro().skill($skill`Double Nanovision`).repeat(), $monster`sausage goblin`),
      limit: { tries: 150 },
      tracking: "GooFarming",
    },
    {
      name: "Prism",
      after: ["Ascend", "In-Run Farm Final"],
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
    {
      name: "Duplicate",
      after: ["Ascend", "Prism", "Pull All", "Level"],
      ready: () => have(args.duplicate),
      completed: () => get("lastDMTDuplication") === myAscensions(),
      prepare: () => set("choiceAdventure1125", `1&iid=${toInt(args.duplicate)}`),
      do: $location`The Deep Machine Tunnels`,
      choices: { 1119: 4 },
      combat: new CombatStrategy().macro(new Macro().attack().repeat()),
      outfit: { familiar: $familiar`Machine Elf`, modifier: "muscle" },
      limit: { tries: 6 },
    },
    {
      name: "Breakfast",
      after: ["Ascend", "Prism", "Pull All", "Level"],
      completed: () => get("breakfastCompleted"),
      do: () => cliExecute("breakfast"),
      limit: { tries: 1 },
    },
    ...garboAscend(
      ["Ascend", "Prism", "Pull All", "Level", "Duplicate", "Breakfast"],
      "garbo yachtzeechain ascend"
    ),
    ...pvp(["Overdrunk"]),
  ],
};

function getExtros(): void {
  if (getWorkshed() !== $item`cold medicine cabinet`) return;
  if (get("_coldMedicineConsults") >= 5 || get("_nextColdMedicineConsult") > totalTurnsPlayed()) {
    return;
  }
  const options = visitUrl("campground.php?action=workshed");
  let match;
  const regexp = /descitem\((\d+)\)/g;
  while ((match = regexp.exec(options)) !== null) {
    const item = descToItem(match[1]);
    if (item === $item`Extrovermectin™`) {
      visitUrl("campground.php?action=workshed");
      runChoice(5);
      return;
    }
  }
}
