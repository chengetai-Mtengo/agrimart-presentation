'use client';

// A page-level <h1> that sits directly on the app background rather than
// inside a white card. Wrapped in a translucent chip so it stays crisp and
// readable no matter which part of the background photo happens to be
// behind it — cards elsewhere don't need this since they're already solid.
export default function PageHeading({ children, className = '' }) {
  return (
    <h1 className={`text-2xl font-semibold tracking-tight text-foreground md:text-3xl ${className}`}>
      {children}
    </h1>
  );
}
