# ![Yagami Banner](https://i.imgur.com/YRiIrgs.png)

![Commit Activity](https://img.shields.io/github/commit-activity/w/clxxiii/yagami?style=for-the-badge&color=F34E87&label=commits)
[![Discord Size](https://img.shields.io/discord/958473297106985010?label=Discord&style=for-the-badge&color=F34E87&logo=discord)](https://yagami.clxxiii.dev/discord)
[![Twitter](https://img.shields.io/twitter/follow/clxxiii1?color=F34E87&label=Follow%20the%20dev&logo=Twitter&style=for-the-badge)](https://twitter.com/clxxiii1)
[![Website Status](https://img.shields.io/website?style=for-the-badge&url=https%3A%2F%2Fyagami.clxxiii.dev&up_color=F34E87&down_color=darkred)](https://yagami.clxxiii.dev)

# The future of osu! tournaments

Yagami is a bot that aims to replace the role of spreadsheeters and referees in the osu! tournament scene. All hosts need to do is add the bot to their tournament server, set up some tournament settings, add some mappools and open registrations. The bot will handle team creation, team naming, and anything you might need it to handle.

# Server setup

The first step is [inviting the bot to your server](https://yagami.clxxiii.dev/invite).

Then, you'll need to run the following commands to change all of the settings to your liking:

```
/settings
```

Next, create a tournament:

```
/tournaments create
```

You can change the tournament's settings at any time using `/tournaments edit`

Your server can have multiple tournaments, but only one tournament running at once.
To change which server is currently active, use `/tournaments activate`

Once your tournament is setup, and you're ready to open registrations:

```
/tournaments registration enabled:True
```

Set up a round with the following commands:

```
/rounds create
/rounds edit
/rounds addmap
/rounds bulkaddmap
```

...

# Development

Clone the repository, and install the dependencies

```
git clone https://github.com/clxxiii/yagami.git
pnpm install
```

You will need to add a .ENV file and add the following variables:

```env
# Your osu username
BANCHO_USERNAME=
# Your osu IRC password (https://old.ppy.sh/p/irc)
BANCHO_PASSWORD=
# Your API key (https://old.ppy.sh/p/api)
BANCHO_API_KEY=
# An osu application Client ID
OSU_CLIENT_ID=
# An osu application Client Secret
OSU_CLIENT_SECRET=
# An osu application Redirect URI
OSU_REDIRECT_URI=
# A discord bot token
DISCORD_TOKEN=
# The ID of the guild you are developing in
TEST_GUILD_ID=
# The client ID of your discord application
DISCORD_CLIENT_ID=
# The channel in which global bug reports should be sent to
BUG_CHANNEL_ID=
# This can be changed to a different location if you wish
DATABASE_URL="file:./db/dev.db"
# A github secret to be used in webhooks
GITHUB_SECRET=
# The branch that will be updated when a commit is made to it
GITHUB_PROD_BRANCH=
# The channel to send log messages to
LOG_CHANNEL
```

Next, setup prisma and if you'd like, run prisma studio in a new terminal window

```
npx prisma init
npx prisma migrate dev
```

In new window:

```
npx prisma studio
```

Lastly, run the dev command to get started!

```
pnpm run dev
```
