import { ApplicationCommandDataResolvable, Client } from 'discord.js';
import fs from "fs";
import path from "path";
import { SpotifyExtractor, SoundCloudExtractor } from '@discord-player/extractor';
import { Player } from 'discord-player';

function setCommands(client: Client) {
    const commandsArray: ApplicationCommandDataResolvable[] = new Array();
    const commandsPath = path.join(__dirname, '../commands');

    fs.readdirSync(commandsPath).forEach(category => {
        fs.readdirSync(path.join(commandsPath, category)).filter(e => e.endsWith('.ts')).forEach(async file => {
            const command = (await import(path.join(commandsPath, category, file))).default;
            
            client.commands.set(command.data.name, command);
            commandsArray.push(command.data.toJSON());
        })
    })
    
    client.on("ready", async () => {
        await client.application?.commands.set(commandsArray);
    })
}

function setEvents() {
    const eventsPath = path.join(__dirname, '../events');
    fs.readdirSync(eventsPath).forEach(category => {
        fs.readdirSync(path.join(eventsPath, category)).filter(e => e.endsWith('.ts')).forEach(async file => {
            await import(path.join(eventsPath, category, file));
        })
    });
}

async function setPlayer(player: Player) {
    await player.extractors.loadDefault();

    await player.extractors.register(SpotifyExtractor, {});
    await player.extractors.register(SoundCloudExtractor, {});
}

export default async function prepare({ client, player }: { client: Client, player: Player }) {
    setCommands(client);
    setEvents();
    
    await setPlayer(player);

    await client.login(process.env.token);
}