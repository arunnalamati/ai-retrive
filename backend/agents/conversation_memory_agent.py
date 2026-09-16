from typing import List, Dict, Any

class ConversationMemoryAgent:
    """
    Conversation Memory Agent:
    Maintains session interaction history and short-term dialogue context.
    Serves as an architectural foundation component.
    """
    def __init__(self):
        self.agent_name = "Conversation Memory Agent"
        self._history: List[Dict[str, Any]] = []

    def record_turn(self, query: str, response: str, query_type: str, confidence: str):
        self._history.append({
            "query": query,
            "response": response,
            "query_type": query_type,
            "confidence": confidence
        })

    def get_recent_history(self, limit: int = 5) -> List[Dict[str, Any]]:
        return self._history[-limit:]

    def clear(self):
        self._history = []
