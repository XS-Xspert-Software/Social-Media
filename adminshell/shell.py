# This script is part of the Pulse project.
# Original revision and idea: Viktor Konkov, June 17 2025
import datetime
from datetime import datetime
import os
import logging
import requests
import shlex
from termcolor import colored
import json as pyjson

logging.basicConfig(level=logging.INFO)
logging.info("Pulse AdminShell started at %s", datetime.now())

# AdminShell fetches resources from all the pulse backend servers
# and exposes them as a single API.

def print_colorful(data):
    if isinstance(data, dict):
        for k, v in data.items():
            print(colored(str(k), 'cyan') + ': ' + colored(str(v), 'yellow'))
    elif isinstance(data, list):
        for item in data:
            print_colorful(item)
    else:
        print(colored(str(data), 'yellow'))

def fetch_resource(resource, server_url, params=None):
    try:
        if resource == 'posts':
            url = f"{server_url.rstrip('/')}/api/posts"
            resp = requests.get(url, params=params)
        elif resource == 'videos':
            url = f"{server_url.rstrip('/')}/api/videos"
            resp = requests.get(url, params=params)
        elif resource == 'unique-posts':
            url = f"{server_url.rstrip('/')}/api/posts?unique=1"
            resp = requests.get(url, params=params)
        else:
            print(colored(f"Unknown resource: {resource}", 'red'))
            return
        if resp.status_code == 200:
            try:
                data = resp.json()
                print_colorful(data)
            except Exception:
                print(colored(resp.text, 'yellow'))
        else:
            print(colored(f"Error: {resp.status_code} {resp.text}", 'red'))
    except Exception as e:
        print(colored(f"Fetch failed: {e}", 'red'))

def main():
    print("Type 'help' for commands. Type 'exit' to quit.")
    command = input(">>> ")
    while command.lower() != 'exit':
        if command.lower() == 'help':
            print("Available commands: help, exit, fetch <resource> <server_url> [--param=value ...]")
            print("Resources: posts, videos, unique-posts")
        elif command.lower() == 'status':
            print("Pulse AdminShell is running. Type 'exit' to quit.")
        elif command.lower().startswith('fetch '):
            # Example: fetch posts http://localhost:3000
            try:
                args = shlex.split(command)
                if len(args) < 3:
                    print("Usage: fetch <resource> <server_url> [--param=value ...]")
                else:
                    resource = args[1]
                    server_url = args[2]
                    params = {}
                    for arg in args[3:]:
                        if arg.startswith('--') and '=' in arg:
                            k, v = arg[2:].split('=', 1)
                            params[k] = v
                    fetch_resource(resource, server_url, params)
            except Exception as e:
                print(f"Error parsing fetch command: {e}")
        else:
            print(f"Unknown command: {command}")
        command = input(">>> ")

if __name__ == "__main__":
    main()
