import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Eye, Sparkles, Zap, Package } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] },
  }),
};

const cards = [
  {
    icon: Eye,
    number: '01',
    title: 'Curated Hidden Gems',
    description:
      'Go beyond the postcards. We scout exclusive, off-the-path locations that offer authentic soul instead of tourist crowds.',
    gradient: 'linear-gradient(135deg, rgba(255, 160, 0, 0.3), rgba(255, 80, 0, 0.15))',
  },
  {
    icon: Sparkles,
    number: '02',
    title: 'Bespoke Itineraries',
    description:
      'Travel designed around your rhythm. Every stop, stay, and transport link is tailored to your unique sense of adventure.',
    gradient: 'linear-gradient(135deg, rgba(0, 210, 255, 0.3), rgba(58, 123, 213, 0.15))',
  },
  {
    icon: Zap,
    number: '03',
    title: 'Seamless Logistics',
    description:
      'From private transfers to priority access, we handle the friction so you can focus entirely on the horizon.',
    gradient: 'linear-gradient(135deg, rgba(46, 213, 115, 0.3), rgba(83, 198, 83, 0.15))',
  },
  {
    icon: Package,
    number: '04',
    title: 'Sustainable Exploration',
    description:
      'Travel with a conscience. We partner with local eco-initiatives to ensure your journey leaves a positive footprint.',
    gradient: 'linear-gradient(135deg, rgba(162, 89, 255, 0.3), rgba(255, 89, 123, 0.15))',
  },
];

export default function FeaturesSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section
      id="features"
      style={{
        background: 'black',
        padding: '7rem 1.5rem 9rem',
        position: 'relative',
        overflow: 'hidden',
        scrollMarginTop: '5rem',
      }}
    >
      <img
        src="/features-bg.jpg"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: 0,
          pointerEvents: 'none',
          opacity: 0.6,
        }}
        alt=""
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(to bottom, black 0%, transparent 18%, transparent 82%, black 100%)',
          zIndex: 1,
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.30)',
          zIndex: 1,
          pointerEvents: 'none',
        }}
      />

      <div
        ref={ref}
        style={{
          maxWidth: '56rem',
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
          Capabilities
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
            margin: '0 0 3.5rem',
          }}
        >
          Built with beauty
          <br />
          and performance in balance.
        </motion.h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.25rem',
            maxWidth: '48rem',
            margin: '0 auto',
          }}
        >
          {cards.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.number}
                custom={i + 2}
                variants={fadeUp}
                initial="hidden"
                animate={inView ? 'visible' : 'hidden'}
                whileHover={{ y: -6 }}
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
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'transform 0.3s ease',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '1px',
                    background:
                      'linear-gradient(to right, transparent, rgba(255,255,255,0.15), transparent)',
                  }}
                />

                <div
                  style={{
                    position: 'absolute',
                    top: '1.25rem',
                    right: '1.25rem',
                    fontFamily: "'Barlow', sans-serif",
                    fontWeight: 300,
                    fontSize: '0.8rem',
                    color: 'rgba(255,255,255,0.20)',
                  }}
                >
                  {card.number}
                </div>

                <div
                  style={{
                    width: '2.75rem',
                    height: '2.75rem',
                    borderRadius: '0.75rem',
                    background: card.gradient,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1rem',
                  }}
                >
                  <Icon style={{ width: '1.25rem', height: '1.25rem', color: 'white' }} />
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
                  {card.title}
                </div>

                <div
                  style={{
                    fontFamily: "'Barlow', sans-serif",
                    fontWeight: 300,
                    fontSize: '0.85rem',
                    color: 'rgba(255,255,255,0.45)',
                    lineHeight: 1.55,
                  }}
                >
                  {card.description}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
