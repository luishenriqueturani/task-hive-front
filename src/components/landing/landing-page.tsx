import { AmbientBackground } from "@/components/layout/ambient-background";
import { LandingFooter } from "./landing-footer";
import { LandingHeader } from "./landing-header";
import { LandingHero } from "./landing-hero";
import { LandingPlans } from "./landing-plans";
import { LandingProduct } from "./landing-product";

/**
 * Landing comercial pública: header, hero, produto, planos e rodapé.
 */
export function LandingPage({ signedIn }: { signedIn: boolean }) {
  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-x-hidden bg-app-bg">
      <AmbientBackground />
      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <LandingHeader signedIn={signedIn} />
        <main>
          <LandingHero signedIn={signedIn} />
          <LandingProduct />
          <LandingPlans signedIn={signedIn} />
          <LandingFooter signedIn={signedIn} />
        </main>
      </div>
    </div>
  );
}
