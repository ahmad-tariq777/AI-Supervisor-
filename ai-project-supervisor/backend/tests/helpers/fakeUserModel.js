function applyUpdate(doc, update) {
  if (update.$push?.refreshSessions) {
    const { $each, $slice } = update.$push.refreshSessions;
    const next = [...doc.refreshSessions, ...$each];
    doc.refreshSessions = $slice && $slice < 0 ? next.slice($slice) : next;
  }
  if (update.$pull?.refreshSessions) {
    const { tokenHash } = update.$pull.refreshSessions;
    doc.refreshSessions = doc.refreshSessions.filter((session) => session.tokenHash !== tokenHash);
  }
  if (update.$set) {
    for (const [key, value] of Object.entries(update.$set)) {
      if (key.includes('.')) {
        const [parent, child] = key.split('.');
        doc[parent] = { ...doc[parent], [child]: value };
      } else {
        doc[key] = value;
      }
    }
  }
}

export function createFakeUserModel() {
  const users = [];
  let sequence = 0;

  const matches = (doc, filter) =>
    Object.entries(filter).every(([key, value]) => doc[key] === value);

  return {
    users,

    async create(data) {
      if (users.some((user) => user.email === data.email)) {
        throw Object.assign(new Error('duplicate key'), { code: 11000 });
      }
      sequence += 1;
      const id = `user-${sequence}`;
      const doc = {
        _id: id,
        id,
        isActive: true,
        profile: { skills: [] },
        refreshSessions: [],
        ...data
      };
      users.push(doc);
      return doc;
    },

    findOne(filter) {
      const doc = users.find((user) => matches(user, filter)) ?? null;
      return { select: async () => doc };
    },

    async findOneAndUpdate(filter, update) {
      const hash = filter['refreshSessions.tokenHash'];
      const doc = users.find(
        (user) =>
          user._id === filter._id &&
          user.refreshSessions.some((session) => session.tokenHash === hash)
      );
      if (!doc) return null;
      const before = { ...doc };
      applyUpdate(doc, update);
      return before;
    },

    async updateOne(filter, update) {
      const doc = users.find((user) => user._id === filter._id);
      if (doc) applyUpdate(doc, update);
    },

    findById(id) {
      const doc = users.find((user) => user._id === id) ?? null;
      return {
        select: async () => doc,
        then: (resolve, reject) => Promise.resolve(doc).then(resolve, reject)
      };
    },

    async findByIdAndUpdate(id, update) {
      const doc = users.find((user) => user._id === id);
      if (!doc) return null;
      applyUpdate(doc, update);
      return doc;
    }
  };
}
