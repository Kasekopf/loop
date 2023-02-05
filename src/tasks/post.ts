import { CombatStrategy } from "grimoire-kolmafia";
import {
  buy,
  cliExecute,
  getWorkshed,
  haveEffect,
  inebrietyLimit,
  myAdventures,
  myAscensions,
  myInebriety,
  toInt,
  use,
} from "kolmafia";
import {
  $effect,
  $familiar,
  $item,
  $location,
  ChateauMantegna,
  get,
  have,
  haveInCampground,
  Macro,
  set,
} from "libram";
import { drive } from "libram/dist/resources/2017/AsdonMartin";
import { Quest } from "./structure";
import { args } from "../main";
import { canEat, pvp } from "./aftercore";

export function postQuest(runTasks: string[]): Quest {
  return {
    name: "Post",
    tasks: [
      {
        name: "Workshed",
        after: runTasks,
        completed: () => getWorkshed() === $item`cold medicine cabinet` || get("_workshedItemUsed"),
        do: (): void => {
          if (
            haveEffect($effect`Driving Observantly`) < 900 &&
            getWorkshed() === $item`Asdon Martin keyfob`
          )
            drive($effect`Driving Observantly`, 900 - haveEffect($effect`Driving Observantly`));
          use($item`cold medicine cabinet`);
        },
        limit: { tries: 1 },
      },
      {
        name: "Duplicate",
        after: runTasks,
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
        after: runTasks,
        completed: () => get("breakfastCompleted"),
        do: () => cliExecute("breakfast"),
        limit: { tries: 1 },
      },
      {
        name: "Garbo",
        after: [...runTasks, "Workshed", "Duplicate", "Breakfast"],
        completed: () => (myAdventures() === 0 && !canEat()) || myInebriety() > inebrietyLimit(),
        do: (): void => {
          if (have($item`can of Rain-Doh`) && !have($item`Rain-Doh blue balls`))
            use($item`can of Rain-Doh`);
          cliExecute("garbo yachtzeechain");
        },
        limit: { tries: 1 },
        tracking: "Garbo",
      },
      {
        name: "Wish",
        after: runTasks,
        completed: () => get("_genieWishesUsed") >= 3 || !have($item`genie bottle`),
        do: () => cliExecute(`genie wish for more wishes`),
        limit: { tries: 3 },
      },
      {
        name: "Nightcap",
        after: [...runTasks, "Garbo", "Wish"],
        completed: () => myInebriety() > inebrietyLimit(),
        do: () => cliExecute("CONSUME NIGHTCAP"),
        limit: { tries: 1 },
      },
      ...pvp(["Nightcap"]),
      {
        name: "Chateau Sleep",
        after: [...runTasks, "Nightcap", "Fights"],
        completed: () =>
          !ChateauMantegna.have() || ChateauMantegna.getCeiling() === "artificial skylight",
        do: () => ChateauMantegna.changeCeiling("artificial skylight"),
        limit: { tries: 1 },
      },
      {
        name: "Sleep",
        completed: () => haveInCampground($item`clockwork maid`),
        after: [...runTasks, "Nightcap", "Fights"],
        acquire: [{ item: $item`burning cape`, optional: true }],
        do: (): void => {
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
}