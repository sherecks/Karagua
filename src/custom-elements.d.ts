import type React from "react";

declare module "react/jsx-runtime" {
  namespace JSX {
    interface IntrinsicElements {
      "karagua-leaflet-map": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          "center-lat"?: string;
          "center-lng"?: string;
          zoom?: string;
          "csv-url"?: string;
          "dark-mode"?: string;
        },
        HTMLElement
      >;
    }
  }
}
