#!/bin/bash
pixels() {
  local count=${1:-16}
  local r=${2:-255}
  local g=${3:-0}
  local b=${4:-0}
  local w=${5:-0}
  local output=""

  for ((i=0; i<count; i++)); do
    output+="$i,$r,$g,$b,$w,"
  done

  # Rimuove l'ultima virgola
  output=${output%,}
  echo "$output"
}

if [ -z "$1" ]; then
  echo "Error: missing device id"
  exit 1
fi

r=${2:-255}
g=${3:-0}
b=${4:-0}

payload=$(pixels 16 "$r" "$g" "$b" 0)
ip="192.168.1.$1"
./run.sh leds "$ip" 4210 "$payload"