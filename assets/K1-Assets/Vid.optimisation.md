#!/bin/bash

# K1-Lightwave Video Optimization Script
# =======================================
# Automatically converts all AI-generated videos to web-optimized format
# 
# USAGE: bash optimize-videos.sh
# 
# REQUIREMENTS: ffmpeg must be installed
# Install on Ubuntu/Debian: sudo apt-get install ffmpeg
# Install on Mac: brew install ffmpeg

set -e  # Exit on error

echo "======================================"
echo "K1-Lightwave Video Optimization Script"
echo "======================================"
echo ""

# Check if ffmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo "ERROR: ffmpeg is not installed"
    echo "Install it with:"
    echo "  Ubuntu/Debian: sudo apt-get install ffmpeg"
    echo "  Mac: brew install ffmpeg"
    exit 1
fi

# Define directories
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
INPUT_DIR="$PROJECT_ROOT/02-ai-video-generation/raw-outputs"
OUTPUT_DIR="$PROJECT_ROOT/03-final-web-assets/videos"

echo "Input directory: $INPUT_DIR"
echo "Output directory: $OUTPUT_DIR"
echo ""

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Counter for processed files
processed=0

# Find all video files recursively in input directory
while IFS= read -r -d '' video_file; do
    # Get filename without path
    filename=$(basename "$video_file")
    # Get filename without extension
    filename_no_ext="${filename%.*}"
    
    echo "Processing: $filename"
    
    # Define output path
    output_file="$OUTPUT_DIR/${filename_no_ext}_optimized.mp4"
    
    # FFmpeg optimization command
    # - Re-encode to H.264 (maximum compatibility)
    # - Target bitrate: 2.5Mbps (good quality, reasonable file size)
    # - Resolution: 1920x1080 (maintain if source is higher, downscale if needed)
    # - Frame rate: 24fps (cinematic, matches most AI generation)
    # - Audio: removed (videos are meant to be silent/muted)
    # - Preset: slow (better compression)
    # - Profile: high (best quality for modern browsers)
    
    ffmpeg -i "$video_file" \
        -c:v libx264 \
        -b:v 2500k \
        -maxrate 3000k \
        -bufsize 5000k \
        -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2" \
        -r 24 \
        -an \
        -preset slow \
        -profile:v high \
        -level 4.0 \
        -pix_fmt yuv420p \
        -movflags +faststart \
        -y \
        "$output_file"
    
    # Check if conversion was successful
    if [ $? -eq 0 ]; then
        # Get file sizes
        input_size=$(du -h "$video_file" | cut -f1)
        output_size=$(du -h "$output_file" | cut -f1)
        
        echo "  ✓ Optimized: $filename"
        echo "    Original size: $input_size"
        echo "    Optimized size: $output_size"
        echo "    Saved to: $output_file"
        echo ""
        
        ((processed++))
    else
        echo "  ✗ FAILED: $filename"
        echo ""
    fi
    
done < <(find "$INPUT_DIR" -type f \( -iname "*.mp4" -o -iname "*.mov" -o -iname "*.avi" -o -iname "*.mkv" \) -print0)

echo "======================================"
echo "Optimization Complete!"
echo "Processed: $processed videos"
echo "Output location: $OUTPUT_DIR"
echo "======================================"
echo ""
echo "NEXT STEPS:"
echo "1. Review optimized videos in $OUTPUT_DIR"
echo "2. Rename files for clarity (e.g., hero-lightshow.mp4, context-desk.mp4)"
echo "3. Copy videos to your website hosting"
echo "4. Update HTML <source> tags to point to these files"
echo ""

# Optional: Create a quick reference text file listing all videos
echo "Creating video inventory file..."
ls -lh "$OUTPUT_DIR" > "$OUTPUT_DIR/video_inventory.txt"
echo "Video inventory saved to: $OUTPUT_DIR/video_inventory.txt"
echo ""

echo "Done!"