# CS:S Matchmaking Server - Setup Guide

This guide sets up a self-hosted matchmaking system for Counter-Strike: Source. It has two parts: a backend that manages users and matches, and a game server(s) where matches are played.

## Requirements

- Docker Desktop installed on Windows
- WSL2 (Ubuntu) installed on Windows

## Backend Setup

Open PowerShell or Command Prompt on Windows and go to your project folder:

```bash
cd C:\path\to\match-backend
```

Create your configuration file:

```bash
copy .env.example .env
```

Open `.env` in a text editor and fill in:

- `POSTGRES_PASSWORD` - any password you choose for the database
- `RCON_PASSWORD` - password for controlling the game server
- `RCON_HOST` - your WSL2 IP address
- `GAME_SERVER_HOST` - your WSL2 IP address (same as above)

To find your WSL2 IP, open Ubuntu and type:

```bash
hostname -I
```

Use the first number it prints, for example `172.24.160.1`.

Now start the backend:

```bash
docker compose up --build -d
```

Check it works by opening this in your browser:

```
http://localhost:8000/healthcheck
```

You should see the short "OK" message.

## Game Server Setup

Open Ubuntu (WSL2) and download the game server image from your Docker Hub:

```bash
docker pull mnszpkns/css-sourcemod:latest
```

Start the game server:

```bash
docker run -d --name css-server --net=host \
  mnszpkns/css-sourcemod:latest \
  ./srcds_run -game cstrike -tickrate 100 +map de_dust2 +sv_lan 1
```

Set the RCON password inside the container so the backend can control the server. Open the server config:

```bash
docker exec -it css-server nano /app/cstrike/cfg/server.cfg
```

Add this line at the bottom (use the same password you put in `.env` on backends):

```
rcon_password "your_password_here"
```

Save the file (Ctrl+O, Enter, Ctrl+X) and restart the server:

```bash
docker restart css-server
```

## Connect In-Game

First, turn on the game console if you haven't yet. In CS:Source, go to:

**Options > Keyboard > Advanced > Enable Developer Console**

Press the `~` key to open the console.

Type this to connect to your server, using your WSL2 IP:

```
connect <your WSL2 IP>:27015
```

The server should load and you should join the game.

Note: typing `connect localhost:27015` is not recognised by the game's parses and will not work. You must use the WSL2 IP address.


## Stopping Everything

Backend:

```bash
docker compose down
```

Game server:

```bash
docker stop css-server
docker rm css-server
```