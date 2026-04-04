#!/usr/bin/env zsh
set -e

VOICE_ID="nPczCjzI2devNBz1zQrb"
MODEL="eleven_multilingual_v2"
AUDIO_DIR="$(dirname $0)/audio"
mkdir -p "$AUDIO_DIR"

declare -A CLIPS
CLIPS[01-open-product]="This is BatchFi. A batch auction DEX running on its own Initia appchain. Every thirty seconds, it collects orders and clears them at one uniform price. Twenty-one dollars in protocol revenue so far from test trades."
CLIPS[02-connect-trade]="Connect a wallet through InterwovenKit. The trading view shows the current batch countdown, your balances, and the order depth on both sides. Place a limit order and it goes into the batch."
CLIPS[03-settlement]="When the timer hits zero, the settler calls the contract. The clearing algorithm walks sorted buys and sells, finds where supply meets demand, and sets one price. Everyone who fills gets that price. No one gets priority."
CLIPS[04-contract]="The contract is five hundred lines of Solidity with thirty-three tests. It charges zero point one percent on every fill. There is a settler fallback so anyone can settle after five minutes if the bot goes down. Funds never get stuck."
CLIPS[05-initia-features]="Built with InterwovenKit for wallet connection, session signing so you can trade without popups, and the Interwoven Bridge for moving tokens from Initia L1. The oracle precompile at address F1 feeds reference prices from the Cosmos oracle module."
CLIPS[06-close]="BatchFi. Fair trading on Initia."

for clip in 01-open-product 02-connect-trade 03-settlement 04-contract 05-initia-features 06-close; do
  OUT="$AUDIO_DIR/$clip.mp3"
  if [[ -f "$OUT" ]]; then
    echo "Skip (exists): $clip"
    continue
  fi
  echo "Generating: $clip"
  TEXT="${CLIPS[$clip]}"
  curl -s -X POST "https://api.elevenlabs.io/v1/text-to-speech/$VOICE_ID" \
    -H "xi-api-key: $ELEVENLABS_API_KEY" \
    -H "Content-Type: application/json" \
    -d "{
      \"text\": \"$TEXT\",
      \"model_id\": \"$MODEL\",
      \"voice_settings\": {
        \"stability\": 0.82,
        \"similarity_boost\": 0.65,
        \"style\": 0.03,
        \"use_speaker_boost\": true
      }
    }" -o "$OUT"

  # Verify it's audio, not error JSON
  if file "$OUT" | grep -q "JSON\|text\|ASCII"; then
    echo "ERROR: $clip returned text, not audio:"
    cat "$OUT"
    rm "$OUT"
    exit 1
  fi
  echo "OK: $clip ($(du -h "$OUT" | cut -f1))"
  sleep 1
done

echo "All audio generated."
