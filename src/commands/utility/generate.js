const {
  ARTIST_INPUT_FIELD_CHARACTER_LIMIT_FORMATTED,
  CHANNEL_NAME_INPUT_FIELD_CHARACTER_LIMIT,
  FEATURES_INPUT_FIELD_CHARACTER_LIMIT,
  ARTIST_INPUT_FIELD_CHARACTER_LIMIT,
  TITLE_INPUT_FIELD_CHARACTER_LIMIT,
} = require("../../lib/constants");
const { interactionError } = require("../../lib/interaction-error");
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const axios = require("axios");
const fs = require("fs");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("generate")
    .setDescription("Generate YouTube tags for your lyric videos.")
    .addStringOption((option) =>
      option
        .setName("artist")
        .setDescription("Any special characters are allowed except commas.")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("format")
        .setDescription("Select the desired format.")
        .setChoices(
          { name: "Lyrics", value: "lyrics" },
          { name: "Bass Boosted", value: "bassboosted" },
          { name: "Nightcore/Sped Up", value: "nightcore" },
          { name: "Slowed/Reverb", value: "slowed" },
          { name: "Letra", value: "letra" },
          { name: "Phonk", value: "phonk" }
        )
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("title")
        .setDescription("Please remove any commas , if there are any")
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("features")
        .setDescription("Please use a comma , to separate feature artists.")
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("channel")
        .setDescription("Enter the name of the YouTube Channel.")
    )
    .addStringOption((option) =>
      option
        .setName("tiktok")
        .setDescription('Is the song popular on TikTok? Type "true" if so.')
    ),

  async execute(interaction) {
    try {
      const artist = interaction.options.getString("artist") || "";
      const title = interaction.options.getString("title") || "";
      const features = interaction.options.getString("features") || "";
      const channel = interaction.options.getString("channel") || "";
      const tiktok = interaction.options.getString("tiktok") || "";
      const format = interaction.options.getString("format") || "";

      // Check if there are any commas in the title or artist
      if (/,/.test(title)) {
        return interaction.reply({
          content: "Please remove any commas from the artist or title.",
          ephemeral: true,
        });
      }

      // Checks if the artist field reaches the character limit
      if (/[-,]/.test(artist)) {
        if (artist.length > ARTIST_INPUT_FIELD_CHARACTER_LIMIT_FORMATTED) {
          interaction.reply({
            content: "Character limit exceeded.",
            ephemeral: false,
          });
          return;
        }
      } else {
        if (artist.length > ARTIST_INPUT_FIELD_CHARACTER_LIMIT) {
          interaction.reply({
            content: "Character limit exceeded.",
            ephemeral: false,
          });
          return;
        }
      }

      // Checks if the title field reaches the character limit
      if (title.length > TITLE_INPUT_FIELD_CHARACTER_LIMIT) {
        interaction.reply({
          content: "Character limit exceeded.",
          ephemeral: false,
        });
        return;
      }

      // Checks if the features field reaches the character limit
      if (features.length > FEATURES_INPUT_FIELD_CHARACTER_LIMIT) {
        interaction.reply({
          content: "Character limit exceeded.",
          ephemeral: false,
        });
        return;
      }

      // Checks if the channel name field reaches the character limit
      if (channel.length > CHANNEL_NAME_INPUT_FIELD_CHARACTER_LIMIT) {
        interaction.reply({
          content: "Character limit exceeded.",
          ephemeral: false,
        });
        return;
      }

      // Checks if the artist and title is not provided in the artist field.
      if (!/-/.test(artist)) {
        if (!title.length) {
          interaction.reply({
            content: "Please provide the title.",
            ephemeral: false,
          });
          return;
        }
      }

      const apiUrl = `https://tags.notnick.io/api/generate${
        title ? `?title=${title}` : "?title=none"
      }&artist=${artist}${
        features
          ? `&features=${features.trimStart().trimEnd()}`
          : "&features=none"
      }${
        channel.length
          ? `&channel=${channel.trimStart().trimEnd()}`
          : "&channel=none"
      }&tiktok=${
        tiktok === "" ? "false" : tiktok !== "true" ? "false" : "true"
      }&format=${format}`;

      const response = await axios.get(apiUrl, {
        headers: { "Content-Type": "application/json" },
      });

      const data = response.data;

      if (!data.success) {
        return interaction.reply({ content: data.error, ephemeral: false });
      }

      const url = `https://tags.notnick.io/${data.url}`;
      const hashtags = data.hashtags.map((hashtag) => `#${hashtag}`).join(" ");
      const tags = data.removedTags;

      const embed = new EmbedBuilder()
        .setTitle(`${data.title} by ${data.artist}`)
        .setURL(url)
        .setColor("#FF0000")
        .addFields(
          { name: "Artist:", value: data.artist, inline: true },
          { name: "Title:", value: data.title, inline: true },
          { name: "Tags:", value: tags },
          {
            name: "Hashtags:",
            value: hashtags,
            inline: true,
          },
          { name: "Length:", value: `${data.removedTagsLength}`, inline: true }
        )
        .setFooter({
          text: "tags.notnick.io",
          iconURL: "https://tags.notnick.io/ltg.png",
        })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

      const filePath = "tags.txt";
      fs.writeFileSync(filePath, tags, "utf8");

      await interaction.followUp({
        content: "Here is your generated tags file:",
        files: [filePath],
      });

      fs.unlink(filePath, (err) => {
        if (err) console.error(`Failed to delete file: ${err}`);
      });
    } catch (error) {
      await interactionError(interaction, error);
    }
  },
};
