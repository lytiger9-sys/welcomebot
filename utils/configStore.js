const fs = require('node:fs');
const path = require('node:path');

const CONFIG_PATH = path.join(__dirname, '..', 'config.json');

function readConfigFile() {
    if (!fs.existsSync(CONFIG_PATH)) {
        return {};
    }

    try {
        return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    } catch (error) {
        throw new Error(`Failed to read config.json: ${error.message}`);
    }
}

function writeConfigFile(data) {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(data, null, 2));
}

function getGuildConfig(guildId) {
    const data = readConfigFile();
    return data[guildId] || null;
}

function setGuildConfig(guildId, config) {
    const data = readConfigFile();
    data[guildId] = config;
    writeConfigFile(data);
    return config;
}

module.exports = {
    CONFIG_PATH,
    getGuildConfig,
    readConfigFile,
    setGuildConfig,
    writeConfigFile,
};
