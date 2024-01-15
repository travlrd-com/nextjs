
export function objectFromFormDataWithRepeatableFields(formData: FormData) {
  let it;

  it = [...formData.entries()] as [string, string][];

  group_by_key: {
    it = it.reduce((acc, [key, value]) => {
      if (acc[key]) {
        acc[key].push(value);
      } else {
        acc[key] = [value];
      }
      return acc;
    }, {} as Record<string, string[]>);
  }

  unwrap_single_values: {
    it = Object.entries(it);
    it = it.map(([key, value]) => {
      if (value.length === 1) {
        return [key, value[0]] as const;
      }
      return [key, value] as const;
    });
    it = it.reduce((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {} as Record<string, string | string[]>);
  }

  return it as Record<string, string | string[]>;
}