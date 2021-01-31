import {ControlLoop, Simulation, AUTHENTICITY_LEVEL1, AUTHENTICITY_LEVEL2, RoverType, PhysicalOptions} from 'rover'
import LatLon, { Dms } from 'geodesy/latlon-spherical'
import Queue from './destinationQueue';
import Navigator from './navigator'
import Sensor from "./sensor";
import Rover from "./rover";

const origin = {
  latitude:52.47704035313238,
  longitude:13.3953812272892,
}

/**
 * x
 * y
 * x
 * y
 */
const destinationPoints = [
  {
    latitude:52.47705035313238,
    longitude:13.3952812272892,
    label: 'lower1'
  },
  {
    latitude:52.47722035313238,
    longitude:13.3952812272892,
    label: 'upper1'
  },
  {
    latitude:52.4770303524624,
    longitude:13.394882565093246,
    label: 'lower2'
  },
  {
    latitude:52.47724035246239,
    longitude:13.394882563552992,
    label: 'upper2'
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
  roverType: RoverType.tank,
  element: document.querySelector('main') as HTMLElement,
  locationsOfInterest: destinations,
  renderingOptions: {
    width: 800,
    height: 800,
  },
  //physicalConstraints: AUTHENTICITY_LEVEL2,
  obstacles: obstacles,
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
