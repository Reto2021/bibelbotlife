import { describe, expect, it } from "vitest";
import { resolveCompanion } from "../../supabase/functions/_shared/companions";
import { parseTelegramCommand } from "../../supabase/functions/telegram-poll/commands";

describe("companion choice", () => {
  it("keeps an explicit choice", () => {
    expect(resolveCompanion("jonas", ["Ich bin schwanger"])).toBe("jonas");
  });
  it("auto picks Jonas for a man's question", () => {
    expect(resolveCompanion("auto", ["Als Mann komme ich von Pornos nicht los"])).toBe("jonas");
  });
  it("auto picks Lea for a woman's question", () => {
    expect(resolveCompanion("auto", ["Ich hatte eine Fehlgeburt"])).toBe("lea");
  });
  it("auto defaults to Lea", () => {
    expect(resolveCompanion("auto", ["Ich fühle mich leer"])).toBe("lea");
  });
  it("parses /jonas@Bot", () => {
    expect(parseTelegramCommand("/jonas@BibleBot")).toEqual({ kind: "companion", companion: "jonas" });
  });
});
