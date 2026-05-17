import { Bike } from "lucide-react";

export default function AppSplash() {
  return (
    <div className="app-splash" role="status" aria-label="Loading">
      <div className="app-splash__logo">
        <Bike className="h-9 w-9 text-white" strokeWidth={2.25} />
      </div>
      <p className="app-splash__title">Nainital Store</p>
      <p className="app-splash__sub">Delivery Partner</p>
      <div className="app-splash__bar" aria-hidden>
        <span className="app-splash__bar-fill" />
      </div>
    </div>
  );
}
