const Gpio = require("onoff").Gpio;
const express = require("express");
const bodyParser = require("body-parser");
const app = express();

app.use(express.static(__dirname + "/."));
app.use(bodyParser.urlencoded({ extended: "true" }));
app.use(bodyParser.json());
app.use(bodyParser.json({ type: "application/vnd.api+json" }));

const AUTH_KEY = ""; // your auth key here

// Door States
const Closed = "CLOSED";
const Closing = "CLOSING";
const Open = "OPEN";
const Opening = "OPENING";
const OpeningStopped = "OPENING_STOPPED";
const ClosingStopped = "CLOSING_STOPPED";
const Unknown = "UNKNOWN";

const _DoorState = Closed;

// Gpio pins setup
const relayModule = new Gpio(4, "out"); // Correct pin for relay module
const openSensor = new Gpio(17, "in", "both"); // Correct pin for open sensor
const closeSensor = new Gpio(18, "in", "both"); // Correct pin for close sensor

// Init
relayModule.writeSync(0); // Relay module off

openSensor.watch((err, value) => {
  if (err) {
    console.error("Error reading sensor:", err);
    return;
  }

  // Open sensor logic: should assign doorstate open when closed.
  if (value === 0) {
    _DoorState = Open;
    console.log("Magnet closed (CLOSED)");
  } else {
    // when the open sensor is opened/triggered the door is closing
    _DoorState = Closing;
    checkDoorState();
    console.log("Magnet opened (OPENED)");
  }
});

closeSensor.watch((err, value) => {
  if (err) {
    console.error("Error reading sensor:", err);
    return;
  }

  // Close sensor logic: should assign doorstate closed when closed.
  if (value === 0) {
    _DoorState = Closed;
    console.log("Magnet closed (CLOSED)");
  } else {
    // when the close sensor is opened/triggered the door is opening
    _DoorState = Opening;
    checkDoorState();
    console.log("Magnet opened (OPENED)");
  }
});

app.get("/", checkAuth, (req, res) => res.render("./index.html"));

app.get("/doorState", checkAuth, (req, res) => {
  res.json({ doorState: _DoorState });
});

app.post("/authMe/:key", checkAuth, (req, res) => {
  // authenticate user
  res.json({ success: true });
});

app.post("/knock", checkAuth, (req, res) => {
  relayModule.writeSync(1); // Activate relay
  setTimeout(() => {
    relayModule.writeSync(0); // Deactivate relay after 500 milliseconds
  }, 500);

  if (_DoorState === Closing) {
    _DoorState = ClosingStopped;
  } else if (_DoorState === Opening) {
    _DoorState = OpeningStopped;
  }
  res.json({ success: true });
});

app.listen("3000", () => console.log("running on 3000"));

// Clean up GPIO on exit
process.on("SIGINT", () => {
  openSensor.unexport();
  relayModule.unexport();
  console.log("\nExiting gracefully...");
  process.exit();
});

const checkDoorState = () => {
  setTimeout(() => {
    console.log("waiting for reed state to update...");
    if (_DoorState !== Closed && _DoorState !== Open) {
      _DoorState = HalfOpen;
    }
  }, 8000);
};

function checkAuth(req, res, next) {
  const key = req.params.key || req.query.key || req.headers["x-api-key"];

  if (key === AUTH_KEY) {
    return next();
  }

  return res.status(401).json({ success: false, message: "Invalid key" });
}
