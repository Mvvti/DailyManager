import { useEffect, useRef } from "react";

type WeatherParticlesProps = {
  weatherCode: number;
  width?: number;
  height?: number;
};

type RainDrop = {
  x: number;
  y: number;
  speed: number;
  length: number;
};

type SnowFlake = {
  x: number;
  y: number;
  speed: number;
  radius: number;
  drift: number;
  phase: number;
};

type CloudBlob = {
  x: number;
  y: number;
  w: number;
  h: number;
  speed: number;
};

type FogBand = {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  alpha: number;
};

const isCloudy = (code: number): boolean => [1, 2, 3].includes(code);
const isFog = (code: number): boolean => [45, 48].includes(code);
const isRain = (code: number): boolean => [51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code);
const isSnow = (code: number): boolean => [71, 73, 75, 77, 85, 86].includes(code);
const isStorm = (code: number): boolean => [95, 96, 99].includes(code);

const supportsParticles = (code: number): boolean => {
  return code === 0 || isCloudy(code) || isFog(code) || isRain(code) || isSnow(code) || isStorm(code);
};

function WeatherParticles({ weatherCode, width, height }: WeatherParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!supportsParticles(weatherCode)) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    let rafId = 0;
    let flashStart = 0;
    let flashDuration = 0;
    let nextFlashAt = 0;

    const rainDrops: RainDrop[] = [];
    const snowFlakes: SnowFlake[] = [];
    const cloudBlobs: CloudBlob[] = [];
    const fogBands: FogBand[] = [];

    const resizeCanvas = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      const targetWidth = Math.max(1, Math.floor(width ?? rect?.width ?? canvas.clientWidth ?? 1));
      const targetHeight = Math.max(1, Math.floor(height ?? rect?.height ?? canvas.clientHeight ?? 1));
      const dpr = window.devicePixelRatio || 1;

      canvas.width = Math.floor(targetWidth * dpr);
      canvas.height = Math.floor(targetHeight * dpr);
      canvas.style.width = `${targetWidth}px`;
      canvas.style.height = `${targetHeight}px`;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    const randomBetween = (min: number, max: number): number => min + Math.random() * (max - min);

    const initRain = () => {
      rainDrops.length = 0;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      for (let i = 0; i < 20; i += 1) {
        rainDrops.push({
          x: Math.random() * w,
          y: Math.random() * h,
          speed: randomBetween(120, 220),
          length: randomBetween(8, 14)
        });
      }
    };

    const initSnow = () => {
      snowFlakes.length = 0;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      for (let i = 0; i < 15; i += 1) {
        snowFlakes.push({
          x: Math.random() * w,
          y: Math.random() * h,
          speed: randomBetween(20, 45),
          radius: randomBetween(1, 3),
          drift: randomBetween(8, 18),
          phase: randomBetween(0, Math.PI * 2)
        });
      }
    };

    const initClouds = () => {
      cloudBlobs.length = 0;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const count = 3 + Math.floor(Math.random() * 2);
      for (let i = 0; i < count; i += 1) {
        cloudBlobs.push({
          x: Math.random() * w,
          y: randomBetween(18, Math.max(22, h * 0.6)),
          w: randomBetween(70, 120),
          h: randomBetween(28, 44),
          speed: randomBetween(6, 14)
        });
      }
    };

    const initFog = () => {
      fogBands.length = 0;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const count = 5 + Math.floor(Math.random() * 2);
      for (let i = 0; i < count; i += 1) {
        fogBands.push({
          x: Math.random() * w,
          y: randomBetween(8, h - 20),
          width: randomBetween(w * 0.35, w * 0.8),
          height: randomBetween(8, 16),
          speed: randomBetween(10, 28),
          alpha: randomBetween(0.18, 0.38)
        });
      }
    };

    const initByWeather = () => {
      resizeCanvas();
      if (isRain(weatherCode) || isStorm(weatherCode)) initRain();
      if (isSnow(weatherCode)) initSnow();
      if (isCloudy(weatherCode)) initClouds();
      if (isFog(weatherCode)) initFog();
      if (isStorm(weatherCode)) {
        const now = performance.now();
        nextFlashAt = now + randomBetween(3000, 6000);
      }
    };

    const drawSun = (t: number) => {
      const w = canvas.clientWidth;
      const centerX = w - 26;
      const centerY = 24;
      const rotation = t * 0.0003;

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(rotation);

      // glow halo
      const glow = ctx.createRadialGradient(0, 0, 4, 0, 0, 22);
      glow.addColorStop(0, "rgba(251,191,36,0.35)");
      glow.addColorStop(1, "rgba(251,191,36,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, 22, 0, Math.PI * 2);
      ctx.fill();

      // core disc
      ctx.fillStyle = "rgba(253,224,71,0.85)";
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fill();

      // rays
      ctx.strokeStyle = "rgba(253,224,71,0.80)";
      ctx.lineWidth = 2.5;
      for (let i = 0; i < 8; i += 1) {
        const angle = (Math.PI * 2 * i) / 8;
        ctx.beginPath();
        ctx.moveTo(Math.cos(angle) * 8, Math.sin(angle) * 8);
        ctx.lineTo(Math.cos(angle) * 20, Math.sin(angle) * 20);
        ctx.stroke();
      }
      ctx.restore();
    };

    const drawClouds = (dt: number) => {
      const w = canvas.clientWidth;
      ctx.fillStyle = "rgba(148,163,184,0.38)";
      ctx.filter = "blur(1px)";
      for (const cloud of cloudBlobs) {
        cloud.x -= cloud.speed * dt;
        if (cloud.x + cloud.w < -20) {
          cloud.x = w + randomBetween(20, 60);
        }

        ctx.beginPath();
        ctx.ellipse(cloud.x, cloud.y, cloud.w * 0.5, cloud.h * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.filter = "none";
    };

    const drawFog = (dt: number) => {
      const w = canvas.clientWidth;
      for (const band of fogBands) {
        band.x += band.speed * dt;
        if (band.x - band.width * 0.5 > w + 24) {
          band.x = -band.width;
        }
        ctx.fillStyle = `rgba(148,163,184,${band.alpha.toFixed(3)})`;
        ctx.fillRect(band.x, band.y, band.width, band.height);
      }
    };

    const drawRain = (dt: number) => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const angle = (70 * Math.PI) / 180;
      const dx = Math.cos(angle);
      const dy = Math.sin(angle);

      ctx.strokeStyle = "rgba(96,165,250,0.4)";
      ctx.lineWidth = 1.2;

      for (const drop of rainDrops) {
        drop.x += dx * drop.speed * dt;
        drop.y += dy * drop.speed * dt;

        if (drop.y > h + 20 || drop.x > w + 20) {
          drop.x = randomBetween(-30, w * 0.9);
          drop.y = -randomBetween(10, 80);
          drop.speed = randomBetween(120, 220);
          drop.length = randomBetween(8, 14);
        }

        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x - dx * drop.length, drop.y - dy * drop.length);
        ctx.stroke();
      }
    };

    const drawSnow = (dt: number, t: number) => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.fillStyle = "rgba(186,230,253,0.6)";

      for (const flake of snowFlakes) {
        flake.y += flake.speed * dt;
        flake.phase += dt * 1.2;
        flake.x += Math.sin(flake.phase + t * 0.0006) * flake.drift * dt;

        if (flake.y > h + 5) {
          flake.y = -5;
          flake.x = randomBetween(0, w);
        }

        if (flake.x < -10) flake.x = w + 5;
        if (flake.x > w + 10) flake.x = -5;

        ctx.beginPath();
        ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const drawStormFlash = (t: number) => {
      if (!isStorm(weatherCode)) return;

      if (flashDuration <= 0 && t >= nextFlashAt) {
        flashStart = t;
        flashDuration = 280;
        nextFlashAt = t + randomBetween(3000, 6000);
      }

      if (flashDuration > 0) {
        const elapsed = t - flashStart;
        const p = Math.min(1, elapsed / flashDuration);
        const alpha = p < 0.4 ? (p / 0.4) * 0.15 : ((1 - p) / 0.6) * 0.15;

        ctx.fillStyle = `rgba(255,255,255,${Math.max(0, alpha).toFixed(3)})`;
        ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);

        if (p >= 1) {
          flashDuration = 0;
        }
      }
    };

    let lastTime = performance.now();
    const render = (t: number) => {
      const dt = Math.min(0.05, (t - lastTime) / 1000);
      lastTime = t;

      ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);

      if (weatherCode === 0) drawSun(t);
      if (isCloudy(weatherCode)) drawClouds(dt);
      if (isFog(weatherCode)) drawFog(dt);
      if (isRain(weatherCode) || isStorm(weatherCode)) drawRain(dt);
      if (isSnow(weatherCode)) drawSnow(dt, t);
      if (isStorm(weatherCode)) drawStormFlash(t);

      rafId = window.requestAnimationFrame(render);
    };

    initByWeather();
    rafId = window.requestAnimationFrame(render);

    const onResize = () => {
      initByWeather();
    };

    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      window.cancelAnimationFrame(rafId);
    };
  }, [weatherCode, width, height]);

  if (!supportsParticles(weatherCode)) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute left-0 top-0 z-0 h-full w-full"
      aria-hidden="true"
    />
  );
}

export default WeatherParticles;
