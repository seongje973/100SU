import { Command } from "@sapphire/framework";
import { ApplicationCommandRegistry } from "@sapphire/framework";
import { GuildMember } from "discord.js";
import { BaeksuBotClient } from "../../lib/BaeksuBotClient";

export class VolumeCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      description: "재생 볼륨을 조절하고 데이터베이스에 저장합니다.",
    });
  }

  public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
    // English command
    registry.registerChatInputCommand((builder) =>
      builder
        .setName("volume")
        .setDescription("볼륨을 변경하고 길드 기본값으로 저장합니다.")
        .addIntegerOption((option) =>
          option
            .setName("볼륨")
            .setDescription("볼륨 값 (1-100)")
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(100)
        )
    );

    // Korean command
    registry.registerChatInputCommand((builder) =>
      builder
        .setName("볼륨")
        .setDescription("볼륨을 변경하고 길드 기본값으로 저장합니다.")
        .addIntegerOption((option) =>
          option
            .setName("볼륨")
            .setDescription("볼륨 값 (1-100)")
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(100)
        )
    );
  }

  public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    const client = this.container.client as BaeksuBotClient;
    const { guild, member } = interaction;

    if (!guild || !member) return;

    const voiceChannel = (member as GuildMember).voice.channel;
    if (!voiceChannel) {
      return interaction.reply({
        content: "❌ 먼저 음성 채널에 입장해 주세요.",
        ephemeral: true,
      });
    }

    const player = client.lavalink.getPlayer(guild.id);
    const botMember = guild.members.me;
    if (player && botMember?.voice.channel && botMember.voice.channel.id !== voiceChannel.id) {
      return interaction.reply({
        content: "❌ 봇과 같은 음성 채널에 있어야 합니다.",
        ephemeral: true,
      });
    }

    const volume = interaction.options.getInteger("볼륨", true);

    try {
      // 1. Save to DB
      await client.db.guild.upsert({
        where: { id: guild.id },
        update: { volume },
        create: { id: guild.id, volume },
      });

      // 2. Apply to player
      if (player) {
        await player.setVolume(volume);
      }

      return interaction.reply(`🔊 볼륨을 **${volume}%**로 설정하고 길드 기본값으로 저장했습니다.`);
    } catch (err) {
      client.logger.error("Error running volume command:", err);
      return interaction.reply({
        content: "❌ 볼륨 설정 저장 중 에러가 발생했습니다.",
        ephemeral: true,
      });
    }
  }
}
