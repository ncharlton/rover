import {ControlLoop, Simulation, VehicleType, AUTHENTICITY_LEVEL2} from 'rover'
import LatLon from 'geodesy/latlon-spherical'
import Navigator from './navigator'
import Sensor from "./sensor";
import Rover from "./rover";

const origin = {
  latitude: 52.47314075953856,
  longitude: 13.408522540373864
}

/**
 * x
 * y
 * x
 * y
 */
const destinationPoints = [
  {
    latitude: 52.47321420688359,
    longitude: 13.408738801250266,
    label: 'Bottom-Right'
  },
  {
    latitude: 52.47321420688359,
    longitude: 13.408158429989276,
    label: 'Top-Right'
  },
  {
    latitude: 52.47352844831028,
    longitude: 13.408738801250266,
    label: 'Bottom-Left'
  },
  {
    latitude: 52.47352844831028,
    longitude: 13.408158429989276,
    label: 'Top-Left'
  },
]

const obstacles = [
  {
    latitude:52.47715035313238,
    longitude:13.3951399999999,
    radius: 2
  },
  {
    latitude:52.47712035313238,
    longitude:13.3950199999999,
    radius: 2
  },
]

// create rectangle scan area
const lowerDestination1 = new LatLon(destinationPoints[0].latitude, destinationPoints[0].longitude);
const upperDestination1 = new LatLon(destinationPoints[1].latitude, destinationPoints[1].longitude);
const lowerDestination2 = new LatLon(destinationPoints[2].latitude, destinationPoints[2].longitude);
const upperDestination2 = new LatLon(destinationPoints[3].latitude, destinationPoints[3].longitude);

const distancer = 2;

const width = lowerDestination1.distanceTo(lowerDestination2);
const itemCount = Math.floor(width / distancer);
const bearingLow = lowerDestination1.initialBearingTo(lowerDestination2);
const bearingTop = upperDestination1.initialBearingTo(upperDestination2);
let destinations = [];

let odd = false;
for (let i = 1; i < itemCount; i++) {
  const lower = lowerDestination1.destinationPoint(distancer * i, bearingLow);
  const upper = upperDestination1.destinationPoint(distancer * i, bearingTop);

  if (i == 1) {
    destinations.push({
      latitude: lowerDestination1.latitude,
      longitude: lowerDestination1.longitude,
      label: 'L0'
    })

    destinations.push({
      latitude: upperDestination1.latitude,
      longitude: upperDestination1.longitude,
      label: 'U0'
    })
  }

  if (odd) {
    destinations.push({
      latitude: lower.latitude,
      longitude: lower.longitude,
      label: 'L' + i,
    })

    destinations.push({
      latitude: upper.latitude,
      longitude: upper.longitude,
      label: 'U' + i,
    })

    odd = false;
  } else {
    destinations.push({
      latitude: upper.latitude,
      longitude: upper.longitude,
      label: 'U' + i,
    })

    destinations.push({
      latitude: lower.latitude,
      longitude: lower.longitude,
      label: 'L' + i,
    })

    odd = true;
  }

  if ((itemCount - i)== 1) {
    destinations.push({
      latitude: upperDestination2.latitude,
      longitude: upperDestination2.longitude,
      label: 'UF'
    })

    destinations.push({
      latitude: lowerDestination2.latitude,
      longitude: lowerDestination2.longitude,
      label: 'LF'
    })
  }
}

const loop: ControlLoop = ({location, heading, targetFinderSignal: number,  clock, proximity}, {engines, steering}) => {
  navigator.updateCurrentLocation(location.latitude, location.longitude);

  sensor.updateProximities(proximity);
  sensor.measure(heading, clock);

  return rover.go();
}

const simulation = new Simulation({
  loop,
  origin: origin,
  vehicleType: VehicleType.Tank,
  element: document.querySelector('main') as HTMLElement,
  locationsOfInterest: destinations,
  renderingOptions: {
    width: 800,
    height: 800,
  },
  physicalConstraints: AUTHENTICITY_LEVEL2,
  obstacles: [
    {
      radius: 1.5,
      latitude: 52.473349975964524,
      longitude: 13.408410590227112
    }, {
      radius: 1.5,
      latitude: 52.47334842753099,
      longitude: 13.408562210366549
    }, {
      radius: 2,
      latitude: 52.473289718711364,
      longitude: 13.40855661992137
    }]
});

// navigator
const navigator = new Navigator();
navigator.addDestinations(destinations);
navigator.setSourceLocation(origin.latitude, origin.longitude);
// sensor
const sensor = new Sensor(navigator);
// rover
const rover = new Rover(sensor, navigator);


simulation.start();
