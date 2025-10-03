"""
Text Sentiment Analysis Module
Analyzes text input for sentiment and mental wellness keywords
"""

import re
from textblob import TextBlob
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from typing import Dict, List, Tuple
import logging

class TextSentimentAnalyzer:
    def __init__(self):
        """Initialize the text sentiment analyzer"""
        self.vader_analyzer = SentimentIntensityAnalyzer()
        self.logger = logging.getLogger(__name__)
        
        # Mental wellness keywords categorized by type
        self.wellness_keywords = {
            'anxiety': [
                'anxiety', 'anxious', 'worry', 'worried', 'panic', 'panic attack',
                'nervous', 'stress', 'stressed', 'overwhelmed', 'fear', 'afraid',
                'scared', 'tense', 'restless', 'uneasy', 'apprehensive'
            ],
            'depression': [
                'depression', 'depressed', 'sad', 'sadness', 'hopeless', 'hopelessness',
                'empty', 'lonely', 'isolated', 'worthless', 'guilty', 'shame',
                'despair', 'grief', 'mourning', 'melancholy', 'gloomy', 'down'
            ],
            'positivity': [
                'happy', 'happiness', 'joy', 'joyful', 'excited', 'excitement',
                'optimistic', 'optimism', 'positive', 'confident', 'proud',
                'grateful', 'gratitude', 'content', 'satisfied', 'fulfilled',
                'energetic', 'motivated', 'inspired', 'hopeful'
            ],
            'stress': [
                'stress', 'stressed', 'pressure', 'pressured', 'overwhelmed',
                'burnout', 'exhausted', 'tired', 'fatigue', 'drained',
                'frustrated', 'irritated', 'angry', 'rage', 'furious'
            ],
            'sleep': [
                'sleep', 'sleeping', 'insomnia', 'tired', 'fatigue', 'exhausted',
                'restless', 'nightmare', 'dream', 'night', 'bedtime', 'awake'
            ],
            'social': [
                'lonely', 'loneliness', 'isolated', 'isolation', 'friend', 'friends',
                'family', 'relationship', 'social', 'community', 'support'
            ],
            'self_care': [
                'self-care', 'self care', 'therapy', 'counseling', 'meditation',
                'mindfulness', 'exercise', 'workout', 'healthy', 'wellness',
                'relaxation', 'breathing', 'yoga', 'meditation'
            ]
        }
    
    def analyze_sentiment(self, text: str) -> Dict[str, float]:
        """Analyze sentiment using multiple methods"""
        try:
            # TextBlob sentiment
            blob = TextBlob(text)
            textblob_polarity = blob.sentiment.polarity
            textblob_subjectivity = blob.sentiment.subjectivity
            
            # VADER sentiment
            vader_scores = self.vader_analyzer.polarity_scores(text)
            
            # Combine results
            sentiment_analysis = {
                'textblob_polarity': textblob_polarity,
                'textblob_subjectivity': textblob_subjectivity,
                'vader_positive': vader_scores['pos'],
                'vader_negative': vader_scores['neg'],
                'vader_neutral': vader_scores['neu'],
                'vader_compound': vader_scores['compound']
            }
            
            # Determine overall sentiment
            overall_sentiment = self._determine_overall_sentiment(sentiment_analysis)
            sentiment_analysis['overall_sentiment'] = overall_sentiment
            sentiment_analysis['overall_score'] = self._get_overall_score(sentiment_analysis)
            
            return sentiment_analysis
            
        except Exception as e:
            self.logger.error(f"Error analyzing sentiment: {e}")
            return {}
    
    def _determine_overall_sentiment(self, sentiment_data: Dict[str, float]) -> str:
        """Determine overall sentiment from analysis results"""
        compound_score = sentiment_data.get('vader_compound', 0)
        textblob_polarity = sentiment_data.get('textblob_polarity', 0)
        
        # Weighted combination
        overall_score = (compound_score * 0.6) + (textblob_polarity * 0.4)
        
        if overall_score >= 0.05:
            return 'positive'
        elif overall_score <= -0.05:
            return 'negative'
        else:
            return 'neutral'
    
    def _get_overall_score(self, sentiment_data: Dict[str, float]) -> float:
        """Get overall sentiment score"""
        compound_score = sentiment_data.get('vader_compound', 0)
        textblob_polarity = sentiment_data.get('textblob_polarity', 0)
        
        return (compound_score * 0.6) + (textblob_polarity * 0.4)
    
    def detect_wellness_keywords(self, text: str) -> Dict[str, List[str]]:
        """Detect mental wellness keywords in text"""
        text_lower = text.lower()
        detected_keywords = {}
        
        for category, keywords in self.wellness_keywords.items():
            found_keywords = []
            for keyword in keywords:
                if keyword in text_lower:
                    found_keywords.append(keyword)
            
            if found_keywords:
                detected_keywords[category] = found_keywords
        
        return detected_keywords
    
    def analyze_text_comprehensive(self, text: str) -> Dict:
        """Comprehensive text analysis combining sentiment and keyword detection"""
        if not text.strip():
            return {
                'sentiment_analysis': {},
                'wellness_keywords': {},
                'text_length': 0,
                'word_count': 0
            }
        
        # Sentiment analysis
        sentiment_analysis = self.analyze_sentiment(text)
        
        # Keyword detection
        wellness_keywords = self.detect_wellness_keywords(text)
        
        # Text statistics
        word_count = len(text.split())
        text_length = len(text)
        
        return {
            'sentiment_analysis': sentiment_analysis,
            'wellness_keywords': wellness_keywords,
            'text_length': text_length,
            'word_count': word_count,
            'original_text': text
        }
    
    def get_wellness_summary(self, analysis_result: Dict) -> Dict[str, any]:
        """Get a summary of wellness indicators from analysis"""
        sentiment = analysis_result.get('sentiment_analysis', {})
        keywords = analysis_result.get('wellness_keywords', {})
        
        # Count keyword categories
        keyword_categories = list(keywords.keys())
        
        # Determine primary concerns
        concerns = []
        if 'anxiety' in keyword_categories:
            concerns.append('anxiety')
        if 'depression' in keyword_categories:
            concerns.append('depression')
        if 'stress' in keyword_categories:
            concerns.append('stress')
        
        # Determine positive indicators
        positive_indicators = []
        if 'positivity' in keyword_categories:
            positive_indicators.append('positivity')
        if 'self_care' in keyword_categories:
            positive_indicators.append('self_care')
        
        return {
            'overall_sentiment': sentiment.get('overall_sentiment', 'neutral'),
            'sentiment_score': sentiment.get('overall_score', 0),
            'detected_concerns': concerns,
            'positive_indicators': positive_indicators,
            'keyword_categories': keyword_categories,
            'total_keywords_found': sum(len(keywords[cat]) for cat in keywords)
        }

# Example usage and testing
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    
    analyzer = TextSentimentAnalyzer()
    
    # Test texts
    test_texts = [
        "I'm feeling really anxious about my job interview tomorrow. I can't stop worrying about it.",
        "I'm so happy today! Everything is going great and I feel optimistic about the future.",
        "I've been feeling really down lately. Nothing seems to matter anymore.",
        "I need to practice more self-care. Maybe I should try meditation or yoga."
    ]
    
    for text in test_texts:
        print(f"\nText: {text}")
        result = analyzer.analyze_text_comprehensive(text)
        summary = analyzer.get_wellness_summary(result)
        
        print(f"Sentiment: {summary['overall_sentiment']} (Score: {summary['sentiment_score']:.3f})")
        print(f"Concerns: {summary['detected_concerns']}")
        print(f"Positive indicators: {summary['positive_indicators']}")
        print(f"Keywords found: {summary['total_keywords_found']}")
