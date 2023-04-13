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
  $familiar,
  $item,
  $location,
  $monster,
  $path,
  $skill,
  ascend,
  AsdonMartin,
  ensureEffect,
  get,
  have,
  Lifestyle,
  Macro,
  Pantogram,
  prepareAscension,
  RetroCape,
  set,
  SourceTerminal,
} from "libram";
import { ascended, Quest, Task } from "./structure";
import { args } from "../main";

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
  // {
  //   name: "Pointer Finger",
  //   after: [],
  //   completed: () => have($item`mafia pointer finger ring`),
  //   do: () => cliExecute("pull mafia pointer finger ring"),
  //   limit: { tries: 1 },
  // },
];

export const GyouQuest: Quest = {
  name: "Grey You",
  tasks: [
    {
      name: "Ascend",
      completed: () => ascended(),
      after: ["Aftercore/Overdrunk", "Aftercore/Fights"],
      do: (): void => {
        prepareAscension({
          eudora: "Our Daily Candles™ order form",
        });
        ascend(
          $path`Grey You`,
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
      completed: () => step("questL13Final") > 11,
      do: () => cliExecute("loopgyou tune=wombat"),
      limit: { tries: 1 },
      tracking: "Run",
    },
    {
      name: "In-Run Farm",
      after: ["Ascend", "Run", ...gear.map((task) => task.name)],
      completed: () => myAdventures() <= 40 || myClass() !== $class`Grey Goo`,
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
        offhand: $item`latte lovers member's mug`,
        acc1: $item`lucky gold ring`,
        // acc2: $item`mafia pointer finger ring`,
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
        .macro(
          new Macro()
            .while_("!mpbelow 20", new Macro().skill($skill`Double Nanovision`))
            .attack()
            .repeat(),
          $monster`sausage goblin`
        ),
      limit: { tries: 550 },
      tracking: "GooFarming",
    },
    {
      name: "Prism",
      after: ["Ascend", "Run", "In-Run Farm"],
      completed: () => myClass() !== $class`Grey Goo`,
      do: () => cliExecute("loopgyou class=1"),
      limit: { tries: 1 },
    },
    {
      name: "Pull All",
      after: ["Ascend", "Prism"],
      completed: () => myStorageMeat() === 0 && storageAmount($item`festive warbear bank`) === 0, // arbitrary item,
      do: (): void => {
        cliExecute("pull all");
        cliExecute("refresh all");
      },
      limit: { tries: 1 },
      tracking: "Run",
    },
    {
      name: "Level",
      after: ["Ascend", "Prism", "Pull All"],
      completed: () => myClass() !== $class`Grey Goo` && myLevel() >= 13,
      do: () => cliExecute("loopcasual goal=level"),
      limit: { tries: 1 },
    },
    {
      name: "Organ",
      after: ["Ascend", "Prism", "Level", "Pull All"],
      completed: () => have($skill`Liver of Steel`),
      do: () => cliExecute("loopcasual goal=organ"),
      limit: { tries: 1 },
    },
    {
      name: "Duplicate",
      after: ["Ascend", "Prism", "Level", "Pull All"],
      ready: () => have(args.duplicate),
      completed: () => get("lastDMTDuplication") === myAscensions(),
      prepare: () => set("choiceAdventure1125", `1&iid=${toInt(args.duplicate)}`),
      do: $location`The Deep Machine Tunnels`,
      choices: { 1119: 4 },
      combat: new CombatStrategy().macro(new Macro().attack().repeat()),
      outfit: { familiar: $familiar`Machine Elf`, modifier: "muscle" },
      limit: { tries: 6 },
    },
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
