import { CommandInteraction, SlashCommandBuilder, Client } from "discord.js"
import { player, prisma } from "../..";
import { button, embed } from "../../handler/builder";
import { playerHandler } from "../../handler/player";

export default {
    data: new SlashCommandBuilder()
        .setName("start")
        .setDescription("start player")
        .setDMPermission(false),

    execute: async function ({ client, interaction }: { client: Client, interaction: CommandInteraction }) {
        if (!interaction.isChatInputCommand() || !interaction.inCachedGuild()) return;

        const channel = interaction.member.voice.channel;
        if (!channel) return interaction.reply({ embeds: [embed.needVC()], ephemeral: true });
        
        var queue = player.nodes.get(channel.guild.id);
        if (queue) return interaction.reply({ embeds: [embed.already(queue.channel)], ephemeral: true });

        queue = player.nodes.create(channel.guild.id, {
            leaveOnEnd: false,
            leaveOnEmptyCooldown: 0,
            leaveOnStop: false,
            selfDeaf: true,
            metadata: {
                channel: channel,
                client: channel.guild.members.me
            },
        });
        if (!queue.connection) await queue.connect(channel);

        await interaction.reply({ embeds: [embed.start(channel)]});
        

        await channel.send({ content: '`[wait...]`', components: button.player(true) })
        .then(async message => {
            await playerHandler.removeLastPlayer(message.guild);

            await prisma.guild.update({
                where: { id: message.guildId },
                data: {
                    player: {
                        create: {
                            channelId: message.channelId,
                            messageId: message.id,
                        }
                    }
                }
            });

            await playerHandler.selectMusic(message.guild).then(async music => {
                if (!music) return;
                await queue.play(music.url);
            });
            
            await message.edit({ 
                content: '', 
                embeds: [await embed.player(channel)]
            }).catch();
        });
    },
}