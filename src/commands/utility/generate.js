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
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("genre")
        .setDescription("Select the desired genre.")
        .setChoices(
          { name: "None", value: "none" },
          { name: "Country", value: "country" },
          { name: "Latin", value: "latin" },
          { name: "Phonk", value: "phonk" },
          { name: "Pop", value: "pop" },
          { name: "Rap", value: "rap" }
        )
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
        .setName("verse")
        .setDescription(
          "Popular verse? Paste them in here. Limit is 3, separate them by commas."
        )
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
      const genre = interaction.options.getString("genre") || "";
      const verse = interaction.options.getString("verse") || "";

      // Check if the artist field starts with ",-" which means the title wasn't provided.
      if (/^,-/.test(artist)) {
        return interaction.reply({
          content: "Invalid format.",
          ephemeral: false,
        });
      }

      // Check if there are any commas in the title or artist
      if (/,/.test(title)) {
        return interaction.reply({
          content: "Please remove any commas from the artist or title.",
          ephemeral: false,
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

      // Checks if verse contains any numbers or special characters.
      if (verse.length && !/^[a-zA-Z ,]*$/.test(verse)) {
        interaction.reply({
          content: "Please remove any numbers or special characters.",
          ephemeral: false,
        });
        return;
      }

      // Checks if verse contains a comma, if does then we split the verses and check if there are more than 3 verses.
      if (verse.length && /,/.test(verse)) {
        const verseSplit = verse.split(",");

        // If there's more than 3 verses then send back a error response
        if (verseSplit.length > 3) {
          interaction.reply({
            content: "You can only include 3 verses.",
            ephemeral: false,
          });
          return;
        }
      }

      const params = new URLSearchParams({
        title: title || "none",
        artist: artist,
        features: features?.trim() || "none",
        channel: channel?.trim() || "none",
        tiktok: tiktok === "true" ? "true" : "false",
        format: format || "lyrics",
        shuffle: "true",
        genre: genre || "none",
        verse: verse?.trim() || "none",
      });

      const apiUrl = `https://tags.notnick.io/api/generate?${params.toString()}`;

      const response = await axios.get(apiUrl, {
        headers: { "Content-Type": "application/json" },
      });

      const data = response.data;

      if (!data.success) {
        return interaction.reply({ content: data.error, ephemeral: false });
      }

      const url = `https://tags.notnick.io/${data.url}`;
      const hashtags = data.hashtags.map((hashtag) => `#${hashtag}`).join(" ");
      const featuresResponse = !data.features.length
        ? "None"
        : data.features.join(",");
      const responseId = data.responseId;
      const tags = data.removedTags;

      const embed = new EmbedBuilder()
        .setTitle(`${data.title} by ${data.artist}`)
        .setURL(url)
        .setColor("#FF0000")
        .addFields(
          { name: "Artist:", value: data.artist, inline: true },
          { name: "Title:", value: data.title, inline: true },
          { name: "Features:", value: featuresResponse, inline: true },
          {
            name: "Channel:",
            value: data.channel === "none" ? "None" : data.channel,
            inline: true,
          },
          { name: "Genre:", value: data.genre, inline: true },
          { name: "TikTok:", value: data.tiktok, inline: true },
          { name: "Tags:", value: tags },
          {
            name: "Hashtags:",
            value: hashtags,
            inline: true,
          },
          { name: "Length:", value: `${data.removedTagsLength}`, inline: true }
        )
        .setFooter({
          text: `tags.notnick.io`,
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

      await interaction.followUp({
        content: `Response: **${responseId}**`,
        ephemeral: true,
      });

      fs.unlink(filePath, (err) => {
        if (err) console.error(`Failed to delete file: ${err}`);
      });
    } catch (error) {
      await interactionError(interaction, error);
    }
  },
};
