import os
from srcds.rcon import RconConnection
from models import GameServer

def apply_match_config(server: GameServer, map_name: str, game_mode: str, bot_quota: int) -> dict:
    return {
        send_rcon_command(server, f"changelevel {map_name}"),
        send_rcon_command(server, f"bot_quota {bot_quota}"),
        send_rcon_command(server, "bot kick"),
        send_rcon_command(server, "bot_quota_mode fill"),
        send_rcon_command(server, f"exec {game_mode}.cfg"),
    }

def send_rcon_command(server: GameServer, command: str) -> str:
    try:
        conn = RconConnection(server.ip, port=server.port, password=server.rcon_password)
        return conn.exec_command(command)
    except Exception as e:
        return f"RCON error: {e}"