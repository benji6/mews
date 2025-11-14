export const chordIndexToPeriod = (i: number): number => 1 + i / 96;

export const sortedDefaultDict = <V>(createDefaultValue: () => V) =>
  new Proxy<Record<string, V>>(Object.create(null), {
    get: (target, key: string): V => {
      if (!Object.hasOwn(target, key)) target[key] = createDefaultValue();
      return target[key];
    },
    ownKeys: (target) =>
      Reflect.ownKeys(target).sort((a, b) => Number(a) - Number(b)),
  });
