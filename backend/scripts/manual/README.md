# Manual Scripts

This folder contains one-off troubleshooting and exploratory scripts.

Rules:

1. These scripts are not part of production runtime.
2. Do not import these scripts from backend source modules.
3. Keep production automation in backend/src/scripts.
4. If a script becomes recurring, convert it into a typed script under backend/src/scripts and add an npm script entry.
