
// Emotion Analysis Module
// Combines face, audio, and text emotion analysis capabilities

// Cache for storing analysis results
const emotionAnalysisCache = new Map();

// Initialize the emotion analysis module
function initEmotionAnalysis() {
    try {
        // Check if API_KEY is available from the parent scope
        if (typeof API_KEY === 'undefined' && window.API_KEY) {
            window.emotionAnalysisAPI_KEY = window.API_KEY;
        } else if (typeof API_KEY !== 'undefined') {
            window.emotionAnalysisAPI_KEY = API_KEY;
        } else if (typeof localStorage !== 'undefined' && localStorage.getItem('openai_api_key')) {
            window.emotionAnalysisAPI_KEY = localStorage.getItem('openai_api_key');
        } else {
            console.warn('API_KEY not found. Emotion analysis may not work properly.');
        }

        console.log('Emotion analysis module initialized');
    } catch (error) {
        console.error('Error initializing emotion analysis:', error);
    }
}

// Analyze emotion from text
async function analyzeTextEmotion(text) {
    try {
        // Generate cache key
        const cacheKey = `text-${text.substring(0, 50)}-${Date.now()}`;

        // Check cache first
        if (emotionAnalysisCache.has(cacheKey)) {
            return emotionAnalysisCache.get(cacheKey);
        }

        // Call API for text emotion analysis
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${window.emotionAnalysisAPI_KEY || localStorage.getItem('openai_api_key')}`
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: [
                    {
                        role: "system",
                        content: "You are a text emotion analysis API. Analyze the emotion in the provided text and return a JSON object with the following structure: {emotion: 'happy/sad/angry/surprised/fearful/disgusted/neutral', confidence: 0.0-1.0, scores: {happy: 0.0-1.0, sad: 0.0-1.0, angry: 0.0-1.0, surprised: 0.0-1.0, fearful: 0.0-1.0, disgusted: 0.0-1.0, neutral: 0.0-1.0}, explanation: 'brief explanation of why you classified it this way'}"
                    },
                    {
                        role: "user",
                        content: text
                    }
                ]
            })
        });

        const data = await response.json();

        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error(data.error?.message || 'فشل في تحليل مشاعر النص');
        }

        // Parse emotion response
        let emotionResponse;
        try {
            emotionResponse = JSON.parse(data.choices[0].message.content);
        } catch (parseError) {
            console.error('Error parsing emotion response:', data.choices[0].message.content);
            throw new Error('فشل في تحليل استجابة مشاعر النص: ' + parseError.message);
        }

        // Create analysis result
        const result = {
            emotion: emotionResponse.emotion || 'neutral',
            confidence: emotionResponse.confidence || 0.7,
            scores: emotionResponse.scores || {},
            explanation: emotionResponse.explanation || '',
            timestamp: Date.now()
        };

        // Cache the result
        emotionAnalysisCache.set(cacheKey, result);

        return result;
    } catch (error) {
        console.error('Error analyzing text emotion:', error);
        throw error;
    }
}

// Analyze emotion from face
async function analyzeFaceEmotion(imageElement) {
    try {
        // Load required libraries dynamically with reliable models
        if (!window.faceEmotionAnalysis) {
            await loadScripts([
                'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@3.18.0',
                'https://cdn.jsdelivr.net/npm/@tensorflow-models/face-landmarks-detection@1.0.2',
                'https://cdn.jsdelivr.net/npm/@tensorflow-models/blazeface@0.0.7'
            ]);

            // Create face emotion analysis functions if not already available
            if (!window.faceEmotionAnalysis) {
                window.faceEmotionAnalysis = createFaceEmotionAnalysis();
            }
        }

        // Generate cache key
        const cacheKey = `face-${imageElement.src}-${Date.now()}`;

        // Check cache first
        if (emotionAnalysisCache.has(cacheKey)) {
            return emotionAnalysisCache.get(cacheKey);
        }

        // Analyze face emotion
        const result = await window.faceEmotionAnalysis.analyze(imageElement);

        // Cache the result
        emotionAnalysisCache.set(cacheKey, result);

        return result;
    } catch (error) {
        console.error('Error analyzing face emotion:', error);
        throw error;
    }
}

// Create face emotion analysis functions
function createFaceEmotionAnalysis() {
    // Face analyzer for real-time processing
    let faceModel = null;
    let blazeFaceModel = null;

    // Initialize face analyzer
    async function initFaceAnalyzer() {
        try {
            // Initialize BlazeFace face detection model
            if (window.blazeface) {
                console.log('Loading BlazeFace model...');
                blazeFaceModel = await window.blazeface.load();
                console.log('BlazeFace model loaded successfully');
            }

            // Initialize face landmarks detection model
            if (window.faceLandmarksDetection) {
                console.log('Loading face landmarks model...');
                const modelType = window.faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
                const faceModelConfig = {
                    runtime: 'mediapipe',
                    solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh',
                    maxFaces: 1
                };

                faceModel = await window.faceLandmarksDetection.createDetector(
                    modelType,
                    faceModelConfig
                );
                console.log('Face landmarks model loaded successfully');
            }
        } catch (error) {
            console.error('Error initializing face analyzer:', error);
        }
    }

    // Detect faces and analyze emotions
    async function analyze(imageElement) {
        try {
            // Ensure models are loaded
            if (!blazeFaceModel) {
                await initFaceAnalyzer();
                if (!blazeFaceModel) {
                    throw new Error('Face detection models failed to load');
                }
            }

            // Detect faces
            const faces = await blazeFaceModel.estimateFaces(imageElement);

            if (faces.length === 0) {
                throw new Error('No faces detected in the image');
            }

            // Use the first detected face
            const face = faces[0];

            // Extract face region
            const faceBox = {
                top: face.topLeft[1],
                left: face.topLeft[0],
                width: face.bottomRight[0] - face.topLeft[0],
                height: face.bottomRight[1] - face.topLeft[1]
            };

            // If landmarks model is available, extract detailed features
            let landmarksFeatures = null;
            if (faceModel) {
                try {
                    const landmarks = await faceModel.estimateFaces(imageElement);
                    if (landmarks.length > 0) {
                        landmarksFeatures = extractLandmarkFeatures(landmarks[0]);
                    }
                } catch (error) {
                    console.error('Error extracting face landmarks:', error);
                }
            }

            // Analyze facial expression
            const expressionFeatures = analyzeFacialExpression(faceBox, imageElement);

            // Combine features for emotion analysis
            const features = {
                ...expressionFeatures,
                ...(landmarksFeatures || {})
            };

            // For more accurate emotion classification, we'll use the DeepSeek API
            // Prepare detailed feature description for the API
            let featureDescription = `Analyze this face with these characteristics:
`;
            featureDescription += `- Eye openness: ${features.eyeOpenness || 'unknown'}
`;
            featureDescription += `- Eyebrow position: ${features.eyebrowPosition || 'unknown'}
`;
            featureDescription += `- Mouth shape: ${features.mouthShape || 'unknown'}
`;
            featureDescription += `- Mouth openness: ${features.mouthOpenness || 'unknown'}
`;
            featureDescription += `- Face symmetry: ${features.faceSymmetry || 'unknown'}
`;

            // Add landmarks features if available
            if (features.landmarkDistances) {
                featureDescription += `- Face feature distances: ${JSON.stringify(features.landmarkDistances)}
`;
            }

            featureDescription += `The image shows a frontal face for emotion analysis.`;

            // Call DeepSeek API for face emotion analysis
            const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${window.emotionAnalysisAPI_KEY || localStorage.getItem('openai_api_key')}`
                },
                body: JSON.stringify({
                    model: "deepseek-chat",
                    messages: [
                        {
                            role: "system",
                            content: "You are a face emotion analysis API. Based on the detailed facial characteristics I provide, classify the emotion as one of: happy, sad, angry, surprised, fearful, disgusted, or neutral. Return a JSON object with the emotion label and confidence score. Also include a brief explanation of why you classified it this way based on the facial features."
                        },
                        {
                            role: "user",
                            content: featureDescription
                        }
                    ]
                })
            });

            const data = await response.json();

            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                throw new Error(data.error?.message || 'فشل في تحليل المشاعر الوجهية');
            }

            // Parse emotion response
            let emotionResponse;
            try {
                emotionResponse = JSON.parse(data.choices[0].message.content);
            } catch (parseError) {
                console.error('Error parsing emotion response:', data.choices[0].message.content);
                throw new Error('فشل في تحليل استجابة المشاعر الوجهية: ' + parseError.message);
            }

            // Create analysis result
            const result = {
                emotion: emotionResponse.label || 'neutral',
                confidence: emotionResponse.score || 0.7,
                features: features,
                faceBox: faceBox,
                timestamp: Date.now()
            };

            return result;
        } catch (error) {
            console.error('Error analyzing face emotions:', error);
            throw error;
        }
    }

    // Extract facial landmarks features
    function extractLandmarkFeatures(landmarks) {
        const keypoints = landmarks.keypoints;

        // Calculate distances between key facial points
        const distances = {
            // Eye to eye distance
            leftEyeToLeftEyebrow: calculateDistance(
                keypoints[33], // Left eye corner
                keypoints[46]  // Left eyebrow
            ),
            rightEyeToRightEyebrow: calculateDistance(
                keypoints[263], // Right eye corner
                keypoints[276]  // Right eyebrow
            ),
            // Eye to nose distance
            leftEyeToNose: calculateDistance(
                keypoints[33], // Left eye corner
                keypoints[1]   // Nose tip
            ),
            rightEyeToNose: calculateDistance(
                keypoints[263], // Right eye corner
                keypoints[1]    // Nose tip
            ),
            // Mouth to nose distance
            mouthToNose: calculateDistance(
                keypoints[13],  // Upper lip center
                keypoints[1]    // Nose tip
            ),
            // Mouth corners to eye distance
            leftMouthCornerToLeftEye: calculateDistance(
                keypoints[61],  // Left mouth corner
                keypoints[33]   // Left eye corner
            ),
            rightMouthCornerToRightEye: calculateDistance(
                keypoints[291], // Right mouth corner
                keypoints[263]  // Right eye corner
            ),
            // Eyebrow to eyebrow distance
            leftEyebrowToRightEyebrow: calculateDistance(
                keypoints[46],  // Left eyebrow
                keypoints[276]  // Right eyebrow
            )
        };

        // Calculate symmetry ratios
        const symmetry = {
            eyeEyebrowSymmetry: distances.leftEyeToLeftEyebrow / distances.rightEyeToRightEyebrow,
            eyeNoseSymmetry: distances.leftEyeToNose / distances.rightEyeToNose,
            mouthEyeSymmetry: distances.leftMouthCornerToLeftEye / distances.rightMouthCornerToRightEye
        };

        return {
            landmarkDistances: distances,
            landmarkSymmetry: symmetry,
            // Add more features as needed
        };
    }

    // Calculate distance between two points
    function calculateDistance(point1, point2) {
        const dx = point1.x - point2.x;
        const dy = point1.y - point2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // Analyze facial expression from detected face
    function analyzeFacialExpression(faceBox, imageElement) {
        // Create a canvas to extract face region
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Set canvas size to face region
        canvas.width = faceBox.width;
        canvas.height = faceBox.height;

        // Draw face region on canvas
        ctx.drawImage(
            imageElement,
            faceBox.left, faceBox.top, faceBox.width, faceBox.height,
            0, 0, faceBox.width, faceBox.height
        );

        // Get image data for analysis
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Analyze basic features
        const features = {
            eyeOpenness: analyzeEyeOpenness(data, canvas.width, canvas.height),
            eyebrowPosition: analyzeEyebrowPosition(data, canvas.width, canvas.height),
            mouthShape: analyzeMouthShape(data, canvas.width, canvas.height),
            mouthOpenness: analyzeMouthOpenness(data, canvas.width, canvas.height),
            faceSymmetry: analyzeFaceSymmetry(data, canvas.width, canvas.height)
        };

        return features;
    }

    // Analyze eye openness
    function analyzeEyeOpenness(data, width, height) {
        // Simplified eye region analysis
        const eyeRegionY = Math.floor(height * 0.3);
        const eyeHeight = Math.floor(height * 0.1);
        const eyeWidth = Math.floor(width * 0.2);

        // Left eye region
        const leftEyeX = Math.floor(width * 0.3);
        let leftEyeDarkness = 0;

        // Right eye region
        const rightEyeX = Math.floor(width * 0.7);
        let rightEyeDarkness = 0;

        // Sample pixels in eye regions
        for (let y = eyeRegionY; y < eyeRegionY + eyeHeight; y++) {
            for (let x = leftEyeX; x < leftEyeX + eyeWidth; x++) {
                const idx = (y * width + x) * 4;
                const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
                leftEyeDarkness += (255 - brightness);
            }

            for (let x = rightEyeX; x < rightEyeX + eyeWidth; x++) {
                const idx = (y * width + x) * 4;
                const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
                rightEyeDarkness += (255 - brightness);
            }
        }

        // Normalize darkness values (higher darkness = more open eyes)
        const leftEyeOpenness = Math.min(1, leftEyeDarkness / (eyeWidth * eyeHeight * 50));
        const rightEyeOpenness = Math.min(1, rightEyeDarkness / (eyeWidth * eyeHeight * 50));

        // Return average eye openness
        return (leftEyeOpenness + rightEyeOpenness) / 2;
    }

    // Analyze eyebrow position
    function analyzeEyebrowPosition(data, width, height) {
        // Simplified eyebrow region analysis
        const eyebrowRegionY = Math.floor(height * 0.2);
        const eyebrowHeight = Math.floor(height * 0.1);
        const eyebrowWidth = Math.floor(width * 0.2);

        // Left eyebrow region
        const leftEyebrowX = Math.floor(width * 0.3);
        let leftEyebrowDarkness = 0;

        // Right eyebrow region
        const rightEyebrowX = Math.floor(width * 0.7);
        let rightEyebrowDarkness = 0;

        // Sample pixels in eyebrow regions
        for (let y = eyebrowRegionY; y < eyebrowRegionY + eyebrowHeight; y++) {
            for (let x = leftEyebrowX; x < leftEyebrowX + eyebrowWidth; x++) {
                const idx = (y * width + x) * 4;
                const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
                leftEyebrowDarkness += (255 - brightness);
            }

            for (let x = rightEyebrowX; x < rightEyebrowX + eyebrowWidth; x++) {
                const idx = (y * width + x) * 4;
                const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
                rightEyebrowDarkness += (255 - brightness);
            }
        }

        // Normalize darkness values (higher darkness = more prominent eyebrows)
        const leftEyebrowProminence = Math.min(1, leftEyebrowDarkness / (eyebrowWidth * eyebrowHeight * 50));
        const rightEyebrowProminence = Math.min(1, rightEyebrowDarkness / (eyebrowWidth * eyebrowHeight * 50));

        // Determine eyebrow position based on prominence
        // Higher prominence typically indicates raised eyebrows (surprise)
        let position = 'normal';
        if (leftEyebrowProminence > 0.7 && rightEyebrowProminence > 0.7) {
            position = 'raised';
        } else if (leftEyebrowProminence < 0.3 && rightEyebrowProminence < 0.3) {
            position = 'lowered';
        }

        return position;
    }

    // Analyze mouth shape
    function analyzeMouthShape(data, width, height) {
        // Simplified mouth region analysis
        const mouthRegionY = Math.floor(height * 0.7);
        const mouthHeight = Math.floor(height * 0.15);
        const mouthWidth = Math.floor(width * 0.4);
        const mouthX = Math.floor(width * 0.3);

        // Sample pixels in mouth region
        let mouthDarkness = 0;
        let mouthTopDarkness = 0;
        let mouthBottomDarkness = 0;

        for (let y = mouthRegionY; y < mouthRegionY + mouthHeight; y++) {
            for (let x = mouthX; x < mouthX + mouthWidth; x++) {
                const idx = (y * width + x) * 4;
                const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
                mouthDarkness += (255 - brightness);

                // Check if pixel is in top or bottom half of mouth
                if (y < mouthRegionY + mouthHeight / 2) {
                    mouthTopDarkness += (255 - brightness);
                } else {
                    mouthBottomDarkness += (255 - brightness);
                }
            }
        }

        // Normalize darkness values
        const mouthDarknessNormalized = Math.min(1, mouthDarkness / (mouthWidth * mouthHeight * 50));
        const mouthTopDarknessNormalized = Math.min(1, mouthTopDarkness / (mouthWidth * mouthHeight / 2 * 50));
        const mouthBottomDarknessNormalized = Math.min(1, mouthBottomDarkness / (mouthWidth * mouthHeight / 2 * 50));

        // Determine mouth shape based on darkness distribution
        let shape = 'neutral';

        // Smile detection (higher darkness in mouth corners)
        if (mouthTopDarknessNormalized > 0.6 && mouthDarknessNormalized > 0.5) {
            shape = 'smile';
        }
        // Frown detection (higher darkness in mouth center)
        else if (mouthBottomDarknessNormalized > mouthTopDarknessNormalized + 0.2) {
            shape = 'frown';
        }
        // Open mouth detection (high overall darkness)
        else if (mouthDarknessNormalized > 0.7) {
            shape = 'open';
        }

        return shape;
    }

    // Analyze mouth openness
    function analyzeMouthOpenness(data, width, height) {
        // Simplified mouth openness analysis
        const mouthRegionY = Math.floor(height * 0.7);
        const mouthHeight = Math.floor(height * 0.15);
        const mouthWidth = Math.floor(width * 0.4);
        const mouthX = Math.floor(width * 0.3);

        // Sample pixels in mouth region
        let mouthDarkness = 0;

        for (let y = mouthRegionY; y < mouthRegionY + mouthHeight; y++) {
            for (let x = mouthX; x < mouthX + mouthWidth; x++) {
                const idx = (y * width + x) * 4;
                const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
                mouthDarkness += (255 - brightness);
            }
        }

        // Normalize darkness values
        const mouthDarknessNormalized = Math.min(1, mouthDarkness / (mouthWidth * mouthHeight * 50));

        // Determine mouth openness
        let openness = 'closed';
        if (mouthDarknessNormalized > 0.6) {
            openness = 'open';
        }

        return openness;
    }

    // Analyze face symmetry
    function analyzeFaceSymmetry(data, width, height) {
        // Simplified face symmetry analysis
        const centerX = Math.floor(width / 2);
        let symmetryScore = 1;

        // Compare pixel values on left and right sides
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < centerX; x++) {
                const leftIdx = (y * width + x) * 4;
                const rightIdx = (y * width + (width - x - 1)) * 4;

                // Calculate brightness difference
                const leftBrightness = (data[leftIdx] + data[leftIdx + 1] + data[leftIdx + 2]) / 3;
                const rightBrightness = (data[rightIdx] + data[rightIdx + 1] + data[rightIdx + 2]) / 3;

                const brightnessDiff = Math.abs(leftBrightness - rightBrightness);

                // Accumulate symmetry score (lower difference = higher symmetry)
                if (brightnessDiff > 30) {
                    symmetryScore -= 0.01;
                }
            }
        }

        // Ensure symmetry score is within valid range
        return Math.max(0, Math.min(1, symmetryScore));
    }

    // Return the face emotion analysis API
    return {
        analyze: analyze
    };
}

// Load scripts dynamically
async function loadScripts(urls) {
    const loadPromises = urls.map(url => {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = url;
            script.async = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
            document.head.appendChild(script);
        });
    });

    return Promise.all(loadPromises);
}

// Export functions
window.emotionAnalysis = {
    init: initEmotionAnalysis,
    analyzeText: analyzeTextEmotion,
    analyzeFace: analyzeFaceEmotion
};

// Initialize when the script loads
initEmotionAnalysis();

// Log initialization
console.log('Emotion Analysis module initialized');
