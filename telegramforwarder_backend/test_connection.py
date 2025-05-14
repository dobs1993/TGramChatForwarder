#!/usr/bin/env python3
import requests
import json

# Test connection to the Flask backend
try:
    response = requests.post(
        "http://localhost:5001/send-code",
        headers={"Content-Type": "application/json"},
        json={"phone": "+17057181856"},  # Note the + sign at the beginning
    )
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"Error: {e}")