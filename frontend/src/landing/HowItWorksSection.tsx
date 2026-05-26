import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] },
  }),
};

const steps = [
  {
    number: '01',
    title: 'Brief',
    description: 'Tell us your dream destinations and travel style. We map out your preferences—carefully.',
  },
  {
    number: '02',
    title: 'Direction',
    description: 'Our experts synthesize your goals into a curated route, selecting the best stays and local secrets.',
  },
  {
    number: '03',
    title: 'Build',
    description: 'We assemble the journey—securing private bookings, transport, and exclusive experiences for you.',
  },
  {
    number: '04',
    title: 'Launch',
    description: 'Your itinerary is live. Everything is synced, confirmed, and ready for your departure. Bon voyage!',
  },
];

export default function HowItWorksSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="how-it-works" style={{ background: 'black', scrollMarginTop: '5rem' }}>
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          padding: '10rem 1.5rem 14rem',
        }}
      >
        <motion.img
          src="/section3-bg.jpg"
          animate={{
            scale: [1.06, 1.12, 1.06],
            x: ['0%', '-2%', '0%'],
            y: ['0%', '-1.5%', '0%'],
          }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center center',
            transformOrigin: 'center center',
            zIndex: 0,
          }}
          alt=""
        />

        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(to bottom, black 0%, rgba(0,0,0,0.75) 10%, rgba(0,0,0,0.4) 20%, transparent 38%, transparent 72%, rgba(0,0,0,0.6) 88%, black 100%)',
            zIndex: 1,
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(to right, black 0%, transparent 18%, transparent 82%, black 100%)',
            zIndex: 1,
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.38)',
            zIndex: 1,
            pointerEvents: 'none',
          }}
        />

        <div
          ref={ref}
          style={{
            maxWidth: '64rem',
            margin: '0 auto',
            position: 'relative',
            zIndex: 2,
            textAlign: 'center',
          }}
        >
          <motion.span
            className="section-badge"
            custom={0}
            variants={fadeUp}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
          >
            How It Works
          </motion.span>

          <motion.h2
            custom={1}
            variants={fadeUp}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            style={{
              fontFamily: "'Instrument Serif', serif",
              fontStyle: 'italic',
              fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
              letterSpacing: '-0.04em',
              lineHeight: 0.92,
              color: 'white',
              margin: '0 0 1.5rem',
            }}
          >
            Your passport to the extraordinary.
          </motion.h2>

          <motion.p
            custom={2}
            variants={fadeUp}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            style={{
              fontFamily: "'Barlow', sans-serif",
              fontWeight: 300,
              fontSize: '1.05rem',
              color: 'rgba(255,255,255,0.65)',
              maxWidth: '36rem',
              margin: '0 auto 4rem',
              lineHeight: 1.6,
            }}
          >
           </motion.p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1.5rem',
              maxWidth: '52rem',
              margin: '0 auto',
            }}
          >
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                custom={i + 3}
                variants={fadeUp}
                initial="hidden"
                animate={inView ? 'visible' : 'hidden'}
                style={{
                  borderRadius: '1.5rem',
                  padding: '1.75rem',
                  background:
                    'linear-gradient(145deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
                  backdropFilter: 'blur(40px)',
                  border: '1px solid rgba(255,255,255,0.09)',
                  boxShadow:
                    '0 1px 0 rgba(255,255,255,0.08) inset, 0 20px 60px rgba(0,0,0,0.5)',
                  textAlign: 'left',
                }}
              >
                <div
                  style={{
                    fontSize: '0.75rem',
                    fontFamily: "'Barlow', sans-serif",
                    fontWeight: 300,
                    color: 'rgba(255,255,255,0.25)',
                    marginBottom: '0.75rem',
                    letterSpacing: '0.08em',
                  }}
                >
                  {step.number}
                </div>
                <div
                  style={{
                    fontFamily: "'Barlow', sans-serif",
                    fontWeight: 500,
                    fontSize: '0.95rem',
                    color: 'white',
                    marginBottom: '0.5rem',
                  }}
                >
                  {step.title}
                </div>
                <div
                  style={{
                    fontFamily: "'Barlow', sans-serif",
                    fontWeight: 300,
                    fontSize: '0.85rem',
                    color: 'rgba(255,255,255,0.45)',
                    lineHeight: 1.5,
                  }}
                >
                  {step.description}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
