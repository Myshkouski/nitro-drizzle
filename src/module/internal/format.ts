import { dedent } from "strip-indent";

export function script(strings: TemplateStringsArray, ...values: unknown[]): string {
  const rawStrings = strings.raw;
  let result = "";

  for (let i = 0; i < rawStrings.length; i++) {
    const string = rawStrings[i];
    result += string;

    if (i < values.length) {
      let valueStr = String(values[i]);
      const match = string.match(/\n([\t\s]*)([^\t\s]*)$/g)?.at(0);
      if (match) {
        valueStr = valueStr.replaceAll("\n", match);
      }
      result += valueStr;
    }
  }

  return dedent(result);
}
