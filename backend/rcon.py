import os
from srcds.rcon import RconConnection

RCON_HOST = os.getenv("RCON_HOST", "172.29.197.196")
RCON_PORT = int(os.getenv("RCON_PORT", "27015"))
RCON_PASSWORD = os.getenv("RCON_PASSWORD", "1111")

def _get_config():
    return {
        "host": os.getenv("RCON_HOST", "127.0.0.1"),
        "port": int(os.getenv("RCON_PORT", "27015")),
        "password": os.getenv("RCON_PASSWORD", ""),
    }

def apply_match_config(map_name: str, game_mode: str, bot_quota: int) -> dict:
    """Configure the server using a single RCON connection to avoid bans caused by frequent reconnections."""
    cfg = _get_config()
    results = {}

    try:
        conn = RconConnection(cfg["host"], port=cfg["port"], password=cfg["password"])

        # 1. Bot settings (must be before map change)
        results["bot_quota"] = str(conn.exec_command(f"bot_quota {bot_quota}"))
        results["bot_quota_mode"] = str(conn.exec_command("bot_quota_mode fill"))

        # 2. Mode config
        mode_cfg = {"1v1": "1v1.cfg", "5v5": "5v5.cfg"}.get(game_mode, "default.cfg")
        results["mode"] = str(conn.exec_command(f"exec {mode_cfg}"))

        # 3. Change map last, don't rely on its response
        conn.exec_command(f"changelevel {map_name}")
        results["map"] = f"changelevel {map_name} issued"

        conn.close()
    except Exception as e:
        results["error"] = f"RCON error: {e}"

    return results

def send_rcon_command(command: str) -> str:
    """Execute a single RCON command. One connection per call."""
    try:
        conn = RconConnection(RCON_HOST, port=RCON_PORT, password=RCON_PASSWORD)
        response = conn.exec_command(command)
        return response
    except Exception as e:
        return f"RCON Error: {e}"