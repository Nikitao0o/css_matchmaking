"""
End-to-end matchmaking test.
Requires: pip install requests
Requires: backend running at http://localhost:8000
"""

import sys
import time
import requests

BASE = "http://localhost:8000"


def post(path, **kwargs):
    r = requests.post(f"{BASE}{path}", **kwargs)
    print(f"POST {path} -> {r.status_code} {r.text}")
    r.raise_for_status()
    return r.json()


def get(path, **kwargs):
    r = requests.get(f"{BASE}{path}", **kwargs)
    print(f"GET  {path} -> {r.status_code} {r.text}")
    r.raise_for_status()
    return r.json()


def main():
    # 1. Create two users
    print("\n=== Creating users ===")
    a = post("/dev/create-user", params={"username": "Alice"})
    b = post("/dev/create-user", params={"username": "Bob"})
    uid_a, uid_b = a["user_id"], b["user_id"]

    # 2. Join the queue
    print("\n=== Joining queue ===")
    post("/queue/join", params={"user_id": uid_a, "game_mode": "1v1"})
    post("/queue/join", params={"user_id": uid_b, "game_mode": "1v1"})
    status = get("/queue/status", params={"game_mode": "1v1"})
    assert status["count"] == 2, f"expected 2 in queue, got {status['count']}"

    # 3. Process the queue
    print("\n=== Processing queue ===")
    result = post("/queue/process", params={"game_mode": "1v1"})
    if not result.get("matched"):
        print(f"ERROR: no match. reason: {result.get('error') or result.get('message')}")
        sys.exit(1)

    room_id = result["room_id"]
    print(f"Matched into room {room_id}")

    # 4. Verify both users are in the room
    print("\n=== Verifying room assignment ===")
    room = get(f"/rooms/{room_id}")
    player_ids = {p["id"] for p in room["players"]}
    assert player_ids == {uid_a, uid_b}, f"expected {uid_a},{uid_b}, got {player_ids}"
    assert room["status"] == "ready", f"expected ready, got {room['status']}"
    assert room["server_ip"] and room["server_port"], "room has no server assigned"

    # 5. Verify profile reflects the room
    print("\n=== Verifying profile room link ===")
    pa = get(f"/profile/{uid_a}")
    pb = get(f"/profile/{uid_b}")
    assert pa["current_room_id"] == room_id, f"Alice not linked to room {room_id}"
    assert pb["current_room_id"] == room_id, f"Bob not linked to room {room_id}"

    # 6. Build the connect command (same logic the frontend uses)
    connect_cmd = f"connect {room['server_ip']}:{room['server_port']}"
    steam_link = f"steam://connect/{room['server_ip']}:{room['server_port']}"

    print("\n=== Result ===")
    print(f"console command: {connect_cmd}")
    print(f"steam link:      {steam_link}")
    print("\nAll checks passed.")


if __name__ == "__main__":
    start = time.time()
    try:
        main()
    except requests.HTTPError as e:
        print(f"\nHTTP error: {e}")
        sys.exit(1)
    finally:
        print(f"\nFinished in {time.time() - start:.2f}s")