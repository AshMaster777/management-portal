import { useState, useCallback, useEffect } from 'react';
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import './ImageCropModal.css';

const ASPECT = 16 / 10; // Matches product card frame

function centerAspectCrop(mediaWidth: number, mediaHeight: number) {
  return centerCrop(
    makeAspectCrop({ unit: '%', width: 90 }, ASPECT, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight
  );
}

export function ImageCropModal({
  file,
  onComplete,
  onCancel,
}: {
  file: File;
  onComplete: (file: File) => void;
  onCancel: () => void;
}) {
  const [src] = useState(() => URL.createObjectURL(file));
  useEffect(() => {
    return () => {
      // Delay revoke to avoid ERR_FILE_NOT_FOUND when React Strict Mode
      // unmounts/remounts; the img may still reference the blob during remount.
      const url = src;
      setTimeout(() => URL.revokeObjectURL(url), 100);
    };
  }, [src]);
  const [crop, setCrop] = useState<Crop>();
  const [imgRef, setImgRef] = useState<HTMLImageElement | null>(null);
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const { width, height } = img;
    const percentCrop = centerAspectCrop(width, height);
    setCrop(percentCrop);
    // Convert percent to pixel so Apply works without user interaction
    setCompletedCrop({
      unit: 'px',
      x: (percentCrop.x / 100) * width,
      y: (percentCrop.y / 100) * height,
      width: (percentCrop.width / 100) * width,
      height: (percentCrop.height / 100) * height,
    });
  }, []);

  async function handleApply() {
    if (!imgRef || !completedCrop) return;
    const blob = await getCroppedBlob(imgRef, completedCrop);
    if (!blob) return;
    const outName = file.name.replace(/\.[^.]+$/, '.jpg');
    const outFile = new File([blob], outName, { type: 'image/jpeg' });
    onComplete(outFile);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-bg-card rounded-xl border border-border-primary max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="p-4 border-b border-border-primary flex justify-between items-center">
          <h3 className="font-semibold text-text-primary">Crop image to fit (16:10)</h3>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-lg border border-border-primary text-text-secondary hover:text-text-primary"
            >
              Skip
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={!completedCrop}
              className="px-4 py-2 rounded-lg bg-accent text-bg-primary font-medium hover:bg-accent-hover disabled:opacity-50"
            >
              Apply crop
            </button>
          </div>
        </div>
        <div className="p-4 overflow-auto max-h-[70vh] image-crop-modal__area">
          <ReactCrop
            crop={crop}
            onChange={(pixelCrop, percentCrop) => {
              setCrop(percentCrop);
              setCompletedCrop(pixelCrop);
            }}
            onComplete={(pixelCrop) => setCompletedCrop(pixelCrop)}
            aspect={ASPECT}
            className="max-w-full"
          >
            <img
              ref={setImgRef}
              src={src}
              alt="Crop"
              onLoad={onImageLoad}
              className="max-w-full h-auto block"
              style={{ maxHeight: '60vh', display: 'block' }}
            />
          </ReactCrop>
        </div>
      </div>
    </div>
  );
}

async function getCroppedBlob(image: HTMLImageElement, crop: PixelCrop): Promise<Blob | null> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // crop is in displayed pixel coords; scale to natural image coords
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  const srcX = crop.x * scaleX;
  const srcY = crop.y * scaleY;
  const srcW = crop.width * scaleX;
  const srcH = crop.height * scaleY;

  canvas.width = Math.floor(srcW);
  canvas.height = Math.floor(srcH);

  ctx.drawImage(image, srcX, srcY, srcW, srcH, 0, 0, canvas.width, canvas.height);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.92);
  });
}
