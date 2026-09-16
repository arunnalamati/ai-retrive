from typing import Dict, Any

class ClarificationAgent:
    """
    Clarification Agent:
    Handles ambiguous or underspecified queries by identifying missing parameters
    and generating polite, actionable clarification prompts.
    """
    def __init__(self):
        self.agent_name = "Clarification Agent"

    def formulate_clarification(self, query: str, reasoning: str = None) -> str:
        base_prompt = (
            "Your query appears ambiguous or incomplete. Could you please specify which topic, "
            "system component, or policy document you would like information about?\n\n"
            "For example:\n"
            "• 'What is RAG?'\n"
            "• 'What are the steps in a RAG pipeline?'\n"
            "• 'How many annual leave days does an employee receive?'"
        )
        return base_prompt
