import { CombatStrategy, step } from "grimoire-kolmafia";
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
  $class,
  $effect,
  $familiar,
  $item,
  $location,
  ascend,
  ChateauMantegna,
  get,
  have,
  haveInCampground,
  Lifestyle,
  Macro,
  Paths,
  prepareAscension,
  set,
} from "libram";
import { drive } from "libram/dist/resources/2017/AsdonMartin";
import { getCurrentLeg, Leg, Quest } from "./structure";
import { args } from "../main";
import { canEat } from "./aftercore";

export const CasualQuest: Quest = {
  name: "Casual",
  tasks: [
    {
      name: "Ascend",
      completed: () => getCurrentLeg() >= Leg.Casual,
      after: ["Grey You/Overdrunk"],
      do: (): void => {
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
      tracking: "Run",
    },
    {
      name: "Workshed",
      after: ["Ascend", "Run"],
      completed: () => getWorkshed() !== $item`Asdon Martin keyfob` || get("_workshedItemUsed"),
      do: (): void => {
        if (haveEffect($effect`Driving Observantly`) < 900)
          drive($effect`Driving Observantly`, 900 - haveEffect($effect`Driving Observantly`));
        use($item`cold medicine cabinet`);
      },
      limit: { tries: 1 },
    },
    {
      name: "Duplicate",
      after: ["Ascend", "Run"],
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
      after: ["Ascend", "Run"],
      completed: () => get("breakfastCompleted"),
      do: () => cliExecute("breakfast"),
      limit: { tries: 1 },
    },
    {
      name: "Garbo",
      after: ["Ascend", "Run", "Workshed", "Duplicate", "Breakfast"],
      completed: () => (myAdventures() === 0 && !canEat()) || myInebriety() > inebrietyLimit(),
      do: (): void => {
        if (have($item`can of Rain-Doh`) && !have($item`Rain-Doh blue balls`))
          use($item`can of Rain-Doh`);
        cliExecute("garbo");
      },
      limit: { tries: 1 },
      tracking: "Garbo",
    },
    {
      name: "Wish",
      after: [],
      completed: () => get("_genieWishesUsed") >= 3 || !have($item`genie bottle`),
      do: () => cliExecute(`genie wish for more wishes`),
      limit: { tries: 3 },
    },
    {
      name: "Nightcap",
      after: ["Ascend", "Run", "Garbo", "Wish"],
      completed: () => myInebriety() > inebrietyLimit(),
      do: () => cliExecute("CONSUME NIGHTCAP"),
      limit: { tries: 1 },
    },
    {
      name: "Chateau Sleep",
      after: ["Ascend", "Nightcap"],
      completed: () =>
        !ChateauMantegna.have() || ChateauMantegna.getCeiling() === "artificial skylight",
      do: () => ChateauMantegna.changeCeiling("artificial skylight"),
      limit: { tries: 1 },
    },
    {
      name: "Sleep",
      completed: () => haveInCampground($item`clockwork maid`),
      after: ["Ascend", "Nightcap"],
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
