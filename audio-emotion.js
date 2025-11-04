
// تحليل مشاعر الصوت
// يحلل المشاعر من الصوت باستخدام الذكاء الاصطناعي

// Cache for storing analysis results
const audioAnalysisCache = new Map();

// Audio context for processing
let audioContext;

// Initialize the audio emotion analysis module
function initAudioEmotionAnalysis() {
    try {
        // Create audio context when needed (to avoid autoplay policy issues)
        window.AudioContext = window.AudioContext || window.webkitAudioContext;

        // Load required libraries dynamically
        loadScripts([
            'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@3.18.0',
            'https://cdn.jsdelivr.net/npm/@tensorflow-models/speech-commands@0.5.4',
            'https://cdn.jsdelivr.net/npm/meyda@5.5.1/dist/web/meyda.min.js'
        ]).then(() => {
            console.log('Audio emotion analysis libraries loaded successfully');
            // Initialize audio analyzer when libraries are loaded
            initAudioAnalyzer();
        }).catch(error => {
            console.error('Error loading audio emotion analysis libraries:', error);
        });

        // Check if API_KEY is available from the parent scope
        if (typeof API_KEY === 'undefined' && window.API_KEY) {
            window.audioEmotionAPI_KEY = window.API_KEY;
        } else if (typeof API_KEY !== 'undefined') {
            window.audioEmotionAPI_KEY = API_KEY;
        } else if (typeof localStorage !== 'undefined' && localStorage.getItem('openai_api_key')) {
            window.audioEmotionAPI_KEY = localStorage.getItem('openai_api_key');
        } else {
            console.warn('API_KEY not found. Audio emotion analysis may not work properly.');
        }
    } catch (error) {
        console.error('Error initializing audio emotion analysis:', error);
    }
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

// Audio analyzer for real-time processing
let audioAnalyzer = null;
let speechCommandModel = null;

// Initialize audio analyzer
async function initAudioAnalyzer() {
    try {
        // Initialize speech command recognizer if TensorFlow.js is loaded
        if (window.tf) {
            console.log('Loading speech command model...');
            // Create recognizer
            speechCommandModel = await window.speechCommands.create(
                'BROWSER_FFT',
                undefined,
                'https://tfhub.dev/tensorflow/tfjs-model/speech-commands/v0/18/default/1',
                {
                    includeSpectogram: true,
                    includeWaveform: true
                }
            );

            // Warm up the model
            await speechCommandModel.ensureModelLoaded();
            console.log('Speech command model loaded successfully');
        }
    } catch (error) {
        console.error('Error initializing audio analyzer:', error);
    }
}

// Extract audio features (enhanced with Meyda and TensorFlow.js)
async function extractAudioFeatures(audioBuffer) {
    // Create audio context if not exists
    if (!audioContext) {
        audioContext = new AudioContext();
    }

    // Get audio data
    const audioData = audioBuffer.getChannelData(0); // Get mono audio data

    // Calculate basic features
    const features = {
        rms: calculateRMS(audioData),
        zcr: calculateZCR(audioData),
        energy: calculateEnergy(audioData),
        spectralCentroid: calculateSpectralCentroid(audioData, audioContext.sampleRate),
        spectralFlatness: calculateSpectralFlatness(audioData, audioContext.sampleRate),
        tempo: calculateTempo(audioData, audioContext.sampleRate),
        mfcc: calculateMFCC(audioData, audioContext.sampleRate)
    };

    return features;
}

// Calculate RMS (Root Mean Square) - measure of signal power
function calculateRMS(audioData) {
    let sum = 0;
    for (let i = 0; i < audioData.length; i++) {
        sum += audioData[i] * audioData[i];
    }
    return Math.sqrt(sum / audioData.length);
}

// Calculate Zero Crossing Rate - measure of signal noisiness
function calculateZCR(audioData) {
    let zcr = 0;
    for (let i = 1; i < audioData.length; i++) {
        if ((audioData[i] >= 0 && audioData[i-1] < 0) || (audioData[i] < 0 && audioData[i-1] >= 0)) {
            zcr++;
        }
    }
    return zcr / audioData.length;
}

// Calculate signal energy
function calculateEnergy(audioData) {
    let energy = 0;
    for (let i = 0; i < audioData.length; i++) {
        energy += audioData[i] * audioData[i];
    }
    return energy;
}

// Calculate spectral centroid - measure of brightness
function calculateSpectralCentroid(audioData, sampleRate) {
    // Create a simple FFT approximation
    const fftSize = 2048;
    const fft = new Array(fftSize / 2);

    // Simple power spectrum calculation
    for (let k = 0; k < fftSize / 2; k++) {
        let real = 0;
        let imag = 0;

        for (let n = 0; n < fftSize; n++) {
            const angle = -2 * Math.PI * k * n / fftSize;
            real += audioData[n] * Math.cos(angle);
            imag += audioData[n] * Math.sin(angle);
        }

        fft[k] = Math.sqrt(real * real + imag * imag);
    }

    // Calculate centroid
    let numerator = 0;
    let denominator = 0;

    for (let k = 0; k < fftSize / 2; k++) {
        numerator += k * fft[k];
        denominator += fft[k];
    }

    return denominator > 0 ? (numerator / denominator) * (sampleRate / 2) / (fftSize / 2) : 0;
}

// Calculate spectral flatness - measure of noisiness vs tonality
function calculateSpectralFlatness(audioData, sampleRate) {
    // Create a simple FFT approximation
    const fftSize = 2048;
    const fft = new Array(fftSize / 2);

    // Simple power spectrum calculation
    for (let k = 0; k < fftSize / 2; k++) {
        let real = 0;
        let imag = 0;

        for (let n = 0; n < fftSize; n++) {
            const angle = -2 * Math.PI * k * n / fftSize;
            real += audioData[n] * Math.cos(angle);
            imag += audioData[n] * Math.sin(angle);
        }

        fft[k] = real * real + imag * imag;
    }

    // Calculate geometric and arithmetic means
    let geometricMean = 1;
    let arithmeticMean = 0;

    for (let k = 0; k < fftSize / 2; k++) {
        if (fft[k] > 0) {
            geometricMean *= Math.pow(fft[k], 1 / (fftSize / 2));
        }
        arithmeticMean += fft[k];
    }

    arithmeticMean /= (fftSize / 2);

    return arithmeticMean > 0 ? geometricMean / arithmeticMean : 0;
}

// Calculate tempo (beat detection)
function calculateTempo(audioData, sampleRate) {
    // Simple tempo detection based on energy peaks
    const hopSize = 512;
    const frameSize = 2048;
    const energy = [];

    // Calculate energy for each frame
    for (let i = 0; i < audioData.length - frameSize; i += hopSize) {
        let frameEnergy = 0;
        for (let j = 0; j < frameSize; j++) {
            frameEnergy += audioData[i + j] * audioData[i + j];
        }
        energy.push(frameEnergy);
    }

    // Find peaks in energy
    const peaks = [];
    for (let i = 1; i < energy.length - 1; i++) {
        if (energy[i] > energy[i-1] && energy[i] > energy[i+1]) {
            peaks.push(i);
        }
    }

    // Estimate tempo based on peak intervals
    if (peaks.length < 2) return 120; // Default tempo

    const intervals = [];
    for (let i = 1; i < peaks.length; i++) {
        intervals.push(peaks[i] - peaks[i-1]);
    }

    const avgInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
    const tempo = 60 / (avgInterval * hopSize / sampleRate);

    return Math.max(60, Math.min(200, tempo)); // Clamp to reasonable range
}

// Calculate MFCC (Mel-Frequency Cepstral Coefficients)
function calculateMFCC(audioData, sampleRate) {
    // Simplified MFCC calculation
    const frameSize = 1024;
    const numFilters = 26;
    const numCoeffs = 13;

    // Apply window function
    const windowed = applyWindow(audioData, frameSize);

    // Calculate power spectrum
    const powerSpectrum = calculatePowerSpectrum(windowed);

    // Apply mel filterbank
    const melSpectrum = applyMelFilterbank(powerSpectrum, sampleRate, numFilters);

    // Log compression
    const logMelSpectrum = melSpectrum.map(val => Math.log(val + 1e-10));

    // DCT to get MFCC
    const mfcc = applyDCT(logMelSpectrum, numCoeffs);

    return mfcc;
}

// Apply window function
function applyWindow(audioData, frameSize) {
    const windowed = new Array(frameSize);
    for (let i = 0; i < frameSize; i++) {
        // Hamming window
        windowed[i] = audioData[i] * (0.54 - 0.46 * Math.cos(2 * Math.PI * i / (frameSize - 1)));
    }
    return windowed;
}

// Calculate power spectrum
function calculatePowerSpectrum(windowed) {
    const fftSize = windowed.length;
    const powerSpectrum = new Array(fftSize / 2);

    for (let k = 0; k < fftSize / 2; k++) {
        let real = 0;
        let imag = 0;

        for (let n = 0; n < fftSize; n++) {
            const angle = -2 * Math.PI * k * n / fftSize;
            real += windowed[n] * Math.cos(angle);
            imag += windowed[n] * Math.sin(angle);
        }

        powerSpectrum[k] = real * real + imag * imag;
    }

    return powerSpectrum;
}

// Apply mel filterbank
function applyMelFilterbank(powerSpectrum, sampleRate, numFilters) {
    const melSpectrum = new Array(numFilters);

    // Create mel filterbank (simplified)
    for (let m = 0; m < numFilters; m++) {
        let melEnergy = 0;

        for (let k = 0; k < powerSpectrum.length; k++) {
            const freq = k * sampleRate / (2 * powerSpectrum.length);
            const mel = 2595 * Math.log10(1 + freq / 700);
            const melCenter = 2595 * Math.log10(1 + (m + 1) * sampleRate / (2 * numFilters * 700));
            const melWidth = 2595 * Math.log10(1 + (m + 2) * sampleRate / (2 * numFilters * 700)) - 
                           2595 * Math.log10(1 + m * sampleRate / (2 * numFilters * 700));

            if (mel >= melCenter - melWidth / 2 && mel <= melCenter + melWidth / 2) {
                melEnergy += powerSpectrum[k];
            }
        }

        melSpectrum[m] = melEnergy;
    }

    return melSpectrum;
}

// Apply DCT
function applyDCT(logMelSpectrum, numCoeffs) {
    const mfcc = new Array(numCoeffs);

    for (let n = 0; n < numCoeffs; n++) {
        let sum = 0;

        for (let k = 0; k < logMelSpectrum.length; k++) {
            sum += logMelSpectrum[k] * Math.cos(Math.PI * n * (k + 0.5) / logMelSpectrum.length);
        }

        mfcc[n] = sum;
    }

    return mfcc;
}

// Analyze emotion from audio
async function analyzeAudioEmotion(audioElement) {
    try {
        // Generate cache key
        const cacheKey = `audio-${audioElement.src}-${Date.now()}`;

        // Check cache first
        if (audioAnalysisCache.has(cacheKey)) {
            return audioAnalysisCache.get(cacheKey);
        }

        // Create audio context and analyzer
        if (!audioContext) {
            audioContext = new AudioContext();
        }

        // Create audio source from element
        const source = audioContext.createMediaElementSource(audioElement);
        const analyzer = audioContext.createAnalyser();

        // Configure analyzer
        analyzer.fftSize = 2048;
        analyzer.smoothingTimeConstant = 0.8;

        // Connect nodes
        source.connect(analyzer);
        analyzer.connect(audioContext.destination);

        // Get frequency data
        const frequencyData = new Uint8Array(analyzer.frequencyBinCount);
        const timeData = new Uint8Array(analyzer.fftSize);

        // Start audio element if not already playing
        if (audioElement.paused) {
            audioElement.play();

            // Wait for audio to play
            await new Promise(resolve => {
                audioElement.addEventListener('playing', () => resolve(), { once: true });
            });

            // Wait a bit for audio to process
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        // Get audio data
        analyzer.getByteFrequencyData(frequencyData);
        analyzer.getByteTimeDomainData(timeData);

        // Convert to float array
        const floatFrequencyData = new Float32Array(frequencyData.length);
        const floatTimeData = new Float32Array(timeData.length);

        for (let i = 0; i < frequencyData.length; i++) {
            floatFrequencyData[i] = frequencyData[i] / 255.0;
        }

        for (let i = 0; i < timeData.length; i++) {
            floatTimeData[i] = (timeData[i] - 128) / 128.0;
        }

        // Extract features
        const features = {
            rms: calculateRMS(floatTimeData),
            zcr: calculateZCR(floatTimeData),
            energy: calculateEnergy(floatTimeData),
            spectralCentroid: calculateSpectralCentroid(floatTimeData, audioContext.sampleRate),
            spectralFlatness: calculateSpectralFlatness(floatTimeData, audioContext.sampleRate),
            tempo: calculateTempo(floatTimeData, audioContext.sampleRate),
            mfcc: calculateMFCC(floatTimeData, audioContext.sampleRate)
        };

        // Prepare feature description for API
        let featureDescription = `Analyze this audio with these characteristics:
`;
        featureDescription += `- RMS (volume): ${features.rms}
`;
        featureDescription += `- Zero Crossing Rate: ${features.zcr}
`;
        featureDescription += `- Energy: ${features.energy}
`;
        featureDescription += `- Spectral Centroid (brightness): ${features.spectralCentroid}
`;
        featureDescription += `- Spectral Flatness (noisiness): ${features.spectralFlatness}
`;
        featureDescription += `- Tempo (beat): ${features.tempo} BPM
`;
        featureDescription += `- MFCC (timbre): ${features.mfcc.slice(0, 5).join(', ')}
`;
        featureDescription += `The audio contains speech or voice for emotion analysis.`;

        // Call DeepSeek API for audio emotion analysis
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${window.audioEmotionAPI_KEY || window.API_KEY || localStorage.getItem('openai_api_key')}`
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: [
                    {
                        role: "system",
                        content: "You are an audio emotion analysis API. Based on the detailed audio characteristics I provide, classify the emotion as one of: happy, sad, angry, surprised, fearful, disgusted, or neutral. Return a JSON object with the emotion label and confidence score. Also include a brief explanation of why you classified it this way based on the audio features."
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
            throw new Error(data.error?.message || 'فشل في تحليل مشاعر الصوت');
        }

        // Parse emotion response
        let emotionResponse;
        try {
            emotionResponse = JSON.parse(data.choices[0].message.content);
        } catch (parseError) {
            console.error('Error parsing emotion response:', data.choices[0].message.content);
            throw new Error('فشل في تحليل استجابة مشاعر الصوت: ' + parseError.message);
        }

        // Create analysis result
        const result = {
            emotion: emotionResponse.label || 'neutral',
            confidence: emotionResponse.score || 0.7,
            features: features,
            timestamp: Date.now()
        };

        // Cache the result
        audioAnalysisCache.set(cacheKey, result);

        return result;
    } catch (error) {
        console.error('Error analyzing audio emotion:', error);
        throw error;
    }
}

// Export functions
window.audioEmotionAnalysis = {
    init: initAudioEmotionAnalysis,
    analyze: analyzeAudioEmotion
};

// Initialize when the script loads
initAudioEmotionAnalysis();

// Log initialization
console.log('Audio Emotion Analysis module initialized');
