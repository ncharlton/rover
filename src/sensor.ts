import Navigator from "./navigator";

class Sensor {
    drivingSpeed: number = 0;
    drivingAcceleration: number = 0;
    turningSpeed: number = 0;
    turningAcceleration: number = 0;
    previousTargetDistance: number = 0;
    targetDistance: number = 0;
    time: number = 0;
    clock: number = 0;
    heading: number = 0;
    previousHeading: number = 0;
    headingChange: number = 0;
    navigator: Navigator;
    isDriving: boolean = false;
    isTurning: boolean = false;
    proximity: Array<number> = [];

    constructor(
        navigator: Navigator,
    ) {
        this.navigator = navigator;
    }

    measure(heading: number, clock: number) {
        this.updateDistance();
        this.updateTime(clock);

        // calculate speeds
        this.drivingSpeed = this.calculateSpeed(this.navigator.previousLocation.distanceTo(this.navigator.currentLocation), this.time);
        this.turningSpeed = this.calculateSpeed((heading - this.heading), this.time);

        // is driving or turning
        this.isDriving = false;
        this.isTurning = false;

        if (this.drivingSpeed > 0.01) {
            this.isDriving = true;
        }
        if (this.turningSpeed > 0.01) {
            this.isTurning = true;
        }

        // update properties
        this.previousHeading = this.heading;
        this.heading = heading;
        this.clock = clock;
        this.headingChange = Math.abs((heading - this.heading));

        //this.log();
    }

    updateDistance() {
        this.previousTargetDistance = this.targetDistance;
        this.targetDistance = this.navigator.currentLocation.distanceTo(this.navigator.targetLocation);
    }

    updateProximities(proximities: Array<number>) {
        this.proximity = proximities;
    }

    updateTime(clock: number) {
        this.time = (clock - this.clock) / 1000;
    }

    calculateSpeed(distance: number, time: number) {
        return distance / time;
    }

    log () {
        console.log("Heading:", this.heading);
        console.log("Driving Speed:", this.drivingSpeed);
        console.log("Turning Speed:", this.turningSpeed);
        console.log("Distance to target:", this.targetDistance);
    }
}

export default Sensor;
