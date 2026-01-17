
// This declares the global 'cv' object expected from opencv.js
import type { Student } from '../types.ts';
declare var cv: any;

const CASCADE_FILE = 'haarcascade_frontalface_default.xml';
const CASCADE_URL = `https://raw.githubusercontent.com/opencv/opencv/master/data/haarcascades/${CASCADE_FILE}`;

let isCascadeLoaded = false;
let faceCascade: any;
let orb: any;

// Utility to load the cascade file into the OpenCV's virtual file system
async function loadCvModels() {
  if (isCascadeLoaded) return;
  
  try {
    const response = await fetch(CASCADE_URL);
    const buffer = await response.arrayBuffer();
    const data = new Uint8Array(buffer);
    cv.FS_createDataFile('/', CASCADE_FILE, data, true, false, false);
    faceCascade = new cv.CascadeClassifier();
    faceCascade.load(CASCADE_FILE);
    orb = new cv.ORB();
    isCascadeLoaded = true;
  } catch (error) {
    console.error("Failed to load OpenCV models:", error);
    throw new Error("Could not load computer vision models.");
  }
}

// Utility to convert a dataURL to an HTMLImageElement
function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = dataUrl;
  });
}

// Detects the largest face and returns its bounding box
async function detectLargestFaceRect(imgMat: any): Promise<any | null> {
    await loadCvModels();
    const gray = new cv.Mat();
    cv.cvtColor(imgMat, gray, cv.COLOR_RGBA2GRAY, 0);
    const faces = new cv.RectVector();
    const mSize = new cv.Size(0, 0);
    faceCascade.detectMultiScale(gray, faces, 1.1, 3, 0, mSize, mSize);

    let largestRect = null;
    if (faces.size() > 0) {
        largestRect = faces.get(0);
        for (let i = 1; i < faces.size(); i++) {
            if (faces.get(i).width > largestRect.width) {
                largestRect = faces.get(i);
            }
        }
    }
    gray.delete();
    faces.delete();
    return largestRect;
}

// Main image processing function for registration
export async function processImageForRegistration(imageData: string): Promise<string | null> {
    const img = await loadImage(imageData);
    const src = cv.imread(img);
    const largestRect = await detectLargestFaceRect(src);
    let result = null;

    if (largestRect) {
        const gray = new cv.Mat();
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
        const faceMat = gray.roi(largestRect);
        const canvas = document.createElement('canvas');
        cv.imshow(canvas, faceMat);
        result = canvas.toDataURL('image/jpeg');
        gray.delete();
        faceMat.delete();
    }
    
    src.delete();
    return result;
}

// Compares two images using ORB feature matching
function compareImages(img1Mat: any, img2Mat: any): number {
    const kp1 = new cv.KeyPointVector();
    const kp2 = new cv.KeyPointVector();
    const des1 = new cv.Mat();
    const des2 = new cv.Mat();
    const mask = new cv.Mat();

    orb.detectAndCompute(img1Mat, mask, kp1, des1);
    orb.detectAndCompute(img2Mat, mask, kp2, des2);

    let score = 0;

    if (kp1.size() > 5 && kp2.size() > 5 && !des1.empty() && !des2.empty()) {
        const bf = new cv.BFMatcher(cv.NORM_HAMMING, true);
        const matches = new cv.DMatchVector();
        bf.match(des1, des2, matches);

        const distanceThreshold = 55;
        let good_matches = 0;
        for (let i = 0; i < matches.size(); ++i) {
            if (matches.get(i).distance < distanceThreshold) {
                good_matches++;
            }
        }

        const minKeypoints = Math.min(kp1.size(), kp2.size());
        if (minKeypoints > 0) {
            score = (good_matches / minKeypoints) * 100;
        }
        bf.delete();
        matches.delete();
    }
    
    kp1.delete(); kp2.delete(); des1.delete(); des2.delete(); mask.delete();
    return score;
}

// Authenticates a face against a single student's registered samples
export async function authenticateFace(newImageData: string, student: Student): Promise<{ success: boolean, score: number | null }> {
    const SIMILARITY_THRESHOLD = 15;
    const processedFaceDataUrl = await processImageForRegistration(newImageData);
    if (!processedFaceDataUrl) return { success: false, score: null };

    const newFaceImg = await loadImage(processedFaceDataUrl);
    const newFaceMat = cv.imread(newFaceImg, cv.IMREAD_GRAYSCALE);

    let maxScore = 0;

    for (const sampleDataUrl of student.faceSamples) {
        const sampleImg = await loadImage(sampleDataUrl);
        const sampleMat = cv.imread(sampleImg, cv.IMREAD_GRAYSCALE);
        const score = compareImages(newFaceMat, sampleMat);
        if (score > maxScore) {
            maxScore = score;
        }
        sampleMat.delete();
    }
    
    newFaceMat.delete();
    
    return { success: maxScore >= SIMILARITY_THRESHOLD, score: maxScore };
}


// Liveness check for head tilt
export async function livenessCheck(imageData: string, challenge: 'TILT_LEFT' | 'TILT_RIGHT'): Promise<boolean> {
    const img = await loadImage(imageData);
    const src = cv.imread(img);
    const rect = await detectLargestFaceRect(src);
    src.delete();
    if (!rect) return false;

    // Check if the center of the face is in the correct half of the image
    const imageCenter = img.width / 2;
    const faceCenter = rect.x + rect.width / 2;

    if (challenge === 'TILT_LEFT') {
        return faceCenter < imageCenter * 0.9; // Head is in the left 45% of the frame
    } else { // TILT_RIGHT
        return faceCenter > imageCenter * 1.1; // Head is in the right 45% of the frame
    }
}

// Compare ID cards
export async function compareIdCards(newIdImageData: string, registeredIdImageData: string): Promise<boolean> {
    const ID_SIMILARITY_THRESHOLD = 20; // Needs to be tuned for ID cards
    const newIdImg = await loadImage(newIdImageData);
    const newIdMat = cv.imread(newIdImg, cv.IMREAD_GRAYSCALE);
    
    const registeredIdImg = await loadImage(registeredIdImageData);
    const registeredIdMat = cv.imread(registeredIdImg, cv.IMREAD_GRAYSCALE);

    const score = compareImages(newIdMat, registeredIdMat);

    newIdMat.delete();
    registeredIdMat.delete();

    return score >= ID_SIMILARITY_THRESHOLD;
}