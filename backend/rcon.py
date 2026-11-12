import os
from srcds.rcon import RconConnection
from models import GameServer

RCON_HOST = os.getenv("RCON_HOST", "172.29.197.196")
RCON_PORT = int(os.getenv("RCON_PORT", "27015"))
RCON_PASSWORD = os.getenv("RCON_PASSWORD", "1111")

def _get_config():
    return {
        "host": os.getenv("RCON_HOST", "127.0.0.1"),
        "port": int(os.getenv("RCON_PORT", "27015")),
        "password": os.getenv("RCON_PASSWORD", ""),
    }

def apply_match_config(server: GameServer, map_name: str, game_mode: str, bot_quota: int) -> dict:
    return {
        send_rcon_command(server, f"changelevel {map_name}"),
        send_rcon_command(server, f"bot_quota {bot_quota}"),
        send_rcon_command(server, "bot_quota_mode fill"),
        send_rcon_command(server, f"exec {game_mode}.cfg"),
    }

def send_rcon_command(server: GameServer, command: str) -> str:
    try:
        conn = RconConnection(server.ip, port=server.port, password=server.rcon_password)
        return conn.exec_command(command)
    except Exception as e:
        return f"RCON error: {e}"