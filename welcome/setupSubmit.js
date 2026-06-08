const { setGuildConfig } = require('../utils/configStore');
const {
    WELCOME_MESSAGE_INPUT_ID,
} = require('./setupModal');
const {
    consumePendingWelcomeSetup,
} = require('./setupState');
const {
    normalizeStoredWelcomeMessage,
} = require('./messageRenderer');

async function handleWelcomeSetupSubmit(interaction) {
    const pendingSetup = consumePendingWelcomeSetup(interaction.guildId, interaction.user.id);

    if (!pendingSetup) {
        await interaction.reply({
            content: '설정 정보를 찾지 못했습니다. `/환영합니다`를 다시 실행한 뒤 모달을 제출해 주세요.',
            ephemeral: true,
        });
        return;
    }

    const rawMessage = interaction.fields.getTextInputValue(WELCOME_MESSAGE_INPUT_ID);
    const message = normalizeStoredWelcomeMessage(rawMessage);

    if (!message.trim()) {
        await interaction.reply({
            content: '환영 메시지는 비워둘 수 없습니다. 다시 시도해 주세요.',
            ephemeral: true,
        });
        return;
    }

    setGuildConfig(interaction.guildId, {
        logChannelId: pendingSetup.logChannelId,
        message,
        gif: pendingSetup.gifUrl || null,
        joinLogChannelId: pendingSetup.joinLogChannelId || null,
    });

    const responseParts = ['✅ 설정 완료!'];

    if (pendingSetup.gifUrl) {
        responseParts.push('GIF 포함');
    }

    responseParts.push('줄바꿈은 Enter로 입력한 그대로 저장됩니다.');
    responseParts.push('사용 가능한 변수: `{user}`, `{guild}`');

    await interaction.reply({
        content: responseParts.join(' '),
        ephemeral: true,
    });
}

module.exports = {
    handleWelcomeSetupSubmit,
};
