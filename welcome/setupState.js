const pendingSetups = new Map();

const SETUP_TTL_MS = Number(process.env.WELCOME_SETUP_TTL_MS || 10 * 60 * 1000);

function getSetupKey(guildId, userId) {
    return `${guildId}:${userId}`;
}

function setPendingWelcomeSetup(setup) {
    const key = getSetupKey(setup.guildId, setup.userId);
    const existing = pendingSetups.get(key);

    if (existing?.timeout) {
        clearTimeout(existing.timeout);
    }

    const timeout = setTimeout(() => {
        pendingSetups.delete(key);
    }, SETUP_TTL_MS);

    pendingSetups.set(key, {
        ...setup,
        timeout,
        createdAt: Date.now(),
    });

    return key;
}

function consumePendingWelcomeSetup(guildId, userId) {
    const key = getSetupKey(guildId, userId);
    const entry = pendingSetups.get(key);

    if (!entry) {
        return null;
    }

    pendingSetups.delete(key);

    if (entry.timeout) {
        clearTimeout(entry.timeout);
    }

    return entry;
}

module.exports = {
    consumePendingWelcomeSetup,
    getSetupKey,
    setPendingWelcomeSetup,
};
