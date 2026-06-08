const {
    LabelBuilder,
    ModalBuilder,
    TextDisplayBuilder,
    TextInputBuilder,
    TextInputStyle,
} = require('discord.js');

const WELCOME_SETUP_MODAL_ID = 'welcome_message_setup_modal';
const WELCOME_MESSAGE_INPUT_ID = 'welcome_message_input';

function buildWelcomeSetupModal({ initialMessage = '' } = {}) {
    const textInput = new TextInputBuilder()
        .setCustomId(WELCOME_MESSAGE_INPUT_ID)
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('예시:\n안녕하세요 {user}님!\n{guild}에 오신 것을 환영합니다.');

    if (initialMessage && initialMessage.length <= 4000) {
        textInput.setValue(initialMessage);
    }

    const messageLabel = new LabelBuilder()
        .setLabel('환영 메시지')
        .setDescription('여러 줄 입력 가능. 변수와 줄바꿈 안내를 확인한 뒤 작성하세요.')
        .setTextInputComponent(textInput);

    return new ModalBuilder()
        .setCustomId(WELCOME_SETUP_MODAL_ID)
        .setTitle('환영 메시지 설정')
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                '### 사용 안내\n' +
                '- `{user}` 는 멘션으로 바뀝니다.\n' +
                '- `{guild}` 는 서버 이름으로 바뀝니다.\n' +
                '- 줄바꿈은 Enter 키를 눌러 그대로 입력할 수 있습니다.'
            )
        )
        .addLabelComponents(messageLabel);
}

module.exports = {
    WELCOME_MESSAGE_INPUT_ID,
    WELCOME_SETUP_MODAL_ID,
    buildWelcomeSetupModal,
};
