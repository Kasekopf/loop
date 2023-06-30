import {
  autosellPrice,
  Coinmaster,
  gamedayToInt,
  gametimeToInt,
  getCloset,
  getStorage,
  historicalAge,
  historicalPrice,
  Item,
  myAscensions,
  myClosetMeat,
  myStorageMeat,
  myTurncount,
  print,
  sellPrice,
  toInt,
  toItem,
} from "kolmafia";
import { $item, $items, get, getFoldGroup, getSaleValue, Session, set, sumNumbers } from "libram";

function currency(...items: Item[]): () => number {
  const unitCost: [Item, number][] = items.map((i) => {
    const coinmaster = Coinmaster.all().find((c) => sellPrice(c, i) > 0);
    if (!coinmaster) {
      throw `Invalid coinmaster item ${i}`;
    } else {
      return [i, sellPrice(coinmaster, i)];
    }
  });
  return () => Math.max(...unitCost.map(([item, cost]) => garboValue(item) / cost));
}

function complexCandy(): [Item, () => number][] {
  const candies = Item.all().filter((i) => i.candyType === "complex");
  const candyLookup: Item[][] = [[], [], [], [], []];

  for (const candy of candies) {
    const id = toInt(candy) % 5;
    if (candy.tradeable) {
      candyLookup[id].push(candy);
    }
  }
  const candyIdPrices: [Item, () => number][] = candies
    .filter((i) => !i.tradeable)
    .map((i) => [i, () => Math.min(...candyLookup[toInt(i) % 5].map((i) => garboValue(i)))]);
  return candyIdPrices;
}

const specialValueLookup = new Map<Item, () => number>([
  [
    $item`Freddy Kruegerand`,
    currency(...$items`bottle of Bloodweiser, electric Kool-Aid, Dreadsylvanian skeleton key`),
  ],
  [$item`Beach Buck`, currency($item`one-day ticket to Spring Break Beach`)],
  [$item`Coinspiracy`, currency(...$items`Merc Core deployment orders, karma shawarma`)],
  [$item`FunFunds™`, currency($item`one-day ticket to Dinseylandfill`)],
  [$item`Volcoino`, currency($item`one-day ticket to That 70s Volcano`)],
  [$item`Wal-Mart gift certificate`, currency($item`one-day ticket to The Glaciest`)],
  [$item`Rubee™`, currency($item`FantasyRealm guest pass`)],
  [$item`Guzzlrbuck`, currency($item`Never Don't Stop Not Striving`)],
  ...complexCandy(),
  [
    $item`Merc Core deployment orders`,
    () => garboValue($item`one-day ticket to Conspiracy Island`),
  ],
  [
    $item`free-range mushroom`,
    () =>
      3 *
      Math.max(
        garboValue($item`mushroom tea`) - garboValue($item`soda water`),
        garboValue($item`mushroom whiskey`) - garboValue($item`fermenting powder`),
        garboValue($item`mushroom filet`)
      ),
  ],
  [
    $item`little firkin`,
    () =>
      garboAverageValue(
        ...$items`martini, screwdriver, strawberry daiquiri, margarita, vodka martini, tequila sunrise, bottle of Amontillado, barrel-aged martini, barrel gun`
      ),
  ],
  [
    $item`normal barrel`,
    () =>
      garboAverageValue(
        ...$items`a little sump'm sump'm, pink pony, rockin' wagon, roll in the hay, slip 'n' slide, slap and tickle`
      ),
  ],
  [
    $item`big tun`,
    () =>
      garboAverageValue(
        ...$items`gibson, gin and tonic, mimosette, tequila sunset, vodka and tonic, zmobie`
      ),
  ],
  [
    $item`weathered barrel`,
    () => garboAverageValue(...$items`bean burrito, enchanted bean burrito, jumping bean burrito`),
  ],
  [
    $item`dusty barrel`,
    () =>
      garboAverageValue(
        ...$items`spicy bean burrito, spicy enchanted bean burrito, spicy jumping bean burrito`
      ),
  ],
  [
    $item`disintegrating barrel`,
    () =>
      garboAverageValue(
        ...$items`insanely spicy bean burrito, insanely spicy enchanted bean burrito, insanely spicy jumping bean burrito`
      ),
  ],
  [
    $item`moist barrel`,
    () =>
      garboAverageValue(
        ...$items`cast, concentrated magicalness pill, enchanted barbell, giant moxie weed, Mountain Stream soda`
      ),
  ],
  [
    $item`rotting barrel`,
    () =>
      garboAverageValue(
        ...$items`Doc Galaktik's Ailment Ointment, extra-strength strongness elixir, jug-o-magicalness, Marquis de Poivre soda, suntan lotion of moxiousness`
      ),
  ],
  [
    $item`mouldering barrel`,
    () =>
      garboAverageValue(
        ...$items`creepy ginger ale, haunted battery, scroll of drastic healing, synthetic marrow, the funk`
      ),
  ],
  [
    $item`barnacled barrel`,
    () =>
      garboAverageValue(
        ...$items`Alewife™ Ale, bazookafish bubble gum, beefy fish meat, eel battery, glistening fish meat, ink bladder, pufferfish spine, shark cartilage, slick fish meat, slug of rum, slug of shochu, slug of vodka, temporary teardrop tattoo`
      ),
  ],
  [$item`fake hand`, () => 50000],
]);

function getHistoricalSaleValue(item: Item) {
  if (historicalAge(item) <= 7.0 && historicalPrice(item) > 0) {
    const isMallMin = historicalPrice(item) === Math.max(100, 2 * autosellPrice(item));
    return isMallMin ? autosellPrice(item) : 0.9 * historicalPrice(item);
  }
  return getSaleValue(item);
}

const garboValueCache = new Map<Item, number>();
export function garboValue(item: Item): number {
  const cachedValue = garboValueCache.get(item);
  if (cachedValue === undefined) {
    const specialValueCompute = specialValueLookup.get(item);
    const value = specialValueCompute ? specialValueCompute() : getHistoricalSaleValue(item);
    print(`Valuing ${item.name} @ ${value}`);
    garboValueCache.set(item, value);
    return value;
  }
  return cachedValue;
}
export function garboAverageValue(...items: Item[]): number {
  return sumNumbers(items.map(garboValue)) / items.length;
}

class DailySetting<T> {
  key: string;

  constructor(key: string) {
    this.key = key;
  }

  get(def: T): T {
    const saved = get(this.key, "");
    if (saved === "") return def;
    const json = JSON.parse(saved);
    if ("day" in json && "value" in json && json["day"] === gamedayToInt()) return json["value"];
    else return def;
  }

  set(value: T) {
    set(
      this.key,
      JSON.stringify({
        day: gamedayToInt(),
        value: value,
      })
    );
  }
}

export type ProfitRecord = {
  meat: number;
  items: number;
  turns: number;
  hours: number;
};
export type Records = {
  [name: string]: ProfitRecord;
};

export class ProfitTracker {
  setting: DailySetting<Records>;
  records: Records;
  session: Session;
  turns: number;
  hours: number;
  pulled: Set<Item>;
  ascensions: number;

  constructor(key: string) {
    this.setting = new DailySetting<Records>(key);

    this.records = this.setting.get({});
    this.session = getCurrentSession();
    this.turns = myTurncount();
    this.hours = gametimeToInt() / (1000 * 60 * 60);
    this.ascensions = myAscensions();
    this.pulled = new Set<Item>(
      get("_roninStoragePulls")
        .split(",")
        .map((id) => parseInt(id))
        .filter((id) => id > 0)
        .map((id) => Item.get(id))
    );
  }

  reset(): void {
    this.session = getCurrentSession();
    this.turns = myTurncount();
    this.hours = gametimeToInt() / (1000 * 60 * 60);
    this.ascensions = myAscensions();
    this.pulled = new Set<Item>(
      get("_roninStoragePulls")
        .split(",")
        .map((id) => parseInt(id))
        .filter((id) => id > 0)
        .map((id) => Item.get(id))
    );
  }

  record(tag: string): void {
    if (this.ascensions < myAscensions()) {
      // Session tracking is not accurate across ascensions
      this.reset();
      return;
    }

    // Pulled items are tracked oddly in the Session
    // (they are included in the Session diff by default)
    const newPulls = new Set<Item>(
      get("_roninStoragePulls")
        .split(",")
        .map((id) => parseInt(id))
        .filter((id) => id > 0)
        .map((id) => Item.get(id))
    );
    for (const item of newPulls) {
      if (this.pulled.has(item)) continue;
      this.session.items.set(item, 1 + (this.session.items.get(item) ?? 0));
    }

    const diff = getCurrentSession().diff(this.session);
    if (!(tag in this.records)) this.records[tag] = { meat: 0, items: 0, turns: 0, hours: 0 };

    const value = diff.value(garboValue);
    this.records[tag].meat += value.meat;
    this.records[tag].items += value.items;
    this.records[tag].turns += myTurncount() - this.turns;
    this.records[tag].hours += gametimeToInt() / (1000 * 60 * 60) - this.hours;
    print(
      `Profit: ${value.meat}, ${value.items}, ${myTurncount() - this.turns}, ${
        gametimeToInt() / (1000 * 60 * 60) - this.hours
      }`
    );
    this.reset();
  }

  all(): Records {
    return this.records;
  }

  save(): void {
    this.setting.set(this.records);
  }
}

function getCurrentSession(): Session {
  /*
  Libram includes getStorage() in the generated session, since pulling an
  item in-ronin does indeed modify the underlying mafia session tracking,
  i.e., -1 from getStorage and +1 from mySessionItems.

  But pulling all items out of ronin does not modify the underling mafia
  session tracking, i.e., -1 from getStorage but +0 from mySessionItems.

  Since we already handle in-ronin pulls above (see ProfitTracker.pulled),
  we just ignore getStorage from the Session.

  This should be changed if libram/mafia changes how stored items are tracked.
  */

  const manyToOne = (primary: Item, mapped: Item[]): [Item, Item][] =>
    mapped.map((target: Item) => [target, primary]);

  const foldable = (item: Item): [Item, Item][] => manyToOne(item, getFoldGroup(item));

  const itemMappings = new Map<Item, Item>([
    ...foldable($item`liar's pants`),
    ...foldable($item`ice pick`),
    ...manyToOne($item`Spooky Putty sheet`, [
      $item`Spooky Putty monster`,
      ...getFoldGroup($item`Spooky Putty sheet`),
    ]),
    ...foldable($item`stinky cheese sword`),
    ...foldable($item`naughty paper shuriken`),
    ...foldable($item`Loathing Legion knife`),
    ...foldable($item`deceased crimbo tree`),
    ...foldable($item`makeshift turban`),
    ...foldable($item`turtle wax shield`),
    ...foldable($item`metallic foil bow`),
    ...foldable($item`ironic moustache`),
    ...foldable($item`bugged balaclava`),
    ...foldable($item`toggle switch (Bartend)`),
    ...foldable($item`mushroom cap`),
    ...manyToOne($item`can of Rain-Doh`, $items`empty Rain-Doh can`),
    ...manyToOne(
      $item`meteorite fragment`,
      $items`meteorite earring, meteorite necklace, meteorite ring`
    ),
    ...manyToOne(
      $item`Sneaky Pete's leather jacket`,
      $items`Sneaky Pete's leather jacket (collar popped)`
    ),
    ...manyToOne($item`Boris's Helm`, $items`Boris's Helm (askew)`),
    ...manyToOne($item`Jarlsberg's pan`, $items`Jarlsberg's pan (Cosmic portal mode)`),
    ...manyToOne(
      $item`tiny plastic sword`,
      $items`grogtini, bodyslam, dirty martini, vesper, cherry bomb, sangria del diablo`
    ),
    ...manyToOne(
      $item`earthenware muffin tin`,
      $items`blueberry muffin, bran muffin, chocolate chip muffin`
    ),
  ]);

  const result = Session.current();
  for (const inventoryFunc of [getCloset, getStorage]) {
    for (const [itemStr, quantity] of Object.entries(inventoryFunc())) {
      const item = toItem(itemStr);
      const mappedItem = itemMappings.get(item) ?? item;
      result.register(mappedItem, -1 * quantity);
    }
  }
  result.register("meat", -1 * myStorageMeat());
  result.register("meat", -1 * myClosetMeat());
  return result;
}

function sum(record: Records, where: (key: string) => boolean): ProfitRecord {
  const included: ProfitRecord[] = [];
  for (const key in record) {
    if (where(key)) included.push(record[key]);
  }
  return {
    meat: included.reduce((v, p) => v + p.meat, 0),
    items: included.reduce((v, p) => v + p.items, 0),
    turns: included.reduce((v, p) => v + p.turns, 0),
    hours: included.reduce((v, p) => v + p.hours, 0),
  };
}

function numberWithCommas(x: number): string {
  const str = x.toString();
  if (str.includes(".")) return x.toFixed(2);
  return str.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function printProfitSegment(key: string, record: ProfitRecord, color: string) {
  if (record === undefined) return;
  print(
    `${key}: ${numberWithCommas(record.meat)} meat + ${numberWithCommas(record.items)} items (${
      record.turns
    } turns + ${numberWithCommas(record.hours)} hours)`,
    color
  );
}

export function printProfits(records: Records): void {
  print("");
  print("== Daily Loop Profit ==");
  printProfitSegment(
    "Aftercore",
    sum(records, (key) => key.startsWith("0")),
    "blue"
  );
  printProfitSegment("* Garbo", records["0@Garbo"], "green");
  printProfitSegment("* Other", records["0@Other"], "green");
  printProfitSegment(
    "Post",
    sum(records, (key) => key.startsWith("1")),
    "blue"
  );
  printProfitSegment("* Run", records["1@Run"], "green");
  printProfitSegment("* GooFarming", records["1@GooFarming"], "green");
  printProfitSegment("* Garbo", records["1@Garbo"], "green");
  printProfitSegment("* Other", records["1@Other"], "green");
  printProfitSegment(
    "Total",
    sum(records, () => true),
    "black"
  );
}
