// File: app/page.tsx (Main Page)
'use client'

import { useState, useRef, useEffect } from 'react'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <ProfileBadgeEditor />
    </main>
  )
}



function ProfileBadgeEditor() {
  const [image, setImage] = useState<string | null>(null)
  const [text, setText] = useState('#HIRING')
  const [color, setColor] = useState('#8b5cf6')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (image && canvasRef.current) {
      const img = new Image()
      img.onload = () => drawBadge(canvasRef.current!, img, text, color)
      img.src = image
    }
  }, [image, text, color])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => setImage(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleDownload = () => {
    if (canvasRef.current) {
      const link = document.createElement('a')
      link.download = 'linkedin-badge.png'
      link.href = canvasRef.current.toDataURL('image/png')
      link.click()
    }
  }
return (
  <div className="bg-white p-8 rounded-2xl shadow-xl w-fit max-w-md space-y-6">
    <input
      type="file"
      accept="image/*"
      onChange={handleImageUpload}
      className="block w-full text-gray-700 cursor-pointer rounded-md border border-gray-300 px-3 py-2
                 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
    />

    <input
      type="text"
      className="w-full border border-gray-300 p-3 rounded-md text-gray-900 placeholder-gray-400
                 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
      value={text}
      onChange={(e) => setText(e.target.value)}
      placeholder="Enter status (e.g. #HIRING)"
    />

    <input
      type="color"
      value={color}
      onChange={(e) => setColor(e.target.value)}
      className="w-full h-10 rounded-md border border-gray-300 cursor-pointer"
      title="Select color"
    />

    <div className="w-fit h-fit border border-gray-300 rounded-full">
      <canvas
        ref={canvasRef}
        width={512}
        height={512}
        className="w-full h-auto rounded-full block "
      />
    </div>

    <button
      onClick={handleDownload}
      className="w-full bg-purple-600 text-white font-semibold py-3 rounded-md
                 hover:bg-purple-700 transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-purple-300"
    >
      Download Image
    </button>
  </div>
);

}


export function drawBadge(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  text: string,
  color: string
) {
  const ctx = canvas.getContext('2d')!;
  const fontSizePx = 32;
  const spacingEm = 0.02;
  const spacingPx = fontSizePx * spacingEm;

  ctx.font = `bold ${fontSizePx}px sans-serif`;
  const textToDraw = text.toUpperCase();
  const textLength = textToDraw.length;

  const size = canvas.width;
  const radius = size / 2;
  const centerX = radius;
  const centerY = radius;

  // Clear canvas
  ctx.clearRect(0, 0, size, size);

  // Draw circular image
  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius - 8, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(image, 0, 0, size, size);
  ctx.restore();

  // Arc properties
  const arcLineWidth = 40;
  const arcRadius = radius - 8 - arcLineWidth / 2;
  const sidePaddingPx = 100;
  const fadePaddingPx = 30; // new: distance between arc text and fade start
  const fadeLength = 0.12; // radians

  // Calculate total arc span with text and paddings
  let totalArcLength = 0;
  for (let i = 0; i < textLength; i++) {
    totalArcLength += ctx.measureText(textToDraw[i]).width;
    if (i < textLength - 1) totalArcLength += spacingPx;
  }

  totalArcLength += 2 * (sidePaddingPx + fadePaddingPx); // extra padding between text and fade
  const arcSpan = totalArcLength / arcRadius;
  const arcCenterAngle = Math.PI / 2;
  const arcStartAngle = arcCenterAngle - arcSpan / 2;
  const arcEndAngle = arcCenterAngle + arcSpan / 2;

  // Final visible arc bounds
  const solidStart = arcStartAngle + fadeLength;
  const solidEnd = arcEndAngle - fadeLength;

  // Draw solid arc (not fading)
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = arcLineWidth;
  ctx.globalAlpha = 1;
  ctx.arc(centerX, centerY, arcRadius, solidStart, solidEnd);
  ctx.stroke();

  // Smooth fade utility
  const drawSmoothFade = (
    fromAngle: number,
    toAngle: number,
    startAlpha: number,
    endAlpha: number
  ) => {
    const steps = 60;
    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1);
      const eased = 0.5 - 0.5 * Math.cos(Math.PI * t); // cosine easing
      const alpha = startAlpha + (endAlpha - startAlpha) * eased;

      const angleStart = fromAngle + t * (toAngle - fromAngle);
      const angleEnd = fromAngle + (t + 1 / steps) * (toAngle - fromAngle);

      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = arcLineWidth;
      ctx.globalAlpha = alpha;
      ctx.arc(centerX, centerY, arcRadius, angleStart, angleEnd);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  };

  // Fades on both sides, starting after fadePadding
  drawSmoothFade(
    arcStartAngle,
    arcStartAngle + fadeLength,
    0,
    1
  );
  drawSmoothFade(
    arcEndAngle - fadeLength,
    arcEndAngle,
    1,
    0
  );

  // === TEXT === (unchanged)
  ctx.font = 'bold 28px sans-serif';
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const anglePerCharWithSpacing = arcSpan / textLength;

  for (let i = 0; i < textLength; i++) {
    const charAngle = arcEndAngle - (i + 0.5) * anglePerCharWithSpacing;
    const x = centerX + arcRadius * Math.cos(charAngle);
    const y = centerY + arcRadius * Math.sin(charAngle);

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(charAngle - Math.PI / 2);
    ctx.fillText(textToDraw[i], 0, 0);
    ctx.restore();
  }
}
