/*
  K1-Lightwave Calibration Firmware
  ---------------------------------

  Purpose:
    Drive the K1’s top and bottom LED strips in four specific
    "calibration patterns" needed by calibrate_optics.py:

      1) Top Impulse Center    (top strip centre lit, bottom off)
      2) Bottom Impulse Center (bottom strip centre lit, top off)
      3) Collision Center      (both centres lit)
      4) Edges Only            (ends of both strips lit)

  Usage:
    1. Flash this sketch to your ESP32-S3 that controls the K1 LEDs.
    2. Open the Serial Monitor at 115200 baud.
    3. Type:
         '1' + Enter -> Top Impulse Center
         '2' + Enter -> Bottom Impulse Center
         '3' + Enter -> Collision Center
         '4' + Enter -> Edges Only
         'n' + Enter -> Cycle to the next pattern
    4. For each pattern:
         - Let it settle.
         - Take your calibration photo.
         - Save it with the correct filename:
             top_impulse_center.jpg
             bottom_impulse_center.jpg
             collision_center.jpg
             edges_only.jpg

  Notes:
    - This sketch assumes two separate LED strips:
        TOP_STRIP  on PIN_TOP
        BOTTOM_STRIP on PIN_BOTTOM
    - LEDs are assumed to be WS2812 / NeoPixel type.
    - If your LED type or wiring is different, only the
      Adafruit_NeoPixel setup needs to change; the pattern logic
      (which indices get lit) stays the same.

*/

#include <Arduino.h>
#include <Adafruit_NeoPixel.h>

// ----------- CONFIGURE YOUR HARDWARE HERE ----------------------------------

// Data pins for top and bottom strips
// TODO: set these to the actual GPIOs driving your strips
// #define PIN_TOP    5   // example GPIO for top LEDs - now from platformio.ini
// #define PIN_BOTTOM 6   // example GPIO for bottom LEDs - now from platformio.ini

// LED type & color order for NeoPixel
#define LED_TYPE    NEO_GRB + NEO_KHZ800

// Global brightness (0-255). You might want something like 80–150 for calibration
#define GLOBAL_BRIGHTNESS 150

// ----------- OBJECTS -------------------------------------------------------

// NUM_LEDS_PER_STRIP will come from platformio.ini build_flags
Adafruit_NeoPixel stripTop(NUM_LEDS_PER_LEDS_PER_STRIP, PIN_TOP, LED_TYPE);
Adafruit_NeoPixel stripBottom(NUM_LEDS_PER_LEDS_PER_STRIP, PIN_BOTTOM, LED_TYPE);

// Enumeration of our calibration patterns
enum CalPattern {
  PATTERN_TOP_IMPULSE_CENTER = 0,
  PATTERN_BOTTOM_IMPULSE_CENTER,
  PATTERN_COLLISION_CENTER,
  PATTERN_EDGES_ONLY,
  PATTERN_COUNT
};

CalPattern currentPattern = PATTERN_TOP_IMPULSE_CENTER;

// ----------- HELPER FUNCTIONS ---------------------------------------------

// Turn everything off
void clearAll() {
  for (int i = 0; i < NUM_LEDS_PER_STRIP; i++) {
    stripTop.setPixelColor(i, 0, 0, 0);    // off
    stripBottom.setPixelColor(i, 0, 0, 0); // off
  }
}

// Apply the current pattern to the strips
void applyPattern(CalPattern pattern) {
  clearAll();

  // Choose a calibration color (pure white is easiest for analysis)
  uint8_t r = 255;
  uint8_t g = 255;
  uint8_t b = 255;

  // Index of the "center" LED (0-based)
  int centerIndex = NUM_LEDS_PER_STRIP / 2; // if 160 -> 80

  // Safety clamp
  if (centerIndex < 0) centerIndex = 0;
  if (centerIndex >= NUM_LEDS_PER_STRIP) centerIndex = NUM_LEDS_PER_STRIP - 1;

  switch (pattern) {
    case PATTERN_TOP_IMPULSE_CENTER:
      // Top strip: centre LED ON
      stripTop.setPixelColor(centerIndex, stripTop.Color(r, g, b));
      // Bottom: all OFF (already cleared)
      break;

    case PATTERN_BOTTOM_IMPULSE_CENTER:
      // Bottom strip: centre LED ON
      stripBottom.setPixelColor(centerIndex, stripBottom.Color(r, g, b));
      // Top: all OFF
      break;

    case PATTERN_COLLISION_CENTER:
      // Both strips: centre LED ON
      stripTop.setPixelColor(centerIndex, stripTop.Color(r, g, b));
      stripBottom.setPixelColor(centerIndex, stripBottom.Color(r, g, b));
      break;

    case PATTERN_EDGES_ONLY:
      // Light only the far left and far right LEDs on both strips
      stripTop.setPixelColor(0, stripTop.Color(r, g, b));
      stripTop.setPixelColor(NUM_LEDS_PER_STRIP - 1, stripTop.Color(r, g, b));

      stripBottom.setPixelColor(0, stripBottom.Color(r, g, b));
      stripBottom.setPixelColor(NUM_LEDS_PER_STRIP - 1, stripBottom.Color(r, g, b));
      break;

    default:
      // Shouldn't happen, but just in case: all off
      break;
  }

  stripTop.show();
  stripBottom.show();
}

// Print instructions to Serial so future-you remembers what to do
void printHelp() {
  Serial.println();
  Serial.println(F("K1-Lightwave Calibration Firmware"));
  Serial.println(F("--------------------------------"));
  Serial.println(F("Commands:"));
  Serial.println(F(" 1 -> Top Impulse Center (top centre LED ON)"));
  Serial.println(F(" 2 -> Bottom Impulse Center (bottom centre LED ON)"));
  Serial.println(F(" 3 -> Collision Center (top+bottom centre LEDs ON)"));
  Serial.println(F(" 4 -> Edges Only (far left & right LEDs ON both strips)"));
  Serial.println(F(" n -> Next pattern (cycle through 1-4)"));
  Serial.println();
  Serial.println(F("Pattern -> Photo mapping:"));
  Serial.println(F("  1: save as top_impulse_center.jpg"));
  Serial.println(F("  2: save as bottom_impulse_center.jpg"));
  Serial.println(F("  3: save as collision_center.jpg"));
  Serial.println(F("  4: save as edges_only.jpg"));
  Serial.println();
}

// ----------- ARDUINO SETUP / LOOP -----------------------------------------

void setup() {
  Serial.begin(115200);
  delay(1000);

  stripTop.begin();
  stripBottom.begin();
  stripTop.setBrightness(GLOBAL_BRIGHTNESS);
  stripBottom.setBrightness(GLOBAL_BRIGHTNESS);

  clearAll();
  stripTop.show();
  stripBottom.show();

  printHelp();

  // Start with the first pattern by default
  currentPattern = PATTERN_TOP_IMPULSE_CENTER;
  applyPattern(currentPattern);

  Serial.println(F("Initial pattern: 1 (Top Impulse Center)"));
}

void loop() {
  // Check for Serial commands
  if (Serial.available() > 0) {
    int incoming = Serial.read();

    bool changed = false;

    switch (incoming) {
      case '1':
        currentPattern = PATTERN_TOP_IMPULSE_CENTER;
        changed = true;
        Serial.println(F("Selected: 1 (Top Impulse Center)"));
        Serial.println(F("Remember: save photo as top_impulse_center.jpg"));
        break;

      case '2':
        currentPattern = PATTERN_BOTTOM_IMPULSE_CENTER;
        changed = true;
        Serial.println(F("Selected: 2 (Bottom Impulse Center)"));
        Serial.println(F("Remember: save photo as bottom_impulse_center.jpg"));
        break;

      case '3':
        currentPattern = PATTERN_COLLISION_CENTER;
        changed = true;
        Serial.println(F("Selected: 3 (Collision Center)"));
        Serial.println(F("Remember: save photo as collision_center.jpg"));
        break;

      case '4':
        currentPattern = PATTERN_EDGES_ONLY;
        changed = true;
        Serial.println(F("Selected: 4 (Edges Only)"));
        Serial.println(F("Remember: save photo as edges_only.jpg"));
        break;

      case 'n':
      case 'N':
        // Cycle to next pattern
        currentPattern = static_cast<CalPattern>((static_cast<int>(currentPattern) + 1) % PATTERN_COUNT);
        changed = true;
        Serial.print(F("Cycled to pattern: "));
        Serial.println(static_cast<int>(currentPattern) + 1);
        break;

      case 'h':
      case 'H':
      case '?':
        printHelp();
        break;

      default:
        // Ignore other characters
        break;
    }

    if (changed) {
      applyPattern(currentPattern);
    }
  }

  // No animation needed; patterns are static.
  // Just sit here and wait for Serial commands.
}
