#!/usr/bin/env zsh
set -e
setopt +o nomatch

DIR="$(dirname $0)"
COMPOSITES_DIR="$DIR/composites"
AUDIO_DIR="$DIR/audio"
SEGMENTS_DIR="$DIR/segments"
mkdir -p "$SEGMENTS_DIR"

VFADE_IN=0.2
AUDIO_DELAY=0.5
BREATH=0.3
VFADE_OUT=0.2
GAP=0.3

CLIPS=(01-open-product 02-connect-trade 03-settlement 04-contract 05-initia-features 06-close)

echo "Building segments..."
for clip in $CLIPS; do
  SEG="$SEGMENTS_DIR/$clip.mp4"
  COMPOSITE="$COMPOSITES_DIR/$clip.png"
  AUDIO="$AUDIO_DIR/$clip.mp3"

  if [[ ! -f "$COMPOSITE" ]]; then echo "Missing composite: $clip"; exit 1; fi
  if [[ ! -f "$AUDIO" ]]; then echo "Missing audio: $clip"; exit 1; fi

  # Get audio duration
  ADUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$AUDIO")

  # Calculate total segment duration
  TOTAL=$(python3 -c "print(round($AUDIO_DELAY + $ADUR + $BREATH + $VFADE_OUT, 3))")
  FO_START=$(python3 -c "print(round($TOTAL - $VFADE_OUT, 3))")
  AFO_START=$(python3 -c "print(round($AUDIO_DELAY + $ADUR - 0.25, 3))")

  echo "  $clip: audio=${ADUR}s total=${TOTAL}s"

  ffmpeg -y \
    -loop 1 -i "$COMPOSITE" \
    -i "$AUDIO" \
    -filter_complex "
      anullsrc=r=44100:cl=stereo,atrim=0:${AUDIO_DELAY}[silence];
      [silence][1:a]concat=n=2:v=0:a=1[joined];
      [joined]afade=t=in:st=${AUDIO_DELAY}:d=0.15,afade=t=out:st=${AFO_START}:d=0.25,apad=whole_dur=${TOTAL}[a];
      [0:v]scale=1920:1080,fade=t=in:st=0:d=${VFADE_IN},fade=t=out:st=${FO_START}:d=${VFADE_OUT}[v]
    " \
    -map "[v]" -map "[a]" \
    -t "$TOTAL" \
    -c:v libx264 -preset fast -crf 22 -pix_fmt yuv420p \
    -c:a aac -b:a 128k \
    -r 30 "$SEG" 2>/dev/null

done

# Create gap segment
echo "Creating gap segment..."
ffmpeg -y -f lavfi -i "color=c=black:s=1920x1080:r=30:d=${GAP}" \
  -f lavfi -i "anullsrc=r=44100:cl=stereo" \
  -t "$GAP" \
  -c:v libx264 -preset fast -crf 22 -pix_fmt yuv420p \
  -c:a aac -b:a 128k \
  "$SEGMENTS_DIR/gap.mp4" 2>/dev/null

# Build concat list
echo "Assembling final video..."
CONCAT_FILE="$DIR/concat.txt"
rm -f "$CONCAT_FILE"
for i in {1..$#CLIPS}; do
  clip=$CLIPS[$i]
  echo "file 'segments/$clip.mp4'" >> "$CONCAT_FILE"
  if [[ $i -lt $#CLIPS ]]; then
    echo "file 'segments/gap.mp4'" >> "$CONCAT_FILE"
  fi
done

# Final assembly (re-encode to avoid timestamp drift)
ffmpeg -y -f concat -safe 0 -i "$CONCAT_FILE" \
  -c:v libx264 -preset fast -crf 22 -pix_fmt yuv420p \
  -c:a aac -b:a 128k \
  "$DIR/batchfi-demo.mp4" 2>/dev/null

DURATION=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$DIR/batchfi-demo.mp4")
echo ""
echo "Done! video/batchfi-demo.mp4 (${DURATION}s)"
