import Sensor from "./sensor";
import Navigator from "./navigator";
import {Engines, PhysicalOptions, Steering} from "rover";

const STOP_SPEED = 0;
const MINIMUM_DRIVE_SPEED = 0.53;
const MAXIMUM_DRIVE_SPEED = 0.8;
const MINIMUM_TURNING_SPEED = 0.85;

class Rover {
    sensor: Sensor;
    navigator: Navigator;
    speed: { left: number, right: number };
    shouldOrientate: boolean = false;
    shouldDrive: boolean = false;
    rerouteObstacle: boolean = false;
    rerouted: boolean = false;
    rerouting: boolean = false;
    headingError: number = 5;
    obstacleDetected: boolean = false;
    //authenticity: PhysicalOptions;

    constructor(
        sensor: Sensor,
        navigator: Navigator,
        //authenticity: PhysicalOptions,
    ) {
        this.sensor = sensor;
        this.navigator = navigator;
        //this.authenticity = authenticity;
        this.speed = { left: 0, right: 0, };
    }

    go() {

        // stop at final destination
        if (this.navigator.atFinalDestination) {
            this.speed = { left: STOP_SPEED, right: STOP_SPEED}
            return this.drive();
        }

        // set first destination
        if (this.navigator.atOrigin) {
            this.navigator.nextDestination();
            this.navigator.atOrigin = false;
        }

        // set new destination
        if (!this.navigator.atOrigin && this.navigator.atTarget && this.sensor.targetDistance < 1) {
            if (this.rerouted) {
                this.navigator.targetLocation = this.navigator.priorRerouteTarget
                this.rerouted = false;
                this.obstacleDetected = false;
            } else {
                this.navigator.nextDestination(true);
            }

            this.navigator.atTarget = false;
            this.rerouteObstacle = false;
            this.obstacleDetected = false;
            this.shouldOrientate = true;
            this.shouldDrive = false;

            return this.drive();
        }

        let angCurrent = this.navigator.angle(this.navigator.currentLocation, this.navigator.targetLocation);
        let angDiffCurrent = this.navigator.angleDiff(this.sensor.heading, angCurrent);
        let diff = Math.abs(this.sensor.heading - angCurrent) % 359;

        if (diff < 10) {
            if (this.sensor.targetDistance < 0.3 && Math.floor(this.sensor.drivingSpeed) < 0.1) {
                if (!this.navigator.atOrigin) {
                    this.navigator.atTarget = true;
                }
            } else {
                this.shouldDrive = true;
            }
        } else {

            this.shouldOrientate = true;
        }

        // travel or turn
        if (this.shouldDrive) {
            this.travel();

            if (!this.shouldOrientate) {
                //this.correct(angCurrent, angDiffCurrent);
            }
        }

        if (this.shouldOrientate) {
            this.turn();
        }

        // scan for obstacles
        this.scanForObstacles();

        return this.drive();
    }

    correct(angle: number, diff: number) {
        let margin = 0.5;

        if (this.sensor.targetDistance < 1) {
            margin = 0.01;
        }

        if (Math.abs(diff) > margin) {
            if (diff > 0) {
                this.turnRight();
            } else {
                this.turnLeft();
            }
        }
    }

    turnLeft(speed: number = MINIMUM_TURNING_SPEED) {
        this.speed = {
            left: -MINIMUM_TURNING_SPEED,
            right: MINIMUM_TURNING_SPEED,
        }
    }

    turnRight(speed: number = MINIMUM_TURNING_SPEED) {
        this.speed = {
            left: MINIMUM_TURNING_SPEED,
            right: -MINIMUM_TURNING_SPEED,
        }
    }

    turn() {
        let ang = this.navigator.angle(this.navigator.currentLocation, this.navigator.targetLocation);
        let diff = Math.abs(this.sensor.heading - ang) % 359;
        let angleDiff = this.navigator.angleDiff(this.sensor.heading, ang);

        let direction = (angleDiff < 0) ? 'left' : 'right';

        if (Math.abs(diff) < 2) {
            if (Math.floor(this.sensor.turningSpeed) == 0) {
                this.shouldOrientate = false;
                this.shouldDrive = true;
            }
        }

        if (direction == 'left') {
            this.turnLeft(MINIMUM_TURNING_SPEED);
        } else {
            this.turnRight(MINIMUM_TURNING_SPEED);
        }
    }

    travel() {
        let speed = STOP_SPEED;

        if (this.sensor.targetDistance < 0.3) {
            if (Math.floor(this.sensor.drivingSpeed) == 0) {
                this.shouldDrive = false;
                this.navigator.atTarget = true;
            }
        } else {
            if (this.sensor.targetDistance < 5) {
                if (this.sensor.targetDistance < 3) {
                    speed = MINIMUM_DRIVE_SPEED;
                } else {
                    if (this.sensor.drivingSpeed > 0.2) {
                        speed = 0;
                    } else {
                        speed = MINIMUM_DRIVE_SPEED;
                    }
                }
            } else {
                if (this.sensor.drivingSpeed > 2) {
                    speed = MAXIMUM_DRIVE_SPEED;
                } else {
                    speed = 0.65;
                }
            }
        }

        this.speed = { left: speed, right: speed };
    }

    scanForObstacles() {
        const possibleObstacles = this.sensor.proximity.filter((obstacle) => {
            if (obstacle !== -1 && obstacle < 4) {
                return true;
            }
        })

        let keys :Array<number> = [];
        let keyTotal :number = 0;
        let obstacleDirection :number = 0;
        let obstacleDistance :number = 0;

        if (possibleObstacles.length > 0) {
            possibleObstacles.forEach(value => {
                obstacleDistance += value;
                keys.push(this.sensor.proximity.indexOf(value) * 2);
                keyTotal += this.sensor.proximity.indexOf(value);
            })

            const mean = this.navigator.meanAngle(keys);
            obstacleDistance =(obstacleDistance / keys.length);

            if (this.obstacleDetected) {
                if (obstacleDistance < 2.0) {
                    if (this.sensor.targetDistance < 8 && !this.rerouted) {
                        this.navigator.nextDestination(true);
                    }

                    if (!this.rerouted) {
                        const newTarget = this.navigator.currentLocation.destinationPoint(8.5, this.sensor.heading);
                        this.navigator.priorRerouteTarget = this.navigator.targetLocation;
                        this.rerouted = true;
                        this.navigator.targetLocation = newTarget;
                    }

                    this.speed = {
                        left: 0.65,
                        right: 0.65,
                    }

                    if (mean > 0 && mean < 90) {
                        this.turnLeft();
                        this.rerouteObstacle = true;
                    }

                    if (mean < 360 && mean > 270) {
                        this.turnRight();
                        this.rerouteObstacle = true;
                    }
                } else {
                    if (obstacleDistance < 2.1) {
                        this.speed = {
                            left: 0.6,
                            right: 0.6,
                        }
                    }
                }
            }

            if (Math.floor(this.sensor.drivingSpeed) == 0) {
                this.obstacleDetected = true;
            }

            if (!this.obstacleDetected && this.sensor.drivingSpeed > 0.3) {
                this.stop();
            }
        }
    }

    stop() {
        this.speed = { left: STOP_SPEED, right: STOP_SPEED};
    }

    drive() {
        let engines: Engines = [this.speed.right, this.speed.left, this.speed.right, this.speed.left, this.speed.right, this.speed.left];
        let steering: Steering = [0, 0, 0, 0];

        return {
            engines: engines,
            steering: steering,
        }
    }
}

export default Rover;
