require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const setupCommand = require('./commands.js');
const { startWebServer } = require('./web/server');
const { startSelfPing } = require('./web/selfPing');
const { buildJoinLogCard } = require('./messages/joinLogCard');

startWebServer();
startSelfPing(
    process.env.SELF_PING_URL ||
    process.env.RENDER_EXTERNAL_URL ||
    process.env.PUBLIC_URL ||
    null
);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers, // 신규 멤버 감지용
        GatewayIntentBits.GuildInvites, // 초대 정보 감지용
    ]
});

const TOKEN = process.env.DISCORD_TOKEN;

// 서버별 초대 정보를 저장할 Map (초대자 추적용)
const invites = new Map();

// 봇이 준비되었을 때 실행
client.once('ready', async () => {
    try {
        // 슬래시 명령어 등록
        await client.application.commands.create(setupCommand.data);
        console.log(`✅ 로그인 완료: ${client.user.tag}`);
        console.log(`🚀 봇이 현재 ${client.guilds.cache.size}개의 서버에서 작동 중입니다.`);

        // 봇이 시작될 때 모든 서버의 초대 정보를 캐싱
        client.guilds.cache.forEach(async guild => {
            try {
                const guildInvites = await guild.invites.fetch();
                // 초대 코드와 사용 횟수를 Map 형태로 저장
                invites.set(guild.id, new Map(guildInvites.map(invite => [invite.code, invite.uses])));
            } catch (error) {
                console.error(`[오류] ${guild.name} 서버의 초대 정보를 가져오는 데 실패했습니다:`, error);
            }
        });
    } catch (error) {
        console.error('명령어 등록 중 오류 발생:', error);
    }
});

// 초대 생성 이벤트 핸들링 (새로운 초대가 생성될 때 캐시 업데이트)
client.on('inviteCreate', invite => {
    if (invite.guild && invite.code && invite.uses !== null) {
        const guildInvites = invites.get(invite.guild.id);
        if (guildInvites) {
            guildInvites.set(invite.code, invite.uses);
        } else {
            invites.set(invite.guild.id, new Map([[invite.code, invite.uses]]));
        }
    }
});

// 초대 삭제 이벤트 핸들링 (초대가 삭제될 때 캐시 업데이트)
client.on('inviteDelete', invite => {
    if (invite.guild && invite.code) invites.get(invite.guild.id)?.delete(invite.code);
});

// 명령어 실행 핸들링
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === '환영합니다') {
        await setupCommand.execute(interaction);
    }
});

// 신규 멤버 입장 시 DM 발송 로직
client.on('guildMemberAdd', async (member) => {
    const filePath = './config.json';

    // 설정 파일이 없으면 중단
    if (!fs.existsSync(filePath)) return;

    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const config = data[member.guild.id];

    // 해당 서버의 설정이 없으면 중단
    if (!config) return;

    try {
        // 임베드 디자인 (검은색 테두리 + 서버 이름 + 메시지 + 선택적 GIF)
        const welcomeEmbed = new EmbedBuilder()
            .setColor(0x000000) // 검은색 테두리
            .setAuthor({
                name: member.guild.name,
                iconURL: member.guild.iconURL() || null
            }) // 상단 굵은 흰색 글씨 효과
            .setDescription(config.message.replace('{user}', `<@${member.id}>`).replace(/\\n/g, '\n')) // 소개글 (흰색 작은 글씨)
            .setTimestamp();

        // 관리자가 GIF를 등록했을 경우에만 이미지 추가
        if (config.gif) {
            welcomeEmbed.setImage(config.gif);
        }

        // 유저에게 DM 전송
        await member.send({ embeds: [welcomeEmbed] });
        console.log(`[성공] ${member.user.tag}님에게 DM을 보냈습니다.`);

    } catch (err) {
        console.log(`[실패] ${member.user.tag}님이 DM을 차단했거나 오류가 발생했습니다.`);

        // DM 실패 시 관리자가 설정한 로그 채널로 알림 전송
        const logChannel = member.guild.channels.cache.get(config.logChannelId);
        if (logChannel) {
            logChannel.send({
                content: `⚠️ ${member}님에게 환영 DM을 보내지 못했습니다. (개인 메시지 수신 거부 상태)`
            });
        }
    }

    // --- 신규 멤버 입장 로그 채널 알림 기능 (추가된 부분) ---
    if (config.joinLogChannelId) {
        const joinLogChannel = member.guild.channels.cache.get(config.joinLogChannelId);

        if (joinLogChannel && joinLogChannel.isTextBased()) {
            let inviterTag = '알 수 없음';

            try {
                // 현재 서버의 모든 초대 정보를 다시 가져옴
                const newInvites = await member.guild.invites.fetch();
                // 캐시되어 있던 이전 초대 정보
                const oldInvites = invites.get(member.guild.id);

                // 사용 횟수가 증가한 초대를 찾아 초대자와 코드 식별
                const usedInvite = newInvites.find(i => oldInvites && (oldInvites.get(i.code) || 0) < i.uses);

                if (usedInvite) {
                    inviterTag = usedInvite.inviter ? usedInvite.inviter.tag : '알 수 없음';
                }

                // 다음 입장을 위해 초대 캐시 업데이트
                invites.set(member.guild.id, new Map(newInvites.map(invite => [invite.code, invite.uses])));

            } catch (error) {
                console.error('[오류] 초대자 추적 중 문제가 발생했습니다:', error);
                inviterTag = '정보를 가져올 수 없음 (권한 부족 등)';
            }

            function getRandomItem(array) {
                const index = Math.floor(Math.random() * array.length);
                return array[index];
            }
            const emoji = ["<:__1:1509339194525483109>", "<:__2:1509339192512221264>", "<:__3:1509339190809202698>", "<:__4:1509339188997263480>", "<:__5:1509339133821059152>", "<:__6:1509339131916849275>", "<:__7:1509339130088132738>", "<:__8:1509339128112742410>", "<:__9:1509339126309195856>", "<:__10:1509339122974593104>", "<:__11:1509339121083089057>", "<:__12:1509339119321481288>", "<:__13:1509339117341900841>"];
            const randomEmoji = getRandomItem(emoji);

            await joinLogChannel.send(buildJoinLogCard({
                member,
                inviterTag,
                randomEmoji,
            }));
            console.log(`[성공] ${member.user.tag}님의 입장 로그를 전송했습니다.`);
        }
    }
});

// 봇 로그인
client.login(TOKEN);
