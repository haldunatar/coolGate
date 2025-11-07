from gpiozero import PWMOutputDevice
from time import sleep

# Use GPIO18 (Pin 12)
esc = PWMOutputDevice(18, frequency=50)  # 50 Hz like a servo signal

def set_throttle(pulse_ms):
    # Convert microsecond pulse (1–2ms) to duty cycle (0–1)
    duty = (pulse_ms / 20.0)
    esc.value = duty

print("Connect battery, wait for beeps...")

# Minimum throttle (1ms pulse)
set_throttle(1.0)
sleep(5)  # let ESC arm

# Slowly ramp up
print("Ramping up...")
for p in [1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2.0]:
    set_throttle(p)
    print(f"Pulse {p} ms")
    sleep(1)

# Back to idle
set_throttle(1.0)
print("Done. Back to idle.")
sleep(2)
esc.close()
