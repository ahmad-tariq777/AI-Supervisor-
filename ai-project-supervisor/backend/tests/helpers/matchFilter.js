function collect(doc, path) {
  let values = [doc];
  for (const part of path.split('.')) {
    values = values
      .flatMap((value) => (value === null || value === undefined ? [] : [value[part]]))
      .flatMap((value) => (Array.isArray(value) ? value : [value]));
  }
  return values.filter((value) => value !== undefined && value !== null);
}

function matchesCondition(values, condition) {
  if (condition !== null && typeof condition === 'object' && '$in' in condition) {
    const wanted = condition.$in.map(String);
    return values.some((value) => wanted.includes(String(value)));
  }
  return values.some((value) => String(value) === String(condition));
}

export function matchFilter(doc, filter) {
  return Object.entries(filter).every(([key, condition]) => {
    if (key === '$or') return condition.some((branch) => matchFilter(doc, branch));
    return matchesCondition(collect(doc, key), condition);
  });
}

export function createQuery(items) {
  let list = [...items];
  const query = {
    sort(spec) {
      const entries = Object.entries(spec);
      list.sort((a, b) => {
        for (const [key, direction] of entries) {
          if (a[key] > b[key]) return direction;
          if (a[key] < b[key]) return -direction;
        }
        return 0;
      });
      return query;
    },
    skip(count) {
      list = list.slice(count);
      return query;
    },
    limit(count) {
      list = list.slice(0, count);
      return query;
    },
    select() {
      return query;
    },
    then(resolve, reject) {
      return Promise.resolve(list).then(resolve, reject);
    }
  };
  return query;
}
