const fs = require('fs');
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('환영합니다')
        .setDescription('환영 DM 설정을 진행합니다.')
        .addChannelOption(option => 
            option.setName('로그채널').setDescription('DM 실패 시 알림 채널').setRequired(true))
        .addStringOption(option => 
            option.setName('메시지').setDescription('소개글을 입력하세요.').setRequired(true))
        .addChannelOption(option =>
            option.setName('입장로그채널').setDescription('새 멤버 입장 알림을 보낼 채널').setRequired(true))
        .addStringOption(option => 
            // setRequired를 false로 변경하여 선택 사항으로 만듭니다.
            option.setName('움짤').setDescription('임베드 하단 GIF 주소 (선택 사항)').setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const logChannel = interaction.options.getChannel('로그채널');
        const welcomeMsg = interaction.options.getString('메시지');
        const gifUrl = interaction.options.getString('움짤'); // 값이 없으면 null이 들어옵니다.
        const joinLogChannel = interaction.options.getChannel('입장로그채널');
        const guildId = interaction.guildId;

        // 기존 데이터 로드 (파일이 없으면 빈 객체 생성)
        let data = {};
        if (fs.existsSync('./config.json')) {
            data = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));
        }
        
        data[guildId] = {
            logChannelId: logChannel.id,
            message: welcomeMsg,
            gif: gifUrl, // null일 경우 그대로 저장됨
            joinLogChannelId: joinLogChannel ? joinLogChannel.id : null // 새 멤버 입장 로그 채널 ID 저장
        };

        fs.writeFileSync('./config.json', JSON.stringify(data, null, 2));

        await interaction.reply({ 
            content: `✅ 설정 완료! ${gifUrl ? '(GIF 포함)' : '(텍스트 전용)'}`, 
            ephemeral: true 
        });
    }
};