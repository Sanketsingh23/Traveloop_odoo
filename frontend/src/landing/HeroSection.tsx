import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

import SwayCanvas from './SwayCanvas';
import AtmosphereCanvas from './AtmosphereCanvas';
import ParticleCanvas from './ParticleCanvas';
import ParticleTitle from './ParticleTitle';

export default function HeroSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });
  const contentY = useTransform(scrollYProgress, [0, 0.6], [0, 45]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <section
      ref={sectionRef}
      id="hero"
      style={{
        height: '100vh',
        minHeight: '600px',
        background: 'black',
        overflow: 'hidden',
        position: 'relative',
        scrollMarginTop: '5rem',
      }}
    >
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden' }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.8, delay: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{ position: 'absolute', inset: 0 }}
        >
          <SwayCanvas />
        </motion.div>

        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '200px',
            background: 'linear-gradient(to bottom, black 0%, rgba(0,0,0,0.20) 28%, transparent 52%)',
            zIndex: 1,
          }}
        />

        <motion.div
          animate={{ x: [0, 38, -18, 30, 0], y: [0, -22, 14, -10, 0], opacity: [0.75, 1, 0.8, 1, 0.75] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            top: '-8%',
            right: '4%',
            width: '560px',
            height: '560px',
            background: 'radial-gradient(ellipse, rgba(255,215,90,0.42) 0%, rgba(255,150,30,0.14) 50%, transparent 75%)',
            filter: 'blur(60px)',
            mixBlendMode: 'screen',
            zIndex: 1,
          }}
        />

        <motion.div
          animate={{ x: [0, 70, -40, 50, 0], y: [0, 18, -12, 8, 0], opacity: [0.55, 0.9, 0.6, 0.88, 0.55] }}
          transition={{ duration: 14, delay: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            top: '-6%',
            left: '10%',
            width: '750px',
            height: '280px',
            background: 'radial-gradient(ellipse, rgba(120,200,255,0.22) 0%, transparent 70%)',
            filter: 'blur(55px)',
            mixBlendMode: 'screen',
            zIndex: 1,
          }}
        />

        <motion.div
          animate={{ x: [-20, 30, -10, 40, -20], y: [0, -28, 10, -18, 0], opacity: [0.5, 0.88, 0.55, 0.9, 0.5] }}
          transition={{ duration: 12, delay: 0.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            bottom: '-12%',
            left: '15%',
            width: '680px',
            height: '420px',
            background: 'radial-gradient(ellipse, rgba(155,215,100,0.22) 0%, rgba(200,235,80,0.06) 50%, transparent 75%)',
            filter: 'blur(65px)',
            mixBlendMode: 'screen',
            zIndex: 1,
          }}
        />

        <motion.div
          animate={{ x: [0, 22, -14, 18, 0], y: [0, -35, 20, -25, 0], opacity: [0.4, 0.72, 0.45, 0.68, 0.4] }}
          transition={{ duration: 16, delay: 3, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            top: '20%',
            left: '-6%',
            width: '380px',
            height: '560px',
            background: 'radial-gradient(ellipse, rgba(255,195,100,0.18) 0%, transparent 70%)',
            filter: 'blur(55px)',
            mixBlendMode: 'screen',
            zIndex: 1,
          }}
        />

        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse 82% 82% at 50% 50%, transparent 55%, rgba(0,0,0,0.55) 100%)',
            zIndex: 1,
          }}
        />

        <AtmosphereCanvas />
        <ParticleCanvas />
      </div>

      <motion.div
        style={{
          position: 'relative',
          zIndex: 10,
          paddingTop: '110px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          y: contentY,
          opacity: contentOpacity,
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="liquid-glass"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            borderRadius: '9999px',
            padding: '0.5rem 1rem',
            marginBottom: '2rem',
          }}
        >
          <span
            style={{
              background: 'white',
              color: 'black',
              fontSize: '0.75rem',
              fontWeight: 600,
              borderRadius: '9999px',
              padding: '0.125rem 0.5rem',
            }}
          >
            New
          </span>
          <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.82rem' }}>
            Introducing New places to Explore.
          </span>
        </motion.div>

        <div style={{ maxWidth: '960px', width: '100%', padding: '0 1.5rem' }}>
          <ParticleTitle />
        </div>

        <motion.p
          initial={{ opacity: 0, filter: 'blur(8px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          transition={{ duration: 0.9, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
          style={{
            fontFamily: "'Barlow', sans-serif",
            fontWeight: 300,
            fontSize: '1rem',
            color: 'rgba(255,255,255,0.65)',
            maxWidth: '520px',
            lineHeight: 1.6,
            margin: '1.5rem auto 0',
            padding: '0 1.5rem',
          }}
        >
          
          <br />
          
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.1, ease: [0.16, 1, 0.3, 1] }}
          style={{
            display: 'flex',
            gap: '0.75rem',
            marginTop: '2.5rem',
            alignItems: 'center',
          }}
        >
          
          
        </motion.div>
      </motion.div>

      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '360px',
          background: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.45) 40%, rgba(0,0,0,0.85) 75%, black 100%)',
          zIndex: 5,
          pointerEvents: 'none',
        }}
      />
    </section>
  );
}
