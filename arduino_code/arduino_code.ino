#include <SoftwareSerial.h>

#define TRIG_PIN 7
#define ECHO_PIN 6
#define TANK_ID "TANK-1"

SoftwareSerial sim800(3, 2);  // SIM800L TX -> D2, RX -> D3
String lastColor = "";
float lastHeight = -1;  // store last water height (cm)

void setup() {
  Serial.begin(9600);
  sim800.begin(9600);

  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  Serial.println("Initializing SIM800L...");
  delay(2000);

  sim800.println("AT");
  delay(1000);
  showResponse();
  sim800.println("AT+CMGF=1");  // Text mode
  delay(1000);
  showResponse();

  Serial.println("System ready! Monitoring water level...");
}

void loop() {
  float distance = measureDistance();  // cm
  String color = getStatusColor(distance);

  Serial.println("------------------------------------------------");
  Serial.println("Measured Distance (cm): " + String(distance, 1));
  Serial.println("Computed Status: " + color);

  if (distance > 17.0) {
    // No SMS above 17 cm
    if (lastColor != "" || lastHeight != -1) {
      Serial.println("Distance > 17cm → no SMS. Clearing last records.");
      lastColor = "";
      lastHeight = -1;
    }
  } else {
    // distance ≤ 17 → check if SMS needed
    bool send = false;

    if (lastColor != color) {
      // status color changed
      send = true;
      Serial.println("Color changed!");
    } else if (lastHeight != -1 && fabs(distance - lastHeight) > 1.0) {
      // same color but significant level change (>2 cm)
      send = true;
      Serial.println("Height changed by >1cm!");
    }

    if (send) {
      // keep same SMS format as before
      String message = String(TANK_ID) + ":" + color + " | H=" + String(distance, 1) + "cm";
      sendSMS("+919163067541", message);
      Serial.println("✅ SMS Sent: " + message);

      lastColor = color;
      lastHeight = distance;
    } else {
      Serial.println("No major change → no SMS sent.");
    }
  }

  Serial.println("------------------------------------------------");
  delay(3000);  // check every 10 seconds
}

// ---------------- Helper Functions ----------------

float measureDistance() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  unsigned long duration = pulseIn(ECHO_PIN, HIGH, 30000);  // timeout 30ms
  if (duration == 0) return 999.0;  // no echo → treat as far
  float distance = (duration * 0.0343) / 2.0;
  return distance;
}

String getStatusColor(float distance) {
  if (distance > 17.0) return "OUT";     // beyond jug height
  if (distance > 11.0) return "GREEN";   // safe
  if (distance > 5.0) return "YELLOW";   // warning
  return "RED";                          // danger
}

void sendSMS(String number, String text) {
  sim800.println("AT+CMGS=\"" + number + "\"");
  delay(1000);
  sim800.print(text);
  delay(1000);
  sim800.write(26);  // Ctrl+Z
  delay(5000);
  showResponse();
}

void showResponse() {
  while (sim800.available()) {
    Serial.write(sim800.read());
  }
}
