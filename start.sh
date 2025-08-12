#!/bin/bash

# IP查询API服务启动脚本

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_FILE="$SCRIPT_DIR/qqwry_ip.py"

echo "启动IP查询API服务..."
cd "$SCRIPT_DIR"

python3 "$APP_FILE"