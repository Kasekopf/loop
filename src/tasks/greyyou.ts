import { CombatStrategy, step } from "grimoire-kolmafia";
import {
  autosell,
  buyUsingStorage,
  cliExecute,
  itemAmount,
  knollAvailable,
  myAdventures,
  myAscensions,
  myClass,
  myLevel,
  myStorageMeat,
  myTurncount,
  restoreMp,
  retrieveItem,
  runChoice,
  storageAmount,
  toInt,
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
  $location,
  $skill,
  ascend,
  ensureEffect,
  get,
  have,
  Lifestyle,
  Macro,
  Pantogram,
  Paths,
  prepareAscension,
  set,
  SourceTerminal,
} from "libram";
import { getCurrentLeg, Leg, Quest, Task } from "./structure";
import { args } from "../main";
import { garboAscend } from "./aftercore";

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
      autosell($item`porquoise`, itemAmount($item`porquoise`));
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
    name: "Offhand",
    after: [],
    completed: () => have($item`Half a Purse`),
    ready: () => knollAvailable(),
    do: () => {
      if (!have($item`lump of Brituminous coal`)) useSkill($skill`Summon Smithsness`);
      retrieveItem($item`Half a Purse`);
    },
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
      after: ["Aftercore/Overdrunk"],
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
      name: "Run",
      after: ["Ascend", ...gear.map((task) => task.name)],
      completed: () => step("questL13Final") !== -1,
      do: () => cliExecute("loopgyou delaytower pulls=19"),
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
        if (get("retroCapeSuperhero") !== "robot" || get("retroCapeWashingInstructions") !== "kill")
          cliExecute("retrocape robot kill");

        if (get("tomeSummons") < 3) useSkill($skill`Summon Smithsness`);
        if (have($item`Flaskfull of Hollow`)) ensureEffect($effect`Merry Smithsness`);
        if (have($item`How to Avoid Scams`)) ensureEffect($effect`How to Scam Tourists`);

        // Use only the first source terminal enhance, save the others for aftercore
        if (get("_sourceTerminalEnhanceUses") === 0) SourceTerminal.enhance($effect`meat.enh`);
      },
      outfit: {
        back: $item`unwrapped knock-off retro superhero cape`,
        weapon: $item`astral pistol`,
        offhand: $item`Half a Purse`,
        acc1: $item`lucky gold ring`,
        acc2: $item`mafia pointer finger ring`,
        acc3: $item`mafia thumb ring`,
        familiar: $familiar`Space Jellyfish`,
        modifier: "meat",
      },
      combat: new CombatStrategy().macro(
        new Macro()
          .trySkill($skill`Bowl Straight Up`)
          .skill($skill`Extract Jelly`)
          .skill($skill`Sing Along`)
          .skill($skill`Precision Shot`)
          .skill($skill`Double Nanovision`)
          .repeat()
      ),
      limit: { tries: 450 },
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
      prepare: () => restoreMp(10),
      do: $location`Barf Mountain`,
      outfit: {
        modifier: "meat",
        weapon: $item`haiku katana`,
        acc1: $item`lucky gold ring`,
        acc2: $item`mafia pointer finger ring`,
        familiar: $familiar`Space Jellyfish`,
      },
      effects: $effects`How to Scam Tourists`,
      combat: new CombatStrategy().macro(
        new Macro()
          .trySkill($skill`Bowl Straight Up`)
          .skill($skill`Extract Jelly`)
          .skill($skill`Sing Along`)
          .skill($skill`Summer Siesta`)
          .skill($skill`Double Nanovision`)
          .repeat()
      ),
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
  ],
};
