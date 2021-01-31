import Navigator from "./navigator";
import Queue from "./destinationQueue";

class Sensor {
    headingBuffer: Queue<number> = new Queue<number>();
    clockBuffer: Queue<number> = new Queue<number>();
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
        //this.drivingSpeed = this.calculateSpeed(this.navigator.locations.queue()[0].distanceTo(this.navigator.locations.queue()[18]), this.time);
        this.drivingSpeed = this.calculateSpeed(this.navigator.previousLocation.distanceTo(this.navigator.currentLocation), this.time);
        this.turningSpeed = this.calculateSpeed(this.headingChange, this.time);

        // is driving or turning
        this.isDriving = false;
        this.isTurning = false;

        if (this.drivingSpeed > 0.01) {
            this.isDriving = true;
        }
        if (this.turningSpeed > 0.01) {
            this.isTurning = true;
        }

        this.updateHeading(heading);


        //this.log();
    }

    updateHeading(heading: number) {
        this.previousHeading = this.heading;

        this.headingBuffer.enqueue(heading);

        if (this.headingBuffer.size() == 50) {
            this.headingBuffer.dequeue();

            let headingTotal: number = 0;
            this.headingBuffer.queue().forEach((element) => {
                headingTotal += element;
            })

            //let headingMean = headingTotal / this.headingBuffer.size();
            let headingMean = this.navigator.meanAngle(this.headingBuffer.queue());
            this.headingBuffer.enqueue(headingMean);
            this.headingBuffer.dequeue();
            this.heading = headingMean;
            this.headingChange = Math.abs(this.headingBuffer.queue()[0] - this.headingBuffer.queue()[48]);
        } else {
            this.heading = heading;
        }
    }

    updateDistance() {
        this.previousTargetDistance = this.targetDistance;
        this.targetDistance = this.navigator.currentLocation.distanceTo(this.navigator.targetLocation);
    }

    updateProximities(proximities: Array<number>) {
        this.proximity = proximities;
    }

    updateTime(clock: number) {
        this.clockBuffer.enqueue(clock);

        if (this.clockBuffer.size() == 50) {
            this.clockBuffer.dequeue();

            let clockStart: number = this.clockBuffer.queue()[0];
            let clockEnd: number = this.clockBuffer.queue()[48];

            this.time = (clockEnd - clockStart) / 1000;
        } else {
            this.time = (clock - this.clock) / 1000;
        }
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
