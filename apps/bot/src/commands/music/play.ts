import { Command } from "@sapphire/framework";
import { ApplicationCommandRegistry } from "@sapphire/framework";
import { GuildMember, EmbedBuilder } from "discord.js";
import { BaeksuBotClient } from "../../lib/BaeksuBotClient";

export class PlayCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      description: "노래를 재생합니다. (제목 또는 URL)",
    });
  }

  public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
    // English command
    registry.registerChatInputCommand((builder) =>
      builder
        .setName("play")
        .setDescription("노래를 대기열에 추가하고 재생합니다.")
        .addStringOption((option) =>
          option
            .setName("검색어")
            .setDescription("노래 제목 또는 유튜브/스포티파이 등의 URL")
            .setRequired(true)
        )
    );

    // Korean command
    registry.registerChatInputCommand((builder) =>
      builder
        .setName("재생")
        .setDescription("노래를 대기열에 추가하고 재생합니다.")
        .addStringOption((option) =>
          option
            .setName("검색어")
            .setDescription("노래 제목 또는 유튜브/스포티파이 등의 URL")
            .setRequired(true)
        )
    );
  }

  public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    const client = this.container.client as BaeksuBotClient;
    const { guild, member, channel } = interaction;

    if (!guild || !member || !channel) return;

    const voiceChannel = (member as GuildMember).voice.channel;
    if (!voiceChannel) {
      return interaction.reply({
        content: "❌ 먼저 음성 채널에 입장해 주세요.",
        ephemeral: true,
      });
    }

    const botMember = guild.members.me;
    if (botMember?.voice.channel && botMember.voice.channel.id !== voiceChannel.id) {
      return interaction.reply({
        content: "❌ 봇이 이미 다른 음성 채널에서 사용 중입니다.",
        ephemeral: true,
      });
    }

    const query = interaction.options.getString("검색어", true);

    await interaction.deferReply();

    // Get guild volume from DB
    const dbGuild = await client.db.guild.findUnique({
      where: { id: guild.id },
    });
    const defaultVolume = dbGuild?.volume ?? 100;

    let player = client.lavalink.getPlayer(guild.id);
    if (!player) {
      player = client.lavalink.createPlayer({
        guildId: guild.id,
        voiceChannelId: voiceChannel.id,
        textChannelId: channel.id,
        selfDeaf: true,
        volume: defaultVolume,
      });
    }

    if (!player.connected) {
      await player.connect();
    }

    try {
      const searchResult = await player.search(
        {
          query,
          source: query.startsWith("http") ? undefined : "youtube",
        },
        interaction.user
      );

      if (searchResult.loadType === "empty" || !searchResult.tracks.length) {
        return interaction.editReply("❌ 검색 결과를 찾을 수 없습니다.");
      }

      if (searchResult.loadType === "error") {
        return interaction.editReply("❌ 노래를 검색하는 중 에러가 발생했습니다.");
      }

      const embed = new EmbedBuilder().setTimestamp();

      if (searchResult.loadType === "playlist") {
        await player.queue.add(searchResult.tracks);
        if (!player.playing) {
          await player.play();
        }

        embed
          .setColor("#5865F2")
          .setTitle("✅ 플레이리스트 추가 완료")
          .setDescription(`**${searchResult.playlist?.name || "재생 목록"}** (${searchResult.tracks.length}곡)이 대기열에 추가되었습니다.`)
          .setThumbnail(searchResult.tracks[0].info.artworkUrl || null);

        return interaction.editReply({ embeds: [embed] });
      } else {
        const track = searchResult.tracks[0];
        await player.queue.add(track);
        if (!player.playing) {
          await player.play();
        }

        embed
          .setColor("#5865F2")
          .setTitle("✅ 대기열 추가 완료")
          .setDescription(`**[${track.info.title}](${track.info.uri || track.info.identifier})** 곡이 대기열에 추가되었습니다.`)
          .setThumbnail(track.info.artworkUrl || null);

        return interaction.editReply({ embeds: [embed] });
      }
    } catch (err) {
      client.logger.error("Error running play command:", err);
      return interaction.editReply("❌ 음악을 로드 및 재생하는 중 오류가 발생했습니다.");
    }
  }
}
