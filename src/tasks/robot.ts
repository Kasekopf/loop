import { CombatStrategy, step } from "grimoire-kolmafia";
import {
  cliExecute,
  getWorkshed,
  hippyStoneBroken,
  myAscensions,
  myPath,
  myStorageMeat,
  runChoice,
  storageAmount,
  toInt,
  use,
  visitUrl,
} from "kolmafia";
import {
  $class,
  $effect,
  $familiar,
  $item,
  $location,
  $path,
  $skill,
  AprilingBandHelmet,
  ascend,
  get,
  have,
  Lifestyle,
  Macro,
  prepareAscension,
  set,
  uneffect,
} from "libram";
import { ascended, Quest } from "./structure";
import { args } from "../main";

export const RobotQuest: Quest = {
  name: "Robot",
  tasks: [
    {
      name: "Ascend",
      completed: () => ascended(),
      after: ["Aftercore/Overdrunk", "Aftercore/Fights"],
      do: (): void => {
        prepareAscension({
          garden: "packet of tall grass seeds",
          eudora: "Our Daily Candles™ order form",
          chateau: {
            desk: "continental juice bar",
            ceiling: "ceiling fan",
            nightstand: "electric muscle stimulator",
          },
        });

        ascend({
          path: $path`You, Robot`,
          playerClass: $class`Seal Clubber`,
          lifestyle: Lifestyle.softcore,
          moon: "vole",
          consumable: $item`astral six-pack`,
          pet: $item`astral mask`,
        });
        set("choiceAdventure1446", 1);
        if (visitUrl("main.php").includes("one made of rusty metal and scrap wiring"))
          runChoice(-1);
      },
      limit: { tries: 1 },
    },
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
      after: ["Ascend", "Break Stone"],
      completed: () => step("questL13Final") > 11,
      do: () => cliExecute("looprobot"),
      limit: { tries: 1 },
      tracking: "Run",
    },
    {
      name: "Prism",
      after: ["Ascend", "Run"],
      completed: () => myPath() !== $path`You, Robot`,
      do: () => visitUrl("place.php?whichplace=nstower&action=ns_11_prism"),
      limit: { tries: 1 },
      tracking: "Ignore",
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
      name: "Reset Apriling",
      after: ["Ascend", "Prism", "Pull All"],
      completed: () =>
        !AprilingBandHelmet.have() ||
        !AprilingBandHelmet.canChangeSong() ||
        have($effect`Apriling Band Celebration Bop`),
      do: () => AprilingBandHelmet.changeSong("Apriling Band Celebration Bop"),
      limit: { tries: 1 },
      tracking: "Run",
    },
    {
      name: "Asdon",
      after: ["Ascend", "Prism", "Pull All"],
      completed: () =>
        getWorkshed() === $item`Asdon Martin keyfob` ||
        get("_workshedItemUsed") ||
        !have($item`Asdon Martin keyfob`),
      do: () => use($item`Asdon Martin keyfob`),
      limit: { tries: 1 },
    },
    {
      name: "Organ",
      after: ["Ascend", "Prism", "Pull All", "Asdon"],
      completed: () => have($skill`Liver of Steel`),
      do: () => cliExecute("loopcasual goal=organ"),
      limit: { tries: 1 },
    },
    {
      name: "Duplicate",
      after: ["Ascend", "Prism", "Pull All", "Asdon"],
      ready: () => have(args.duplicate),
      completed: () => get("lastDMTDuplication") === myAscensions(),
      prepare: () => set("choiceAdventure1125", `1&iid=${toInt(args.duplicate)}`),
      do: $location`The Deep Machine Tunnels`,
      post: (): void => {
        if (have($effect`Beaten Up`)) uneffect($effect`Beaten Up`);
      },
      choices: { 1119: 4 },
      combat: new CombatStrategy().macro(new Macro().attack().repeat()),
      outfit: { familiar: $familiar`Machine Elf`, modifier: "muscle" },
      limit: { tries: 6 },
    },
  ],
};
