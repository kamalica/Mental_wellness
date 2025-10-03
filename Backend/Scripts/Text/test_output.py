import json
import sys
sys.path.insert(0, 'D:/Other_Projects/Mental_Wellness_New/Backend/Scripts/Text')

from text_speed import TypingSpeedAnalyzer

# Test the analyzer
analyzer = TypingSpeedAnalyzer()
result = analyzer.run_analysis(
    user_text="I am kamalica today is my brothers birthday he was feeling happy i was feeling excited",
    duration=44.94
)

# Print the JSON output
print(json.dumps(result, indent=2))
