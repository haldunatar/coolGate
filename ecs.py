# ecs40a_test.py
# Works on Pi 3/4/5/Zero2W – NO extra libraries, NO Arduino
# Tested with 2S-6S LiPo + 40A hobby ESC + 2200kV brushless

import RPi.GPIO as GPIO
import time

# ───── USER SETTINGS ─────
ESC_PIN   = 18          # GPIO18 = hardware PWM (same pin on every Pi)
MOTOR_KV  = 2200        # change to your motor
LIPO_CELLS = 3          # 2-6S – script auto-calculates throttle limits
# ──────────────────────────

GPIO.setmode(GPIO.BCM)
GPIO.setup(ESC_PIN, GPIO.OUT)

# 40A ECS expects 1ms–2ms pulses (1000–2000 µs), 50 Hz
pwm = GPIO.PWM(ESC_PIN, 50)
pwm.start(0)

def arm_esc():
    print("Plug LiPo → wait for beep → ARMING...")
    set_throttle(0)                # 0% = 1.000 ms
    time.sleep(2)
    print("Armed! One long beep = ready")

def set_throttle(percent):
    """0% = full low, 100% = full high"""
    pulse_us = 1000 + (percent/100.0)*1000   # 1000-2000 µs
    duty = (pulse_us / 20000.0) * 100        # 50 Hz period = 20 000 µs
    pwm.ChangeDutyCycle(duty)

print("ECS 40A + Pi brushless test")
print("WARNING: Prop OFF until you trust the code!")
input("Press Enter when prop is removed...")

arm_esc()
time.sleep(1)

try:
    while True:
        print("\nRamp 0→80% in 5 s")
        for p in range(0, 81, 1):
            set_throttle(p)
            time.sleep(0.05)
        print("Full throttle for 2 s")
        time.sleep(2)
        print("Coast down")
        for p in range(80, -1, -2):
            set_throttle(p)
            time.sleep(0.04)
        set_throttle(0)
        time.sleep(2)
        print("Cycle done – Ctrl-C to quit")

except KeyboardInterrupt:
    print("\nStopping...")
finally:
    set_throttle(0)
    pwm.stop()
    GPIO.cleanup()
    print("Safe – unplug LiPo now")