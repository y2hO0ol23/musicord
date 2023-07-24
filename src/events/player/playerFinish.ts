import { ChatInputCommandInteraction, VoiceBasedChannel } from "discord.js";
import { client, player, prisma } from "../..";
import { GuildQueue, GuildQueueEvent, Track } from "discord-player";
import { embed } from "../../handler/builder";
import { playerHandler } from "../../handler/player";

player.events.on(GuildQueueEvent.playerFinish, async (queue: GuildQueue, track: Track) => {
    // we will later define queue.metadata object while creating the queue
    var music = await prisma.music.findFirst({
        where: {
            guildId: queue.guild.id,
            state: "play"
        },
        include: { next: true }
    });

    if (!music) {
        music = await prisma.music.findFirst({
            where: {
                guildId: queue.guild.id,
                state: "start"
            },
            include: { next: true }
        });
    }
    else {
        await prisma.music.update({
            where: { id: music.id },
            data: { state: "wait" }
        });
    }


    if (music.next[0].state == "end") {
        await playerHandler.updateUI(queue);
    }
    else {
        await queue.play(music.next[0].url);

        await prisma.music.update({
            where: { id: music.next[0].id },
            data: { state: 'play' }
        });
    }
});