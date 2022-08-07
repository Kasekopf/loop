import { CombatStrategy, OutfitSpec, step } from "grimoire-kolmafia";
import {
  cliExecute,
  myAdventures,
  myAscensions,
  myClass,
  myLevel,
  myStorageMeat,
  myTurncount,
  runChoice,
  storageAmount,
  toInt,
  visitUrl,
} from "kolmafia";
import {
  $class,
  $effect,
  $familiar,
  $item,
  $location,
  $monster,
  $skill,
  ascend,
  get,
  have,
  Lifestyle,
  Macro,
  Paths,
  prepareAscension,
  set,
} from "libram";
import { getCurrentLeg, Leg, Quest } from "./structure";
import { args } from "../main";
import { garboAscend } from "./aftercore";

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
      tracking: "Run",
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
      outfit: (): OutfitSpec => {
        if (!have($effect`Everything Looks Yellow`)) return {};
        else return { modifier: "item" };
      },
      limit: { soft: 10 },
      tracking: "GooFarming",
    },
    {
      name: "Drill",
      after: ["Ascend", "Run"],
      completed: () => have($item`high-temperature mining drill`),
      do: () => cliExecute("pull high-temperature mining drill"),
      limit: { tries: 1 },
      tracking: "GooFarming",
    },
    {
      name: "Volcano Initial",
      after: ["Ascend", "Hotres", "Drill"],
      completed: () => myTurncount() >= 1000,
      do: () => cliExecute(`minevolcano ${1000 - myTurncount()}`),
      limit: { tries: 2 },
      tracking: "GooFarming",
    },
    {
      name: "Pull All",
      after: ["Ascend", "Volcano Initial"],
      completed: () => myStorageMeat() === 0 && storageAmount($item`festive warbear bank`) === 0, // arbitrary item,
      do: (): void => {
        cliExecute("pull all");
        cliExecute("refresh all");
      },
      limit: { tries: 1 },
      tracking: "GooFarming",
    },
    {
      name: "Tower",
      after: ["Ascend", "Pull All", "Volcano Initial"],
      completed: () => step("questL13Final") > 11,
      do: () => cliExecute("loopgyou delaytower"),
      limit: { tries: 1 },
      tracking: "Run",
    },
    {
      name: "Volcano Final",
      after: ["Ascend", "Hotres", "Drill", "Tower"],
      // eslint-disable-next-line libram/verify-constants
      completed: () => myAdventures() <= 40 || myClass() !== $class`Grey Goo`,
      do: () => cliExecute(`minevolcano ${myAdventures() - 40}`),
      limit: { tries: 2 },
      tracking: "GooFarming",
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
    ...garboAscend(
      ["Ascend", "Prism", "Pull All", "Level", "Duplicate"],
      "garbo yachtzeechain ascend"
    ),
  ],
};
