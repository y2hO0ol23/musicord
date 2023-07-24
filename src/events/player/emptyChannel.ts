import { ChatInputCommandInteraction, VoiceBasedChannel } from "discord.js";
import { client, player, prisma } from "../..";
import { GuildQueue, GuildQueueEvent, Track } from "discord-player";
import { embed } from "../../handler/builder";
import { playerHandler } from "../../handler/player";

player.events.on(GuildQueueEvent.emptyChannel, async (queue: GuildQueue) => {
    try {
        queue.delete();
    }
    catch(err){}
    
    await playerHandler.removeLastPlayer(queue.guild);
});