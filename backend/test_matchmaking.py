"""
End-to-end matchmaking test.
Requires: pip install requests
Requires: backend running at http://localhost:8000

First run: creates users with usernames "Alice" and "Bob".
Subsequent runs: logs in as user_id 1 and user_id 2.
"""

import sys
import time
import requests

BASE = "http://localhost:8000"
USER_A_ID = 1
USER_B_ID = 2


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


def ensure_user(username: str, expected_id: int) -> int:
    """Return the id of a user by expected_id. Creates the user if missing."""
    try:
        profile = get(f"/profile/{expected_id}")
        print(f"User {expected_id} exists: {profile['username']}")
        return profile["id"]
    except requests.HTTPError as e:
        if e.response.status_code != 404:
            raise
        print(f"User {expected_id} not found, creating '{username}'...")
        created = post("/dev/create-user", params={"username": username})
        if created["user_id"] != expected_id:
            print(
                f"WARNING: created user has id {created['user_id']}, "
                f"not {expected_id}. The test expects fresh DBs to start at id 1."
            )
        return created["user_id"]


def login(user_id: int) -> dict:
    return post("/dev/login", params={"user_id": user_id})


def main():
    # 1. Ensure users exist (ids 1 and 2 in a fresh DB)
    print("\n=== Ensuring users ===")
    uid_a = ensure_user("Alice", USER_A_ID)
    uid_b = ensure_user("Bob", USER_B_ID)

    # 2. Log in as both
    print("\n=== Logging in ===")
    login(uid_a)
    login(uid_b)

    # 3. Join the queue
    print("\n=== Joining queue ===")
    post("/queue/join", params={"user_id": uid_a, "game_mode": "1v1"})
    post("/queue/join", params={"user_id": uid_b, "game_mode": "1v1"})
    status = get("/queue/status", params={"game_mode": "1v1"})
    assert status["count"] == 2, f"expected 2 in queue, got {status['count']}"

    # 4. Process the queue
    print("\n=== Processing queue ===")
    result = post("/queue/process", params={"game_mode": "1v1"})
    if not result.get("matched"):
        print(f"ERROR: no match. reason: {result.get('error') or result.get('message')}")
        sys.exit(1)

    room_id = result["room_id"]
    print(f"Matched into room {room_id}")

    # 5. Verify both users are in the room
    print("\n=== Verifying room assignment ===")
    room = get(f"/rooms/{room_id}")
    player_ids = {p["id"] for p in room["players"]}
    assert player_ids == {uid_a, uid_b}, f"expected {uid_a},{uid_b}, got {player_ids}"
    assert room["status"] == "ready", f"expected ready, got {room['status']}"
    assert room["server"] and room["server"]["ip"], "room has no server assigned"

    # 6. Verify profile reflects the room
    print("\n=== Verifying profile room link ===")
    pa = get(f"/profile/{uid_a}")
    pb = get(f"/profile/{uid_b}")
    assert pa["current_room_id"] == room_id, f"Alice not linked to room {room_id}"
    assert pb["current_room_id"] == room_id, f"Bob not linked to room {room_id}"

    # 7. Build the connect command (same logic the frontend uses)
    server = room["server"]
    connect_cmd = f"connect {server['ip']}:{server['port']}"
    steam_link = f"steam://connect/{server['ip']}:{server['port']}"

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