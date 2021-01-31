import LatLon, { Dms } from 'geodesy/latlon-spherical'
import Queue from "./destinationQueue";

class Navigator {
    destinations: Queue<LatLon> = new Queue<LatLon>();
    locations: Queue<LatLon> = new Queue<LatLon>();
    currentLocation: LatLon = new LatLon(0, 0);
    sourceLocation: LatLon = new LatLon(0, 0);
    previousLocation: LatLon = new LatLon(0, 0);
    targetLocation: LatLon = new LatLon(0, 0);
    rerouteLocation: LatLon = new LatLon(0, 0);
    priorRerouteTarget: LatLon = new LatLon(0, 0);
    atOrigin: boolean = true;
    atSource: boolean = false;
    atTarget: boolean = false;
    atFinalDestination: boolean = false;

    constructor() {}

    addDestinations(destinations: Array<{ latitude: number, longitude: number }>) {
        destinations.forEach(destination => {
            this.destinations.enqueue(new LatLon(destination.latitude, destination.longitude));
        })
    }

    nextDestination(overwrite: boolean = false) {
        console.log("NEXT");
        let destination = this.destinations.dequeue();

        if (destination === undefined) {
            destination = this.currentLocation;
            this.atTarget = true;
            this.atFinalDestination = true;
        }

        if (overwrite) {
            this.sourceLocation = this.targetLocation;
        }

        this.targetLocation = destination;
    }

    updateCurrentLocation(latitude: number, longitude: number):void {
        this.previousLocation = this.currentLocation;
        const location = new LatLon(latitude, longitude)

        this.locations.enqueue(location);

        if (this.locations.size() == 50) {
            this.locations.dequeue();

            let latTotal: number = 0;
            let lonTotal: number = 0;

            this.locations.queue().forEach((element) => {
                latTotal += element.latitude;
                lonTotal += element.longitude;
            })

            this.currentLocation = new LatLon(latTotal / this.locations.size(), lonTotal / this.locations.size());
            this.locations.enqueue(this.currentLocation);
            this.locations.dequeue();
        } else {
            this.currentLocation = location;
        }
    }

    setSourceLocation(latitude: number, longitude: number):void {
        this.sourceLocation = new LatLon(latitude, longitude);
    }

    ang(sourceLocation: LatLon, targetLocation: LatLon):number {
        const y = targetLocation.latitude - sourceLocation.latitude;
        const x = Math.cos(Math.PI / 180 * sourceLocation.latitude) * (targetLocation.longitude - sourceLocation.longitude);
        return Math.atan2(y, x) * (180 / Math.PI);
    }

    angle(sourceLocation: LatLon, targetLocation: LatLon):number {
        return sourceLocation.initialBearingTo(targetLocation);
    }

    meanAngle(angles: Array<number>) {
        let mean = 180 / Math.PI * Math.atan2(
            this.sum(angles.map(this.degToRad).map(Math.sin)) / angles.length,
            this.sum(angles.map(this.degToRad).map(Math.cos)) / angles.length,
        )

        if (mean < 0) {
            mean += 360;
        }

        return mean;
    }

    sum (items: Array<number>) {
        let sum: number = 0;
        items.forEach((num) => {
            sum += num;
        })

        return sum;
    }

    degToRad(a: number) {
        return Math.PI / 180 * a;
    }

    angleDiff(angle1: number, angle2: number) {
        let diff = angle2 - angle1;
        diff -= diff > 180 ? 360 : 0;
        diff += diff < -180 ? 360 : 0;
        return diff;

    }
}

export default Navigator;
