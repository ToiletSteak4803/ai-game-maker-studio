import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Gamepad2,
  Sparkles,
  Code2,
  Box,
  Zap,
  Download,
  MessageSquare,
  ArrowRight,
  Check,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Gamepad2 className="h-8 w-8 text-indigo-600" />
            <span className="text-xl font-bold">AI Game Maker</span>
          </div>
          <nav className="hidden items-center gap-6 md:flex">
            <a
              href="#features"
              className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Features
            </a>
            <a
              href="#pricing"
              className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Pricing
            </a>
            <a
              href="#faq"
              className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              FAQ
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="sm">Start Creating</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-32">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-indigo-50/50 to-transparent dark:from-indigo-950/20" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-6xl dark:text-zinc-50">
              Create Games by{" "}
              <span className="text-indigo-600">Chatting</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-zinc-600 dark:text-zinc-400">
              Describe your game idea, let AI generate the code and 3D assets,
              preview it instantly, iterate with natural language, and export
              when ready.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link href="/auth/login">
                <Button size="lg" className="gap-2">
                  Start Creating <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Button size="lg" variant="outline">
                Watch Demo
              </Button>
            </div>
          </div>

          {/* Demo Video Placeholder */}
          <div className="mx-auto mt-16 max-w-5xl">
            <div className="aspect-video overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30">
                    <Gamepad2 className="h-8 w-8 text-indigo-600" />
                  </div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Demo video coming soon
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
              Everything you need to build games
            </h2>
            <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
              From idea to playable game in minutes, not months.
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-5xl gap-8 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<MessageSquare className="h-6 w-6" />}
              title="Chat-Based Development"
              description="Describe what you want in plain English. AI understands your vision and generates the code."
            />
            <FeatureCard
              icon={<Code2 className="h-6 w-6" />}
              title="AI Code Generation"
              description="Powered by OpenAI Codex to generate, modify, and debug game code automatically."
            />
            <FeatureCard
              icon={<Box className="h-6 w-6" />}
              title="3D Asset Generation"
              description="Create 3D models from text prompts using Meshy AI. No 3D modeling skills required."
            />
            <FeatureCard
              icon={<Zap className="h-6 w-6" />}
              title="Instant Preview"
              description="See your game running in real-time as you make changes. No compile waits."
            />
            <FeatureCard
              icon={<Sparkles className="h-6 w-6" />}
              title="Starter Templates"
              description="Begin with pre-built templates for platformers, shooters, and exploration games."
            />
            <FeatureCard
              icon={<Download className="h-6 w-6" />}
              title="Export & Deploy"
              description="Download your complete game project with all assets and deploy anywhere."
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-y border-zinc-200 bg-zinc-50 py-20 sm:py-32 dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
              How it works
            </h2>
            <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
              Three simple steps from idea to game
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-4xl gap-8 md:grid-cols-3">
            <StepCard
              number="1"
              title="Describe Your Game"
              description="Tell us what kind of game you want. A platformer with double jump? A space shooter? Just describe it."
            />
            <StepCard
              number="2"
              title="Generate & Iterate"
              description="AI generates code and assets. Preview instantly, then refine by chatting about changes."
            />
            <StepCard
              number="3"
              title="Export & Share"
              description="Download your complete game project. Deploy it, share it, or continue developing it."
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
              Start free, upgrade when you need more
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-4xl gap-8 md:grid-cols-2">
            <PricingCard
              name="Free"
              price="$0"
              description="Perfect for trying things out"
              features={[
                "5 AI generations per day",
                "3 projects",
                "Community templates",
                "Basic export",
              ]}
              cta="Get Started"
              ctaVariant="outline"
            />
            <PricingCard
              name="Pro"
              price="$29"
              period="/month"
              description="For serious game creators"
              features={[
                "Unlimited AI generations",
                "Unlimited projects",
                "All templates",
                "Priority 3D generation",
                "Version history",
                "Priority support",
              ]}
              cta="Coming Soon"
              ctaVariant="default"
              highlighted
            />
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section
        id="faq"
        className="border-t border-zinc-200 bg-zinc-50 py-20 sm:py-32 dark:border-zinc-800 dark:bg-zinc-900/50"
      >
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
            Frequently asked questions
          </h2>

          <Accordion type="single" collapsible className="mt-12">
            <AccordionItem value="item-1">
              <AccordionTrigger>What technologies do you use?</AccordionTrigger>
              <AccordionContent>
                We use Phaser for 2D games and Three.js for 3D scenes. Code is
                generated using OpenAI&apos;s latest coding models, and 3D
                assets are created with Meshy AI.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>
                Do I need coding experience?
              </AccordionTrigger>
              <AccordionContent>
                No! That&apos;s the whole point. Describe what you want in plain
                English, and the AI handles the code. However, developers can
                also edit the generated code directly.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>Can I export my game?</AccordionTrigger>
              <AccordionContent>
                Yes! You can download your complete project as a zip file with
                all code and assets. It includes a README with instructions to
                run it locally or deploy it.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4">
              <AccordionTrigger>Who owns the games I create?</AccordionTrigger>
              <AccordionContent>
                You do! Any games, code, and assets you create are yours to use
                commercially or personally. We don&apos;t claim any ownership.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-5">
              <AccordionTrigger>
                How accurate is the AI generation?
              </AccordionTrigger>
              <AccordionContent>
                The AI is very capable but not perfect. Complex features may
                require iteration. That&apos;s why we show you diffs before
                applying changes, so you can review what the AI is doing.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
              Ready to create your game?
            </h2>
            <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
              Start building in minutes. No credit card required.
            </p>
            <div className="mt-8">
              <Link href="/auth/login">
                <Button size="lg" className="gap-2">
                  Start Creating <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 py-12 dark:border-zinc-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <Gamepad2 className="h-6 w-6 text-indigo-600" />
              <span className="font-semibold">AI Game Maker Studio</span>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              &copy; {new Date().getFullYear()} AI Game Maker Studio. All rights
              reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30">
        {icon}
      </div>
      <h3 className="mb-2 font-semibold text-zinc-900 dark:text-zinc-50">
        {title}
      </h3>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
    </div>
  );
}

function StepCard({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-lg font-bold text-white">
        {number}
      </div>
      <h3 className="mb-2 font-semibold text-zinc-900 dark:text-zinc-50">
        {title}
      </h3>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
    </div>
  );
}

function PricingCard({
  name,
  price,
  period,
  description,
  features,
  cta,
  ctaVariant,
  highlighted,
}: {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  cta: string;
  ctaVariant: "default" | "outline";
  highlighted?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-8 ${
        highlighted
          ? "border-indigo-600 bg-white ring-2 ring-indigo-600 dark:bg-zinc-900"
          : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
      }`}
    >
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        {name}
      </h3>
      <div className="mt-4 flex items-baseline">
        <span className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
          {price}
        </span>
        {period && (
          <span className="ml-1 text-zinc-600 dark:text-zinc-400">{period}</span>
        )}
      </div>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        {description}
      </p>
      <ul className="mt-6 space-y-3">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-2">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              {feature}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-8">
        <Link href="/auth/login">
          <Button variant={ctaVariant} className="w-full">
            {cta}
          </Button>
        </Link>
      </div>
    </div>
  );
}
