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

        ascend(
          $path.none,
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
        cliExecute("loopcasual fluffers=false stomach=15 workshed='Asdon Martin keyfob'");
        if (myAdventures() === 0 && !have($skill`Liver of Steel`)) {
          cliExecute("cast 2 ancestral recall");
          cliExecute("loopcasual fluffers=false stomach=15");
        }
      },
      limit: { tries: 1 },
      tracking: "Run",
    },
  ],
};
