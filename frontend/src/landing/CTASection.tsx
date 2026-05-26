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

export default function CTASection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section
      id="contact"
      style={{
        background: 'black',
        padding: '7rem 1.5rem 10rem',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        scrollMarginTop: '5rem',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '600px',
          height: '400px',
          background:
            'radial-gradient(ellipse, rgba(120,80,255,0.12) 0%, transparent 70%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
        }}
      />

      <div
        ref={ref}
        style={{ maxWidth: '48rem', margin: '0 auto', position: 'relative', zIndex: 1 }}
      >
        <motion.span
          className="section-badge"
          custom={0}
          variants={fadeUp}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
        >
          
        </motion.span>

        <motion.h2
          custom={1}
          variants={fadeUp}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontStyle: 'italic',
            fontSize: 'clamp(2.75rem, 7vw, 4.75rem)',
            letterSpacing: '-0.04em',
            lineHeight: 0.92,
            color: 'white',
            margin: '0 0 1.5rem',
          }}
        >
          Your next Journey 
          <br />
          starts here.
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
            color: 'rgba(255,255,255,0.60)',
            margin: '0 0 2.5rem',
            lineHeight: 1.6,
          }}
        >
          
        </motion.p>

        <motion.div
          custom={3}
          variants={fadeUp}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          style={{
            display: 'flex',
            gap: '0.75rem',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          

          
        </motion.div>
      </div>
    </section>
  );
}
