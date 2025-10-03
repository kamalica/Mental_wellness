import time
import json
import sys
from test_sentiment import TextSentimentAnalyzer

class TypingSpeedAnalyzer:
    def __init__(self):
        self.text_analyzer = TextSentimentAnalyzer()

    def calculate_wpm(self, text: str, duration: float) -> float:
        """Calculate words per minute"""
        if not text.strip():
            return 0.0
        word_count = len(text.split())
        minutes = duration / 60
        if minutes == 0:
            return 0.0
        return round(word_count / minutes, 2)

    def run_analysis(self, user_text: str, duration: float) -> dict:
        """Run typing + sentiment analysis and return results"""
        wpm = self.calculate_wpm(user_text, duration)

        # Sentiment analysis
        sentiment_result = self.text_analyzer.analyze_text_comprehensive(user_text)
        wellness_summary = self.text_analyzer.get_wellness_summary(sentiment_result)

        # Calculate wellness score (0-100 scale)
        sentiment_score = wellness_summary.get("sentiment_score", 0)
        wellness_score = round((sentiment_score + 1) * 50, 2)  # Convert from -1...1 to 0...100
        
        # Determine risk level
        if wellness_score >= 70:
            risk_level = "low"
        elif wellness_score >= 40:
            risk_level = "moderate"
        else:
            risk_level = "high"
        
        # Generate recommendations based on detected concerns
        recommendations = []
        concerns = wellness_summary.get("detected_concerns", [])
        if "anxiety" in concerns:
            recommendations.append("Practice deep breathing exercises")
            recommendations.append("Consider speaking with a mental health professional")
        if "depression" in concerns:
            recommendations.append("Maintain social connections")
            recommendations.append("Engage in activities you enjoy")
        if "stress" in concerns:
            recommendations.append("Take regular breaks throughout the day")
            recommendations.append("Try stress-management techniques")
        if not concerns and wellness_summary.get("overall_sentiment") == "positive":
            recommendations.append("Continue your positive activities")
            recommendations.append("Share your positivity with others")
        if not recommendations:
            recommendations.append("Maintain a balanced lifestyle")
            recommendations.append("Practice self-care regularly")

        return {
            "typed_text": user_text,
            "typing_speed": {
                "words_per_minute": wpm,
                "time_taken": round(duration, 2),
                "total_words": len(user_text.split()),
                "total_characters": len(user_text),
            },
            "text_sentiment": {
                "overall_sentiment": wellness_summary.get("overall_sentiment", "neutral"),
                "sentiment_score": wellness_summary.get("sentiment_score", 0),
                "detected_concerns": wellness_summary.get("detected_concerns", []),
                "positive_indicators": wellness_summary.get("positive_indicators", []),
                "keyword_categories": wellness_summary.get("keyword_categories", []),
                "total_keywords_found": wellness_summary.get("total_keywords_found", 0)
            },
            "overall_assessment": {
                "wellness_score": wellness_score,
                "risk_level": risk_level,
                "primary_indicators": wellness_summary.get("positive_indicators", []) if wellness_score >= 50 else wellness_summary.get("detected_concerns", []),
                "recommendations": recommendations
            }
        }


if __name__ == "__main__":
    try:
        # Read input from stdin
        input_text = sys.stdin.read()
        input_data = json.loads(input_text or "{}")
        
        # DEBUG: Log to stderr (won't interfere with stdout JSON)
        sys.stderr.write(f"✅ Received in text_speed.py: {input_data}\n")
        sys.stderr.flush()
        
        analyzer = TypingSpeedAnalyzer()
        result = analyzer.run_analysis(
            user_text=input_data.get("text", ""),
            duration=input_data.get("duration", 60)
        )

        # ✅ Always print JSON only to stdout
        print(json.dumps(result), flush=True)
    except Exception as e:
        sys.stderr.write(f"❌ Error in text_speed.py: {str(e)}\n")
        print(json.dumps({"success": False, "error": str(e)}), flush=True)
