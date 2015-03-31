# Nazgul the Viewbot Slayer

## Installation

- Install [MongoDB](https://www.mongodb.org/downloads)
- Install [NodeJS 0.11.x](http://nodejs.org/dist/v0.11.16/) (or any version with Harmony support)
- `git clone https://github.com/schmich/nazgul`
- `npm install`

## Components

- Live stream snapshots: collects stats on all live streams at periodic intervals
- Chat viewer snapshots: collects viewers, mods, and admins in certain channels at periodic intervals
- Chat monitoring: collects all messages, joins, and parts for certain channels
- Host snapshots: collects hosts for certain channels

## Schema

- `stream:snapshots`
 - `ts`: Snapshot group timestamp
 - `ui`: Channel owner's Twitch user ID
 - `ch`: Channel name
 - `ga`: Stream game name
 - `sc`: Stream creation timestamp
 - `si`: Stream instance ID
 - `vi`: Stream viewer count
 - `la`: Channel language
 - `fo`: Channel follower count
 - `cv`: Total channel views
 - `pa`: Is channel partnered?
 - `ma`: Is channel marked mature?
 - `st`: Channel status
- `chat:messages`
 - `i`: Channel owner's Twitch user ID
 - `u`: Username of message sender
 - `m`: Message text
 - `t`: Message timestamp
- `chat:joins`
 - `i`: Channel owner's Twitch user ID
 - `u`: Username of person joining
 - `t`: Join timestamp
- `chat:parts`
 - `i`: Channel owner's Twitch user ID
 - `u`: Username of person parting
 - `t`: Part timestamp
- `chat:viewers:snapshots`
 - `ts`: Snapshot group timestamp
 - `ch`: Channel name
 - `mo`: List of moderators in chat
 - `st`: List of staff in chat
 - `ad`: List of admins in chat
 - `gm`: List of global moderators in chat
 - `vi`: List of ordinary viewers in chat
- `host:snapshots`
 - `c`: Channel name
 - `t`: Snapshot group timestamp
 - `h`: List of channels hosting this channel

## License

Copyright &copy; 2015 Chris Schmich<br>
MIT License. See [LICENSE](LICENSE) for details.
