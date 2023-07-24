import { player} from "../..";
import { GuildQueue, GuildQueueEvent, Track } from "discord-player";
import { playerHandler } from "../../handler/player";

player.events.on(GuildQueueEvent.playerStart, async (queue: GuildQueue<any>, track: Track) => {
    await playerHandler.updateUI(queue);
});