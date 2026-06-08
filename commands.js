const { PermissionFlagsBits, SlashCommandBuilder } = require('discord.js');
const { getGuildConfig } = require('./utils/configStore');
const { normalizeStoredWelcomeMessage } = require('./welcome/messageRenderer');
const { buildWelcomeSetupModal } = require('./welcome/setupModal');
const { setPendingWelcomeSetup } = require('./welcome/setupState');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('환영합니다')
        .setDescription('환영 DM 설정 모달을 엽니다.')
        .addChannelOption(option =>
            option.setName('로그채널').setDescription('DM 실패 시 알림 채널').setRequired(true))
        .addChannelOption(option =>
            option.setName('입장로그채널').setDescription('새 멤버 입장 알림을 보낼 채널').setRequired(true))
        .addStringOption(option =>
            option.setName('움짤').setDescription('임베드 하단 GIF 주소 (선택 사항)').setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const logChannel = interaction.options.getChannel('로그채널');
        const joinLogChannel = interaction.options.getChannel('입장로그채널');
        const gifUrl = interaction.options.getString('움짤');
        const currentConfig = getGuildConfig(interaction.guildId);
        const initialMessage = currentConfig?.message
            ? normalizeStoredWelcomeMessage(currentConfig.message)
            : '';

        setPendingWelcomeSetup({
            guildId: interaction.guildId,
            userId: interaction.user.id,
            logChannelId: logChannel.id,
            joinLogChannelId: joinLogChannel.id,
            gifUrl,
        });

        const modal = buildWelcomeSetupModal({ initialMessage });
        await interaction.showModal(modal);
    },
};
