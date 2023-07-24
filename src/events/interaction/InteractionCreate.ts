import { Interaction } from "discord.js";
import { client, player, prisma } from "../..";
import { playerHandler } from "../../handler/player";
import { embed, modal, selectMenu } from "../../handler/builder";
import { QueryType } from "discord-player";

client.on("interactionCreate", async (interaction: Interaction): Promise<any> => {
    if (!interaction.inCachedGuild()) return;
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);

        if (!command) return;
        
        await command.execute({
            interaction: interaction,
            client: client
        });
    }
    if (interaction.isStringSelectMenu()){
        if (interaction.customId == 'musicSelection') {
            await interaction.deferReply();

            const channel = interaction.member.voice.channel;
            if (!channel) return await interaction.followUp({ embeds: [embed.needVC()]});
            const url = interaction.values[0];
            
            const track = (await player.search(url)).tracks[0];
            
            await playerHandler.add(channel, track, interaction);

            await interaction.followUp({ embeds: [embed.added(track)]});
        }
    }
    if (interaction.isButton()) {
        if (interaction.customId == 'playerAdd') {
            interaction.showModal(modal.search())
        }
        if (interaction.customId == 'playerPause') {
            await interaction.deferReply({ ephemeral: true });

            const queue = player.nodes.get(interaction.guildId);
            if (!queue) return await interaction.followUp({ embeds: [embed.error()]});
            if (!queue.isPlaying()) {
                await playerHandler.selectMusic(interaction.guild).then(async music => {
                    if (!music) return;
                    await queue.play(music.url);
                });
            }
            else {
                queue.node.setPaused(!queue.node.isPaused());
            }

            interaction.deleteReply();
        }
        if (interaction.customId == 'playerNext') {
            await interaction.deferReply({ ephemeral: true });

            const queue = player.nodes.get(interaction.guildId);
            if (!queue) return await interaction.followUp({ embeds: [embed.error()]});
            queue.node.skip();

            interaction.deleteReply();
        }
        if (interaction.customId == 'playerRemove') {
            await interaction.deferReply({ ephemeral: true });

            const queue = player.nodes.get(interaction.guildId);
            if (!queue) return await interaction.followUp({ embeds: [embed.error()]});

            await playerHandler.musicNow(interaction.guild).then(async e => {
                const music = await prisma.music.findUnique({
                    where: { id: e.id },
                    include: {
                        next: true,
                        back: true
                    }
                });
                if (music.state != 'end') {
                    await prisma.music.delete({ where: { id: music.id }});
                    await prisma.music.update({
                        where: { id: music.back[0].id },
                        data: {
                            next: {
                                connect: { id: music.next[0].id }
                            }
                        }
                    })

                    if (music.back[0].state == 'wait') {
                        await prisma.music.update({
                            where: { id: music.back[0].id },
                            data: { state: 'play' }
                        })
                    }

                    queue.node.skip();
                }
            });
            
            interaction.deleteReply();
        }
        if (interaction.customId == 'playerBack') {
            await interaction.deferReply({ ephemeral: true });

            const queue = player.nodes.get(interaction.guildId);
            await playerHandler.musicNow(interaction.guild).then(async e => {
                const music = await prisma.music.findUnique({ 
                    where: { id: e.id },
                    include: {
                        back: {
                            include: { back: true }
                        }
                    }
                });

                if (music.back.length && music.back[0].back.length) {
                    await prisma.music.updateMany({
                        where: { id: music.id, state: "play" },
                        data: { state: "wait" }
                    });
                    
                    if (!queue.isPlaying()){
                        await prisma.music.update({
                            where: { id: music.back[0].id },
                            data: { state: "play" }
                        })
                        queue.play(music.back[0].url);
                    }
                    else {
                        if (music.back[0].back[0].state == "wait") {
                            await prisma.music.update({
                                where: { id: music.back[0].back[0].id },
                                data: { state: "play" }
                            });
                        }
                        queue.node.skip();
                    }
                }
            })

            interaction.deleteReply();
        }
    }
    if (interaction.isModalSubmit()) {
        if (interaction.customId == 'playerSearch') {
            await interaction.deferReply({ ephemeral: true });

            const channel = interaction.member.voice.channel;
            const query = interaction.fields.getTextInputValue('query');
            const results = await player.search(query, { searchEngine: QueryType.YOUTUBE });
            if (!results.hasTracks()) return await interaction.followUp({ embeds: [embed.notFound(query)]})

            if (results.tracks.length == 1) {
                if (!channel) return await interaction.followUp({ embeds: [embed.needVC()]});

                const track = results.tracks[0];
                await playerHandler.add(channel, track, interaction)
        
                await interaction.followUp({ embeds: [embed.added(track)]});
            }
            else {
                await interaction.followUp({
                    components: [selectMenu.music(results)],
                });
            }
        }
    }
});