require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, VoiceConnectionStatus, entersState, EndBehaviorType } = require('@discordjs/voice');
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const { startRecording } = require('./utils/audioProcessor');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const SERVER_URL = process.env.SERVER_URL;

client.on('ready', () => console.log(`Logged in as ${client.user.tag}`));

client.on('voiceStateUpdate', async (oldState, newState) => {
  const userId = newState.member?.user?.id;
  if (!userId) return;

  const sessionId = `${userId}_${Date.now()}`;

  // User joined a voice channel
  if (newState.channelId && !oldState.channelId) {
    console.log(`User ${userId} joined channel ${newState.channel.channel.id}`);

    const connection = joinVoiceChannel({
      channelId: newState.channel.id,
      guildId: newState.guild.id,
      adapterCreator: newState.guild.voiceAdapterCreator,
      selfDeaf: false,
      selfMute: false,
    });

    try {
      await entersState(connection, VoiceConnectionStatus.Ready, 20_000);
      console.log(`Recording started for session: ${sessionId}`);

      const receiver = connection.receiver;
      const audioStream = receiver.subscribe(userId, {
        end: {
          duration: 100,
          behavior: EndBehaviorType.AfterWaves,
        },
      });

      const { wavPath } = await startRecording(audioStream, sessionId);
      console.log(`Recording finished. WAV path: ${wavPath}`);

      // Upload to server
      await uploadToServer(wavPath, sessionId);

    } catch (error) {
      console.error('Failed to join voice channel or process audio:', error);
    }
  }

  // User left a voice channel
  if (oldState.channelId && !newState.channelId) {
    console.log(`User ${userId} left channel`);
  }
});

async function uploadToServer(filePath, sessionId) {
  const url = `${SERVER_URL}/upload`;
  try {
    const form = new FormData();
    form.append('audio', fs.createReadStream(filePath));
    form.append('sessionId', sessionId);

    console.log(`Uploading ${filePath} to ${url}...`);
    const response = await axios.post(url, form, {
      headers: form.getHeaders(),
    });

    console.log('Upload response:', response.data);

    // Clean up the wav file after successful upload
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Error uploading to server:', error.message);
  }
}

client.login(process.env.DISCORD_TOKEN);
