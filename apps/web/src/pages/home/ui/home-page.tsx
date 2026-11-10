import type { FC } from 'react';
import { Hero } from '@/widgets/hero';
import { ShowcaseWidget } from '@/widgets/showcase';
import { StorefrontWidget } from '@/widgets/storefront';
import { LeadForm } from '@/features/lead-submission';

interface HomePageProps {
  readonly onIntakeClick?: () => void;
  readonly onExploreSystems?: () => void;
}

export const HomePage: FC<HomePageProps> = ({ onIntakeClick, onExploreSystems }) => {
  return (
    <div className="flex flex-col gap-24">
      <section id="studio">
        <Hero onOpenTerminal={onIntakeClick} onViewBlueprint={onExploreSystems} />
      </section>

      <section id="systems">
        <ShowcaseWidget />
      </section>

      <section id="knowledge">
        <StorefrontWidget />
      </section>

      <section id="terminal">
        <LeadForm />
      </section>
    </div>
  );
};
