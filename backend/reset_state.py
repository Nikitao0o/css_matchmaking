"""
Reset matchmaking state.
Clears rooms, detaches players, and frees game servers.
Requires: pip install requests
Requires: backend running at http://localhost:8000
"""

import sys
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
    print("=== Listing current rooms ===")
    try:
        rooms = get("/api/rooms")
        print(f"rooms endpoint returned: {rooms}")
    except requests.HTTPError:
        print("could not list rooms via /api/rooms (may not be implemented)")

    print("\n=== Listing servers ===")
    servers = get("/servers")
    print(f"{len(servers)} server(s) registered")

    print("\n=== Resetting state ===")
    result = post("/dev/reset-state")
    print(f"reset result: {result}")


if __name__ == "__main__":
    try:
        main()
    except requests.HTTPError as e:
        print(f"\nHTTP error: {e}")
        sys.exit(1)