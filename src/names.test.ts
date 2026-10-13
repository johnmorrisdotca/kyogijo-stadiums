import { describe, expect, it } from "vitest";
import { PLACES, placeById, placeByName, placesBy, placesByName } from "./atlas.ts";
import { describe as describeDrawing, drawKyogijo } from "./draw.ts";
import { hash } from "./format.ts";
import { GROUNDS, GROUND_IDS, groundByName, groundNameIn, groundOfficialName, groundsByName } from "./grounds.ts";
import { officialName, plainName } from "./names.ts";
import { GROUNDS_BEFORE_EN, GROUNDS_BEFORE_JA, PARKS_BEFORE_JA } from "./names.fixture.ts";
import { PARKS, PARK_IDS, parkByName, parkOfficialName, parksByName } from "./parks.ts";

const KANJI = /[一-鿿々]/u;
const KANA = /^[぀-ゖァ-ヺー・\s0-9A-Za-z()（）.!&-]+$/u;
const places = [...PARK_IDS.map((id) => PARKS[id]), ...GROUND_IDS.map((id) => GROUNDS[id])];

describe("the names of every park and ground", () => {
  it("are an everyday name in English and in Japanese for every place, with a unique key", () => {
    expect(places).toHaveLength(158);
    expect(new Set(places.map((place) => place.id)).size).toBe(158);
    for (const place of places) {
      expect(place.name.trim().length, place.id).toBeGreaterThan(1);
      expect(place.nameJa.trim().length, place.id).toBeGreaterThan(1);
    }
    // The places of the atlas carry the same names.
    for (const place of PLACES) {
      const source = PARKS[place.id] ?? GROUNDS[place.id];
      expect([place.name, place.nameJa, place.readingJa, place.localName, place.localLanguage, place.aliases]).toEqual([source.name, source.nameJa, source.readingJa, source.localName, source.localLanguage, source.aliases ?? []]);
    }
  });

  it("have a reading in kana for each name in Japanese that has kanji, and for no other", () => {
    for (const place of places) {
      if (KANJI.test(place.nameJa)) expect(place.readingJa, `${place.id}: ${place.nameJa}`).toMatch(KANA);
      else expect(place.readingJa, place.id).toBeUndefined();
      if (place.readingJa !== undefined) expect(place.readingJa, place.id).not.toMatch(KANJI);
    }
    expect(PARKS["hanshin-koshien-stadium"].readingJa).toBe("こうしえんきゅうじょう");
    expect(PARKS["rakuten-mobile-park-miyagi"].readingJa).toBe("らくてんモバイル さいきょうパークみやぎ");
    expect(GROUNDS["nissan-stadium-yokohama"].readingJa).toBe("にっさんスタジアム");
    expect(GROUNDS["saitama-stadium-2002"].readingJa).toBe("さいたまスタジアムにまるまるに");
    expect(PARKS["tokyo-dome"].readingJa).toBe("とうきょうドーム");
  });

  it("give the name in the place's language, and the same name as the Japanese one in Japan", () => {
    for (const place of places) expect(place.localName === undefined, place.id).toBe(place.localLanguage === undefined);
    for (const place of places.filter((one) => one.country === "JP")) {
      expect(place.localLanguage, place.id).toBe("ja");
      expect(place.localName, place.id).toBe(place.nameJa);
    }
    expect(GROUNDS["san-siro"].localName).toBe("San Siro");
    expect(GROUNDS["maracana"].localName).toBe("Maracanã");
    expect(GROUNDS["la-bombonera"].localName).toBe("La Bombonera");
    expect(GROUNDS["estadio-azteca"].localName).toBe("Estadio Azteca");
    expect(GROUNDS["luzhniki"].localName).toBe("Лужники");
    expect(PARKS["olympic-stadium-montreal"]).toMatchObject({ localName: "Stade olympique", localLanguage: "fr" });
    for (const place of places.filter((one) => ["US", "GB", "AU", "ZA"].includes(one.country) && !("localLanguage" in one && one.localLanguage))) expect(place.localName, place.id).toBeUndefined();
  });

  it("keep every cited title of Wikipedia as an alias, with its revision", () => {
    for (const place of places) {
      for (const [lang, source] of [["en", place.en], ["ja", place.ja]] as const) {
        if (source === undefined) continue;
        const found = (place.aliases ?? []).find((alias) => alias.kind === "wikipedia" && alias.lang === lang && alias.name === source.title);
        expect(found, `${place.id}: ${lang} ${source.title}`).toBeDefined();
        expect(found?.revision, `${place.id}: ${source.title}`).toBe(source.revision);
      }
      // Every place has its English and its Japanese article among the aliases, cited or by its Wikidata item.
      for (const lang of ["en", "ja"]) expect((place.aliases ?? []).some((alias) => alias.kind === "wikipedia" && alias.lang === lang), `${place.id} ${lang}`).toBe(true);
    }
    // The titles that were cited before this release are all there.
    const was: [string, string, string][] = [
      ["hanshin-koshien-stadium", "en", "Koshien Stadium"],
      ["hanshin-koshien-stadium", "ja", "阪神甲子園球場"],
      ["mazda-stadium-hiroshima", "en", "Mazda Stadium"],
      ["mazda-stadium-hiroshima", "ja", "MAZDA Zoom-Zoom スタジアム広島"],
      ["rakuten-mobile-park-miyagi", "en", "Rakuten Mobile Park Miyagi"],
      ["rakuten-mobile-park-miyagi", "ja", "楽天モバイルパーク宮城"],
      ["globe-life-park-in-arlington", "en", "Choctaw Stadium"],
      ["nrg-stadium", "en", "Reliant Stadium"],
      ["nrg-stadium", "ja", "リライアント・スタジアム"],
      ["groupama-stadium", "en", "Parc Olympique Lyonnais"],
      ["olympiastadion-munich", "en", "Olympiastadion (Munich)"],
      ["olympiastadion-berlin", "en", "Olympiastadion (Berlin)"],
      ["nissan-stadium-yokohama", "ja", "横浜国際総合競技場"],
      ["etihad-stadium", "ja", "シティ・オブ・マンチェスター・スタジアム"],
      ["san-siro", "ja", "スタディオ・ジュゼッペ・メアッツァ"],
      ["maracana", "ja", "エスタジオ・ド・マラカナン"],
      ["monumental", "ja", "エスタディオ・モヌメンタル・アントニオ・ベスプチオ・リベルティ"],
      ["waldstadion-frankfurt", "ja", "ヴァルトシュタディオン"],
      ["kashima-soccer-stadium", "ja", "茨城県立カシマサッカースタジアム"],
      ["baltimore-memorial-stadium", "en", "Baltimore Memorial Stadium"],
      ["tiger-stadium", "en", "Tiger Stadium (Detroit)"],
    ];
    for (const [id, lang, title] of was) expect((PARKS[id] ?? GROUNDS[id]).aliases?.some((alias) => alias.kind === "wikipedia" && alias.lang === lang && alias.name === title), `${id} ${title}`).toBe(true);
  });

  it("say where each alias was read, with years in order and no alias twice", () => {
    for (const place of places) {
      const seen = new Set<string>();
      for (const alias of place.aliases ?? []) {
        expect(alias.name.trim().length, place.id).toBeGreaterThan(0);
        expect(["official", "wikipedia", "sponsor", "former", "nickname"], `${place.id} ${alias.name}`).toContain(alias.kind);
        expect(alias.lang, `${place.id} ${alias.name}`).toMatch(/^[a-z]{2,3}$/);
        expect(alias.source, `${place.id} ${alias.name}`).toMatch(/^(Wikidata Q\d+ |[a-z]{2}\.wikipedia\.org)/);
        if (alias.from !== undefined && alias.to !== undefined) expect(alias.from, `${place.id} ${alias.name}`).toBeLessThanOrEqual(alias.to);
        if (alias.kind === "wikipedia") expect(alias.source, place.id).toMatch(/^[a-z]{2}\.wikipedia\.org/);
        const key = JSON.stringify([plainName(alias.name), alias.lang, alias.kind, alias.from, alias.to]);
        expect(seen.has(key), `${place.id}: ${alias.name} twice`).toBe(false);
        seen.add(key);
      }
    }
  });

  it("name Japanese places the way Japanese media do, with the official name beside", () => {
    expect(PARKS["hanshin-koshien-stadium"]).toMatchObject({ name: "Koshien Stadium", nameJa: "甲子園球場" });
    expect(parkOfficialName(PARKS["hanshin-koshien-stadium"], "en")).toBe("Hanshin Koshien Stadium");
    expect(parkOfficialName(PARKS["hanshin-koshien-stadium"], "ja")).toBe("阪神甲子園球場");
    expect(PARKS["meiji-jingu-stadium"].nameJa).toBe("神宮球場");
    expect(PARKS["mazda-stadium-hiroshima"]).toMatchObject({ name: "Mazda Stadium", nameJa: "マツダスタジアム" });
    expect(parkOfficialName(PARKS["mazda-stadium-hiroshima"], "ja")).toBe("広島市民球場");
    expect(PARKS["yokohama-stadium"].nameJa).toBe("横浜スタジアム");
    expect(PARKS["tokyo-dome"].nameJa).toBe("東京ドーム");
    expect(GROUNDS["nissan-stadium-yokohama"]).toMatchObject({ name: "Nissan Stadium", nameJa: "日産スタジアム" });
    expect(groundOfficialName(GROUNDS["nissan-stadium-yokohama"], "ja")).toBe("横浜国際総合競技場");
    expect(groundOfficialName(GROUNDS["nissan-stadium-yokohama"], "en")).toBe("International Stadium Yokohama");
    expect(GROUNDS["san-siro"]).toMatchObject({ name: "San Siro", nameJa: "サン・シーロ" });
    expect(GROUNDS["etihad-stadium"]).toMatchObject({ name: "Etihad Stadium", nameJa: "エティハド・スタジアム" });
    expect(GROUNDS["groupama-stadium"]).toMatchObject({ name: "Groupama Stadium", nameJa: "グルパマ・スタジアム" });
    expect(GROUNDS["maracana"].nameJa).toBe("マラカナン");
    // Every place of Japan has its name in Japanese and an official name or a title beside it.
    for (const place of places.filter((one) => one.country === "JP")) expect(place.aliases?.some((alias) => alias.lang === "ja" && alias.kind === "wikipedia"), place.id).toBe(true);
  });

  it("name Houston's stadium as its source does: Reliant Stadium, which it was called before 2014 and again from 1 August 2026, and NRG Stadium in between", () => {
    const houston = GROUNDS["nrg-stadium"];
    expect(houston).toMatchObject({ name: "Reliant Stadium", nameJa: "リライアント・スタジアム" });
    expect(groundNameIn(houston, 2005)).toBe("Reliant Stadium");
    expect(groundNameIn(houston, 2019)).toBe("NRG Stadium");
    expect(groundNameIn(houston, 2026)).toBe("Houston Stadium");
    expect(groundNameIn(houston, 2027)).toBe("Reliant Stadium");
    expect(groundNameIn(houston)).toBe("Reliant Stadium");
    expect(houston.aliases?.find((alias) => alias.name === "NRG Stadium")).toMatchObject({ kind: "sponsor", from: 2014, to: 2026 });
    // The official name does not differ from the everyday one, so the description does not say it.
    expect(groundOfficialName(houston, "en")).toBeUndefined();
    expect(describeDrawing({ sport: "soccer", ground: "nrg-stadium" }).title).toBe("Reliant Stadium, soccer pitch");
    expect(describeDrawing({ sport: "soccer", ground: "nrg-stadium" }).description).not.toContain("official name");
    expect(describeDrawing({ sport: "soccer", ground: "nrg-stadium", year: 2019 }).title).toBe("NRG Stadium, soccer pitch");
    expect(describeDrawing({ sport: "soccer", ground: "nrg-stadium", year: 2026 }).title).toBe("Houston Stadium, soccer pitch");
  });
});

describe("plainName", () => {
  it("ignores case, accents, width, spaces, punctuation, kana and the long vowel mark", () => {
    expect(plainName("Estádio do Maracanã")).toBe(plainName("estadio do maracana"));
    expect(plainName("Sportsman's Park")).toBe(plainName("Sportsmans Park"));
    expect(plainName("St. Louis")).toBe(plainName("st louis"));
    expect(plainName("ﾏﾂﾀﾞｽﾀｼﾞｱﾑ")).toBe(plainName("マツダスタジアム"));
    expect(plainName("マツダ スタジアム")).toBe(plainName("マツダスタジアム"));
    expect(plainName("ヤンキー・スタジアム")).toBe(plainName("ヤンキースタジアム"));
    expect(plainName("はますた")).toBe(plainName("ハマスタ"));
    expect(plainName("ＦＮＢスタジアム")).toBe(plainName("FNBスタジアム"));
    expect(plainName("大阪スタヂアム")).toBe(plainName("大阪スタジアム"));
    expect(plainName("ヴァルトシュタディオン")).toBe(plainName("バルトシュタディオン"));
    expect(plainName("AT&T Park")).toBe(plainName("at t park"));
    expect(plainName("")).toBe("");
    expect(plainName("甲子園")).not.toBe(plainName("神宮"));
  });
});

describe("a park by any of its names", () => {
  it("is found by its everyday name, an alias, a nickname, a former name and a sponsor's name in English", () => {
    expect(parkByName("Koshien Stadium")?.id).toBe("hanshin-koshien-stadium");
    expect(parkByName("Hanshin Koshien Stadium")?.id).toBe("hanshin-koshien-stadium");
    expect(parkByName("camden yards")?.id).toBe("oriole-park-at-camden-yards");
    expect(parkByName("FENWAY")?.id).toBe("fenway-park");
    expect(parkByName("Safeco Field")?.id).toBe("t-mobile-park");
    expect(parkByName("Pacific Bell Park")?.id).toBe("oracle-park");
    expect(parkByName("Jacobs Field")?.id).toBe("progressive-field");
    expect(parkByName("Enron Field")?.id).toBe("daikin-park");
    expect(parkByName("Network Associates Coliseum")?.id).toBe("oakland-coliseum");
    expect(parkByName("Connie Mack Stadium")?.id).toBe("shibe-park");
    expect(parkByName("Tiger Stadium (Detroit)")?.id).toBe("tiger-stadium");
    expect(parkByName("Baltimore Memorial Stadium")?.id).toBe("baltimore-memorial-stadium");
    expect(parkByName("The Ballpark in Arlington")?.id).toBe("globe-life-park-in-arlington");
    expect(parkByName("Globe Life Park in Arlington")?.id).toBe("globe-life-park-in-arlington");
    expect(parkByName("Nagoya Dome")?.id).toBe("vantelin-dome-nagoya");
    expect(parkByName("Seibu Dome")?.id).toBe("belluna-dome");
    expect(parkByName("Fukuoka Dome")?.id).toBe("mizuho-paypay-dome-fukuoka");
    expect(parkByName("Big Egg")?.id).toBe("tokyo-dome");
    expect(parkByName("The Big Egg")?.id).toBe("tokyo-dome");
    expect(parkByName("the vet")?.id).toBe("veterans-stadium");
    expect(parkByName("Mazda Zoom-Zoom Stadium Hiroshima")?.id).toBe("mazda-stadium-hiroshima");
  });

  it("is found by its name in Japanese, its reading, a nickname and a spelling of it", () => {
    expect(parkByName("甲子園球場")?.id).toBe("hanshin-koshien-stadium");
    expect(parkByName("阪神甲子園球場")?.id).toBe("hanshin-koshien-stadium");
    expect(parkByName("甲子園")?.id).toBe("hanshin-koshien-stadium");
    expect(parkByName("こうしえんきゅうじょう")?.id).toBe("hanshin-koshien-stadium");
    expect(parkByName("神宮球場")?.id).toBe("meiji-jingu-stadium");
    expect(parkByName("明治神宮野球場")?.id).toBe("meiji-jingu-stadium");
    expect(parkByName("ハマスタ")?.id).toBe("yokohama-stadium");
    expect(parkByName("はますた")?.id).toBe("yokohama-stadium");
    expect(parkByName("マツダスタジアム")?.id).toBe("mazda-stadium-hiroshima");
    expect(parkByName("ﾏﾂﾀﾞｽﾀｼﾞｱﾑ")?.id).toBe("mazda-stadium-hiroshima");
    expect(parkByName("広島市民球場")?.id).toBe("mazda-stadium-hiroshima");
    expect(parkByName("ナゴヤドーム")?.id).toBe("vantelin-dome-nagoya");
    expect(parkByName("バンテリンドーム ナゴヤ")?.id).toBe("vantelin-dome-nagoya");
    expect(parkByName("福岡ドーム")?.id).toBe("mizuho-paypay-dome-fukuoka");
    expect(parkByName("ヤンキースタジアム")?.id).toBe("yankee-stadium");
    expect(parkByName("フェンウェイ・パーク")?.id).toBe("fenway-park");
    expect(parkByName("カムデン・ヤーズ")?.id).toBe("oriole-park-at-camden-yards");
    expect(parkByName("セーフコー・フィールド")?.id).toBe("t-mobile-park");
    expect(parkByName("後楽園スタヂアム")?.id).toBe("korakuen-stadium");
    expect(parkByName("大阪スタジアム")?.id).toBe("osaka-stadium");
    expect(parkByName("旧広島市民球場")?.id).toBe("hiroshima-municipal-stadium");
  });

  it("puts the everyday name before an alias, and a nickname last, and finds nothing for what is not a name", () => {
    expect(parksByName("wrigley field").map((park) => park.id)).toEqual(["wrigley-field", "wrigley-field-los-angeles"]);
    expect(parkByName("Wrigley Field (Los Angeles)")?.id).toBe("wrigley-field-los-angeles");
    expect(parksByName("Yankee Stadium").map((park) => park.id)).toEqual(["yankee-stadium", "yankee-stadium-1923"]);
    expect(parksByName("Memorial Stadium").map((park) => park.id)).toContain("baltimore-memorial-stadium");
    expect(parkByName("Nowhere Park")).toBeUndefined();
    expect(parkByName("")).toBeUndefined();
    expect(parkByName(undefined)).toBeUndefined();
    expect(parkByName("   ")).toBeUndefined();
  });
});

describe("a ground by any of its names", () => {
  it("is found by its names in English, the language of the place and Japanese, and by its official, sponsor, former and dated names", () => {
    const find: [string, string][] = [
      ["Giuseppe Meazza Stadium", "san-siro"],
      ["San Siro", "san-siro"],
      ["Stadio Giuseppe Meazza", "san-siro"],
      ["stadio san siro", "san-siro"],
      ["サン・シーロ", "san-siro"],
      ["サンシーロ", "san-siro"],
      ["スタディオ・ジュゼッペ・メアッツァ", "san-siro"],
      ["Nissan Stadium", "nissan-stadium-yokohama"],
      ["International Stadium Yokohama", "nissan-stadium-yokohama"],
      ["日産スタジアム", "nissan-stadium-yokohama"],
      ["にっさんすたじあむ", "nissan-stadium-yokohama"],
      ["横浜国際総合競技場", "nissan-stadium-yokohama"],
      ["よこはまこくさいそうごうきょうぎじょう", "nissan-stadium-yokohama"],
      ["Maracanã", "maracana"],
      ["maracana stadium", "maracana"],
      ["Estádio do Maracanã", "maracana"],
      ["Estadio Jornalista Mario Filho", "maracana"],
      ["マラカナン", "maracana"],
      ["エスタジオ・ド・マラカナン", "maracana"],
      ["Etihad Stadium", "etihad-stadium"],
      ["City of Manchester Stadium", "etihad-stadium"],
      ["エティハド・スタジアム", "etihad-stadium"],
      ["シティ・オブ・マンチェスター・スタジアム", "etihad-stadium"],
      ["Groupama Stadium", "groupama-stadium"],
      ["Parc Olympique Lyonnais", "groupama-stadium"],
      ["Stade des Lumières", "groupama-stadium"],
      ["グルパマ・スタジアム", "groupama-stadium"],
      ["NRG Stadium", "nrg-stadium"],
      ["Reliant Stadium", "nrg-stadium"],
      ["Houston Stadium", "nrg-stadium"],
      ["NRGスタジアム", "nrg-stadium"],
      ["Soccer City", "soccer-city"],
      ["FNB Stadium", "soccer-city"],
      ["Estadio Banorte", "estadio-azteca"],
      ["Estadio Ciudad de México", "estadio-azteca"],
      ["Westfalenstadion", "signal-iduna-park"],
      ["Signal Iduna Park", "signal-iduna-park"],
      ["Waldstadion", "waldstadion-frankfurt"],
      ["Commerzbank-Arena", "waldstadion-frankfurt"],
      ["ドイチェ・バンク・パルク", "waldstadion-frankfurt"],
      ["Лужники", "luzhniki"],
      ["Central Lenin Stadium", "luzhniki"],
      ["La Bombonera", "la-bombonera"],
      ["Estadio Alberto José Armando", "la-bombonera"],
      ["Amsterdam ArenA", "johan-cruyff-arena"],
      ["Johan Cruijff ArenA", "johan-cruyff-arena"],
      ["Juventus Stadium", "allianz-stadium-turin"],
      ["Munich Olympic Stadium", "olympiastadion-munich"],
      ["Olympiastadion (Berlin)", "olympiastadion-berlin"],
      ["Berlin Olympic Stadium", "olympiastadion-berlin"],
      ["Empire Stadium", "wembley-1923"],
      ["Joe Robbie Stadium", "hard-rock-stadium"],
      ["Qwest Field", "lumen-field"],
      ["Telstra Stadium", "stadium-australia"],
      ["カシマサッカースタジアム", "kashima-soccer-stadium"],
      ["茨城県立カシマサッカースタジアム", "kashima-soccer-stadium"],
      ["Mercari Stadium", "kashima-soccer-stadium"],
      ["国立競技場", "japan-national-stadium"],
      ["埼スタ", "saitama-stadium-2002"],
      ["天河体育场", "tianhe-stadium"],
    ];
    for (const [name, id] of find) expect(groundByName(name)?.id, name).toBe(id);
    expect(groundsByName("stadium australia")).toHaveLength(1);
    expect(groundByName("Nowhere Stadium")).toBeUndefined();
    expect(groundByName(undefined)).toBeUndefined();
  });

  it("says what the ground is officially called, in the year, when that is not the name shown", () => {
    expect(groundOfficialName(GROUNDS["groupama-stadium"], "en")).toBe("Parc Olympique Lyonnais");
    expect(groundOfficialName(GROUNDS["groupama-stadium"], "ja")).toBe("パルク・オリンピック・リヨン");
    expect(groundOfficialName(GROUNDS["etihad-stadium"], "en")).toBe("City of Manchester Stadium");
    expect(groundOfficialName(GROUNDS["estadio-azteca"], "en")).toBe("Estadio Banorte");
    expect(groundOfficialName(GROUNDS["camp-nou"], "en")).toBe("Spotify Camp Nou");
    expect(groundOfficialName(GROUNDS["maracana"], "en")).toBe("Estádio Jornalista Mário Filho");
    expect(groundOfficialName(GROUNDS["old-trafford"], "en")).toBeUndefined();
    // A name a World Cup gave a ground for a year is not followed by what it is officially called.
    expect(groundOfficialName(GROUNDS["estadio-azteca"], "en", 2026)).toBeUndefined();
    // The official name of a language that is neither the language of the drawing nor the place's has no place in it.
    expect(officialName(GROUNDS["lusail"], "en")).toBeUndefined();
  });
});

describe("the atlas by name", () => {
  it("finds a place by any name, parks and grounds together, best match first", () => {
    expect(placeByName("Koshien Stadium")?.id).toBe("hanshin-koshien-stadium");
    expect(placeByName("甲子園")?.id).toBe("hanshin-koshien-stadium");
    expect(placeByName("サン・シーロ")?.id).toBe("san-siro");
    expect(placeByName("Estadio Jornalista Mario Filho")?.id).toBe("maracana");
    expect(placeByName("Camden Yards")?.kind).toBe("park");
    expect(placeByName("Anfield")?.kind).toBe("ground");
    expect(placesByName("wrigley field").map((place) => place.id)).toEqual(["wrigley-field", "wrigley-field-los-angeles"]);
    expect(placeByName("nothing")).toBeUndefined();
    expect(placeById("san-siro")?.localName).toBe("San Siro");
  });

  it("is searched by the aliases and the readings too", () => {
    expect(placesBy({ text: "meazza" }).map((place) => place.id)).toEqual(["san-siro"]);
    expect(placesBy({ text: "甲子園" }).map((place) => place.id)).toEqual(["hanshin-koshien-stadium"]);
    expect(placesBy({ text: "こうしえん" }).map((place) => place.id)).toEqual(["hanshin-koshien-stadium"]);
    expect(placesBy({ text: "camden" }).map((place) => place.id)).toEqual(["oriole-park-at-camden-yards"]);
    expect(placesBy({ text: "safeco" }).map((place) => place.id)).toEqual(["t-mobile-park"]);
    expect(placesBy({ text: "ハマスタ" }).map((place) => place.id)).toEqual(["yokohama-stadium"]);
    expect(placesBy({ text: "Maracana", sport: "soccer" })).toHaveLength(1);
    expect(placesBy({ text: "red sox fenway" }).map((place) => place.id)).toEqual(["fenway-park"]);
    expect(placesBy({ text: "JP", sport: "baseball" }).length).toBe(20);
  });
});

describe("drawings with the names", () => {
  const hashOf = (options: Record<string, unknown>): string => hash(drawKyogijo({ sport: "soccer", ...options }));
  // The drawings whose name is not what it was, or that gained the sentence that says the official name; every other drawing is byte for byte what it was.
  const GROUNDS_EN_CHANGED = [
    "stade-yves-du-manoir", "maracana", "estadio-nacional-santiago", "estadio-azteca", "olympiastadion-munich", "nissan-stadium-yokohama", "olympiastadion-berlin",
    "groupama-stadium", "camp-nou", "san-siro", "la-bombonera", "estadio-da-luz", "etihad-stadium", "johan-cruyff-arena", "kashima-soccer-stadium",
  ];
  const GROUNDS_JA_CHANGED = ["maracana", "monumental", "nissan-stadium-yokohama", "waldstadion-frankfurt", "groupama-stadium", "san-siro", "etihad-stadium", "kashima-soccer-stadium"];

  it("of a ground are what they were where the ground's name and official name did not change", () => {
    expect(Object.keys(GROUNDS_BEFORE_EN)).toHaveLength(64);
    for (const [id, was] of Object.entries(GROUNDS_BEFORE_EN)) {
      const now = hashOf({ ground: id });
      if (GROUNDS_EN_CHANGED.includes(id)) expect(now, id).not.toBe(was);
      else expect(now, id).toBe(was);
    }
    for (const [id, was] of Object.entries(GROUNDS_BEFORE_JA)) {
      const now = hashOf({ ground: id, language: "ja" });
      if (GROUNDS_JA_CHANGED.includes(id)) expect(now, id).not.toBe(was);
      else expect(now, id).toBe(was);
    }
  });

  it("of the parks of Japan are what they were where the park was named in Japanese already and its name did not change", () => {
    expect(Object.keys(PARKS_BEFORE_JA)).toHaveLength(10);
    for (const [id, was] of Object.entries(PARKS_BEFORE_JA)) expect(hash(drawKyogijo({ sport: "mlb", park: id, language: "ja" })), id).toBe(was);
  });

  it("are titled with the everyday name in their language, and say the official name when it is another", () => {
    const koshien = describeDrawing({ sport: "mlb", park: "hanshin-koshien-stadium" });
    expect(koshien.title).toBe("Koshien Stadium, baseball field");
    expect(koshien.description).toContain("The outfield fence follows the figures published for Koshien Stadium. Its official name is Hanshin Koshien Stadium.");
    const koshienJa = describeDrawing({ sport: "mlb", park: "hanshin-koshien-stadium", language: "ja" });
    expect(koshienJa.title).toBe("甲子園球場のグラウンド");
    expect(koshienJa.description).toContain("外野フェンスは、甲子園球場の公表されている距離をもとに描かれています。正式名称は阪神甲子園球場です。");
    expect(describeDrawing({ sport: "mlb", park: "mazda-stadium-hiroshima", language: "ja" }).title).toBe("マツダスタジアムのグラウンド");
    expect(describeDrawing({ sport: "mlb", park: "fenway-park", language: "ja" }).title).toBe("フェンウェイ・パークのグラウンド");
    expect(describeDrawing({ sport: "mlb", park: "fenway-park", language: "ja" }).description).not.toContain("正式名称");
    expect(describeDrawing({ sport: "mlb", park: "fenway-park" }).description).not.toContain("official name");
    const nissan = describeDrawing({ sport: "soccer", ground: "nissan-stadium-yokohama", language: "ja" });
    expect(nissan.title).toBe("日産スタジアムのピッチ");
    expect(nissan.description).toContain("正式名称は横浜国際総合競技場です。");
    expect(describeDrawing({ sport: "soccer", ground: "nissan-stadium-yokohama" }).description).toContain("Its official name is International Stadium Yokohama.");
    // In the year the ground had another name, the name of the year is the title.
    expect(describeDrawing({ sport: "soccer", ground: "nissan-stadium-yokohama", year: 2002 }).title).toBe("International Stadium Yokohama, soccer pitch");
    expect(describeDrawing({ sport: "soccer", ground: "groupama-stadium" }).title).toBe("Groupama Stadium, soccer pitch");
    expect(describeDrawing({ sport: "mlb", park: "oakland-coliseum", year: 2000 }).description).not.toContain("official name");
    expect(describeDrawing({ sport: "mlb", park: "oakland-coliseum", year: 1990 }).description).toContain("Its official name is Oakland–Alameda County Coliseum.");
    expect(describeDrawing({ sport: "mlb", park: "oakland-coliseum" }).description).toContain("Its official name is Oakland–Alameda County Coliseum.");
    // A park of the United States, drawn in Japanese, has the name Japanese media use.
    expect(describeDrawing({ sport: "mlb", park: "oracle-park", language: "ja" }).title).toBe("オラクル・パークのグラウンド");
  });
});
