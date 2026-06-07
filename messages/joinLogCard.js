const {
    ContainerBuilder,
    MediaGalleryBuilder,
    MediaGalleryItemBuilder,
    MessageFlags,
    SectionBuilder,
    SeparatorBuilder,
    TextDisplayBuilder,
    ThumbnailBuilder,
} = require('discord.js');

function buildJoinLogCard({ member, inviterTag, randomEmoji, gifUrl }) {
    const detailsText = [
        `**멤버:** ${member.user.tag} (${member.id}) ${randomEmoji}`,
        `**초대자:** ${inviterTag}`,
        `**현재 서버 인원:** ${member.guild.memberCount}명`,
    ].join('\n');

    const summarySection = new SectionBuilder()
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(detailsText)
        )
        .setThumbnailAccessory(
            new ThumbnailBuilder()
                .setURL(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
                .setDescription(member.user.tag)
        );

    const container = new ContainerBuilder()
        .setAccentColor(0x00ff00)
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`# 새로운 멤버가 입장했습니다!\n${member.guild.name}`)
        )
        .addSeparatorComponents(
            new SeparatorBuilder().setDivider(true)
        )
        .addSectionComponents(summarySection);

    if (gifUrl) {
        container
            .addSeparatorComponents(
                new SeparatorBuilder().setDivider(true)
            )
            .addMediaGalleryComponents(
                new MediaGalleryBuilder().addItems(
                    new MediaGalleryItemBuilder()
                        .setURL(gifUrl)
                        .setDescription(`${member.guild.name} 환영 이미지`)
                )
            );
    }

    return {
        components: [container],
        flags: MessageFlags.IsComponentsV2,
    };
}

module.exports = {
    buildJoinLogCard,
};
