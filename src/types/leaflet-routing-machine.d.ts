// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as L from "leaflet";

declare module "leaflet" {
  namespace Routing {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function control(options: any): any;
  }
}
