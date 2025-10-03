import os
import sys
import cv2
import numpy as np
from collections import Counter
from datetime import datetime
import base64
from io import BytesIO
from PIL import Image
import json
import time

try:
    from tensorflow.keras.models import load_model
    print("TensorFlow imported successfully", file=sys.stderr)
except Exception:
    try:
        from keras.models import load_model
        print("Keras imported successfully", file=sys.stderr)
    except Exception as e:
        print(f"Failed to import keras/tensorflow: {e}", file=sys.stderr)
        exit(1)

# -------------------------------
# Emotion Labels
# -------------------------------
EMOTIONS = {
    0: {"emotion": "Angry", "color": (193, 69, 42)},
    1: {"emotion": "Disgust", "color": (164, 175, 49)},
    2: {"emotion": "Fear", "color": (40, 52, 155)},
    3: {"emotion": "Happy", "color": (23, 164, 28)},
    4: {"emotion": "Sad", "color": (164, 93, 23)},
    5: {"emotion": "Surprise", "color": (218, 229, 97)},
    6: {"emotion": "Neutral", "color": (108, 72, 200)},
}

# -------------------------------
# Emotion Analyzer Class
# -------------------------------
class EmotionAnalyzerAPI:
    def __init__(self, model_path=None, cascade_path=None, min_conf=0.36):
        self.min_conf = min_conf
        self.emotion_counter = Counter()
        self.emotion_history = []  # Store all emotion predictions with timestamps
        self.frame_count = 0
        self.start_time = time.time()
        self.target_w, self.target_h = 48, 48
        self.face_detector = None
        self.emotion_classifier = None
        model_path = "D:\\Other_Projects\\Mental_Wellness_New\\Backend\\Scripts\\Face\\emotionModel.hdf5"
        self.model_path = self._find_model_path(model_path)
        self.cascade_path = self._find_cascade_path(cascade_path)

        success, msg = self.load_models()
        if not success:
            raise Exception(msg)
        
        print("=" * 60, file=sys.stderr)
        print("*** EMOTION ANALYSIS SYSTEM STARTED ***", file=sys.stderr)
        print("=" * 60, file=sys.stderr)
        print(f"Confidence Threshold: {self.min_conf}", file=sys.stderr)
        print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", file=sys.stderr)
        print("=" * 60, file=sys.stderr)

    def _find_model_path(self, provided_path):
        if provided_path and os.path.isfile(provided_path):
            return provided_path
        possible_paths = ["emotionModel.hdf5"]
        for path in possible_paths:
            if os.path.isfile(path):
                return path
        raise FileNotFoundError("Emotion model file not found.")

    def _find_cascade_path(self, provided_path):
        if provided_path and os.path.isfile(provided_path):
            return provided_path
        return cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'

    def load_models(self):
        try:
            self.emotion_classifier = load_model(self.model_path, compile=False)
            self.target_w, self.target_h = self.emotion_classifier.input_shape[1:3]
            self.face_detector = cv2.CascadeClassifier(self.cascade_path)
            if self.face_detector.empty():
                return False, "Failed to load Haar cascade"
            return True, "Models loaded successfully"
        except Exception as e:
            return False, str(e)

    def preprocess_face(self, gray_face):
        try:
            face = cv2.resize(gray_face, (self.target_w, self.target_h))
            face = face.astype("float32") / 255.0
            face = (face - 0.5) * 2.0
            face = np.expand_dims(face, axis=0)
            face = np.expand_dims(face, axis=-1)
            return face
        except:
            return None

    def generate_report(self):
        """Generate a consolidated emotion analysis report"""
        if not self.emotion_counter:
            return {
                "total_frames": self.frame_count,
                "total_faces_detected": 0,
                "dominant_emotion": "No data",
                "emotion_percentages": {},
                "session_duration": time.time() - self.start_time,
                "timestamp": datetime.now().isoformat()
            }
        
        total_detections = sum(self.emotion_counter.values())
        dominant_emotion = self.emotion_counter.most_common(1)[0][0]
        
        emotion_percentages = {}
        for emotion, count in self.emotion_counter.items():
            percentage = (count / total_detections) * 100
            emotion_percentages[emotion] = round(percentage, 2)
        
        return {
            "total_frames": self.frame_count,
            "total_faces_detected": total_detections,
            "dominant_emotion": dominant_emotion,
            "emotion_percentages": emotion_percentages,
            "session_duration": round(time.time() - self.start_time, 2),
            "timestamp": datetime.now().isoformat()
        }
    
    def print_terminal_report(self, is_final=False):
        """Print a formatted report to terminal"""
        report = self.generate_report()
        
        header = "*** FINAL EMOTION ANALYSIS REPORT ***" if is_final else "*** EMOTION ANALYSIS REPORT ***"
        
        print("\n" + "=" * 70, file=sys.stderr)
        print(f"{header:^70}", file=sys.stderr)
        print("=" * 70, file=sys.stderr)
        print(f"Session Duration: {report['session_duration']:.2f} seconds", file=sys.stderr)
        print(f"Total Frames Processed: {report['total_frames']}", file=sys.stderr)
        print(f"Total Faces Detected: {report['total_faces_detected']}", file=sys.stderr)
        print(f">>> DOMINANT EMOTION: {report['dominant_emotion'].upper()} <<<", file=sys.stderr)
        print("-" * 70, file=sys.stderr)
        print("EMOTION DISTRIBUTION:", file=sys.stderr)
        print("-" * 70, file=sys.stderr)
        
        # Sort emotions by percentage (descending)
        sorted_emotions = sorted(report['emotion_percentages'].items(), 
                                key=lambda x: x[1], reverse=True)
        
        for emotion, percentage in sorted_emotions:
            bar_length = int(percentage / 2)  # Scale for visual bar (max 50 chars)
            bar = "#" * bar_length + "-" * (50 - bar_length)
            print(f"  {emotion:12} |{bar}| {percentage:6.2f}%", file=sys.stderr)
        
        print("=" * 70, file=sys.stderr)
        
        if is_final:
            print(f"Analysis completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", file=sys.stderr)
            print("=" * 70 + "\n", file=sys.stderr)

    def analyze_frame(self, frame_b64):
        try:
            self.frame_count += 1
            current_time = datetime.now().strftime('%H:%M:%S')
            
            # Decode base64 frame
            img_bytes = base64.b64decode(frame_b64.split(',')[1])
            img = Image.open(BytesIO(img_bytes)).convert('RGB')
            frame = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)

            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            faces = self.face_detector.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))

            frame_emotions = []
            for (x, y, w, h) in faces:
                face_gray = gray[y:y+h, x:x+w]
                face_input = self.preprocess_face(face_gray)
                if face_input is not None:
                    preds = self.emotion_classifier.predict(face_input, verbose=0)[0]
                    idx = int(np.argmax(preds))
                    conf = float(np.max(preds))
                    
                    if conf >= self.min_conf:
                        emotion = EMOTIONS[idx]["emotion"]
                        self.emotion_counter[emotion] += 1
                        frame_emotions.append({
                            "emotion": emotion,
                            "confidence": round(conf, 3),
                            "timestamp": current_time
                        })
                        
                        # Print real-time result to terminal
                        print(f"[{current_time}] Frame #{self.frame_count}: {emotion} ({conf:.1%})", file=sys.stderr)
            
            # Store frame analysis in history
            self.emotion_history.append({
                "frame_number": self.frame_count,
                "timestamp": current_time,
                "faces_detected": len(faces),
                "emotions": frame_emotions
            })
            
            # Generate and print report every 10 frames
            if self.frame_count % 10 == 0:
                self.print_terminal_report(is_final=False)
            
            # Return structured data for Node.js backend
            return {
                "success": True,
                "frame_number": self.frame_count,
                "faces_detected": len(faces),
                "emotions": frame_emotions,
                "current_report": self.generate_report()
            }
            
        except Exception as e:
            print(f"❌ Error analyzing frame #{self.frame_count}: {str(e)}", file=sys.stderr)
            return {
                "success": False,
                "error": str(e),
                "frame_number": self.frame_count
            }

# -------------------------------
# Main loop: read base64 frames from stdin
# -------------------------------
if __name__ == "__main__":
    try:
        analyzer = EmotionAnalyzerAPI()
        
        for line in sys.stdin:
            frame_b64 = line.strip()
            if not frame_b64:
                continue
                
            result = analyzer.analyze_frame(frame_b64)
            
            # Output JSON to stdout for Node.js backend
            print(json.dumps(result))
            sys.stdout.flush()
            
    except KeyboardInterrupt:
        print("\n>>> Analysis interrupted by user <<<", file=sys.stderr)
        if 'analyzer' in locals():
            analyzer.print_terminal_report(is_final=True)
    except Exception as e:
        print(f"ERROR: Fatal error: {str(e)}", file=sys.stderr)
        if 'analyzer' in locals():
            analyzer.print_terminal_report(is_final=True)
        sys.exit(1)
    finally:
        # Always print final report when script ends normally
        if 'analyzer' in locals():
            print("\n*** Session ended normally ***", file=sys.stderr)
            analyzer.print_terminal_report(is_final=True)
