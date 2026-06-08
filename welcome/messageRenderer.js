function normalizeStoredWelcomeMessage(message) {
    return String(message ?? '').replace(/\\n/g, '\n');
}

function renderWelcomeMessage(template, member) {
    const normalized = normalizeStoredWelcomeMessage(template);

    return normalized
        .replace(/\{user\}/g, `<@${member.id}>`)
        .replace(/\{guild\}/g, member.guild.name);
}

module.exports = {
    normalizeStoredWelcomeMessage,
    renderWelcomeMessage,
};
