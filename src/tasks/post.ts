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
  print,
  toInt,
  use,
  useSkill,
} from "kolmafia";
import {
  $effect,
  $familiar,
  $item,
  $items,
  $location,
  $skill,
  ChateauMantegna,
  get,
  have,
  haveInCampground,
  Macro,
  set,
} from "libram";
import { drive } from "libram/dist/resources/2017/AsdonMartin";
import { isHalloween, Quest } from "./structure";
import { args } from "../main";
import { canEat, pvp, stooperDrunk } from "./aftercore";

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
            haveEffect($effect`Driving Observantly`) < 1300 &&
            getWorkshed() === $item`Asdon Martin keyfob`
          )
            drive($effect`Driving Observantly`, 1300);
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
        post: () => {
          // Clear these to avoid interrupting garbo
          set("_lastCombatWon", true);
          set("_lastCombatLost", false);
        },
        choices: { 1119: 4 },
        combat: new CombatStrategy().macro(new Macro().attack().repeat()),
        outfit: {
          equip: $items`Space Trip safety headphones, keg shield`,
          familiar: $familiar`Machine Elf`,
          modifier: "muscle",
        },
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
        name: "Garboween",
        after: [...runTasks, "Workshed", "Duplicate", "Breakfast"],
        completed: () => !isHalloween() || !canEat() || stooperDrunk(),
        do: () => {
          set("valueOfAdventure", 20000);
          cliExecute("garbo nobarf target='witchess knight'");
          set("valueOfAdventure", args.voa);
        },
        limit: { tries: 1 },
        tracking: "Garbo",
      },
      {
        name: "Freecandy",
        after: [...runTasks, "Workshed", "Duplicate", "Breakfast", "Garboween"],
        completed: () => !isHalloween() || myAdventures() < 5 || stooperDrunk(),
        do: () => {
          cliExecute("freecandy treatOutfit='Ceramic Suit' familiar='Red-Nosed Snapper'");
        },
        outfit: { familiar: $familiar`Red-Nosed Snapper` },
        limit: { tries: 1 },
        tracking: "Garbo",
      },
      {
        name: "Garbo",
        after: [...runTasks, "Garboween", "Freecandy", "Workshed", "Duplicate", "Breakfast"],
        completed: () => (myAdventures() === 0 && !canEat()) || stooperDrunk(),
        do: (): void => {
          if (have($item`can of Rain-Doh`) && !have($item`Rain-Doh blue balls`))
            use($item`can of Rain-Doh`);
          set("valueOfAdventure", args.voa);
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
        do: () => {
          // Don't empty organs here
          set("currentMojoFilters", 3);
          set("spiceMelangeUsed", true);
          cliExecute("CONSUME NIGHTCAP");
        },
        limit: { tries: 1 },
      },
      // ...pvp(["Nightcap"]),
      {
        name: "Chateau Sleep",
        after: [...runTasks, "Nightcap"],
        completed: () =>
          !ChateauMantegna.have() || ChateauMantegna.getCeiling() === "artificial skylight",
        do: () => ChateauMantegna.changeCeiling("artificial skylight"),
        limit: { tries: 1 },
      },
      {
        name: "Scepter",
        after: [...runTasks, "Nightcap"],
        completed: () => get("_augSkillsCast", 0) >= 5 || have($effect`Offhand Remarkable`),
        do: () => useSkill($skill`Aug. 13th: Left/Off Hander's Day!`),
        limit: { tries: 1 },
      },
      {
        name: "Sleep",
        completed: () => haveInCampground($item`clockwork maid`),
        after: [...runTasks, "Nightcap"],
        acquire: [{ item: $item`burning cape`, optional: true }],
        do: (): void => {
          if (!haveInCampground($item`clockwork maid`)) {
            if (!have($item`clockwork maid`)) buy(1, $item`clockwork maid`, 48000);
            use($item`clockwork maid`);
          }
        },
        outfit: () => {
          if (have($effect`Offhand Remarkable`))
            return { modifier: "adv", familiar: $familiar`Left-Hand Man` };
          return { modifier: "adv", familiar: $familiar`Trick-or-Treating Tot` };
        },
        limit: { tries: 1 },
      },
      {
        name: "Campfire Smoke",
        ready: () => get("getawayCampsiteUnlocked"),
        completed: () => !have($item`stick of firewood`),
        after: [...runTasks, "Nightcap", "Sleep"],
        do: (): void => {
          let smoke = 0;
          while (have($item`stick of firewood`)) {
            set("choiceAdventure1394", `1&message=${smoke} Enjoy the smoke!`);
            use(1, $item`campfire smoke`);
            print(`Smoked ${smoke} firewoods!`);
            smoke++;
          }
        },
        limit: { tries: 1 },
      },
    ],
  };
}
