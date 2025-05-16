import { step } from "grimoire-kolmafia";
import { cliExecute, hippyStoneBroken, myAdventures, visitUrl } from "kolmafia";
import { $class, $item, $path, $skill, ascend, have, Lifestyle, prepareAscension } from "libram";
import { ascended, Quest } from "./structure";
import { args } from "../main";

export const CasualQuest: Quest = {
  name: "Casual",
  tasks: [
    {
      name: "Ascend",
      completed: () => ascended(),
      after: ["Aftercore/Overdrunk", "Aftercore/Fights"],
      do: (): void => {
        prepareAscension({
          garden: "packet of thanksgarden seeds",
          eudora: "GameInformPowerDailyPro subscription card",
          chateau: {
            desk: "continental juice bar",
            nightstand: "electric muscle stimulator",
            ceiling: "ceiling fan",
          },
        });

        ascend({
          path: $path.none,
          playerClass: $class`Seal Clubber`,
          lifestyle: Lifestyle.casual,
          moon: "knoll",
          consumable: $item`astral six-pack`,
          pet: $item`astral pet sweater`,
        });
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
      completed: () => step("questL13Final") > 11 && have($skill`Liver of Steel`),
      do: (): void => {
        cliExecute("loopstar workshed='Asdon Martin keyfob'");
      },
      limit: { tries: 1 },
      tracking: "Run",
    },
    {
      name: "Prism",
      after: ["Ascend", "Run"],
      completed: () => step("questL13Final") === 999,
      do: () => visitUrl("place.php?whichplace=nstower&action=ns_11_prism"),
      limit: { tries: 1 },
      tracking: "Ignore",
    },
  ],
};
