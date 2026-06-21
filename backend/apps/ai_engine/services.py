"""NexusOne AI - AI Engine Service"""

from django.conf import settings


class AIService:
    """Centralized AI service using OpenAI with graceful fallback"""

    def __init__(self):
        self.client = None
        self.model = getattr(settings, 'OPENAI_MODEL', 'gpt-4-turbo-preview')
        api_key = getattr(settings, 'OPENAI_API_KEY', '')
        if api_key and api_key != 'sk-your-openai-api-key-here' and len(api_key) > 20:
            try:
                from openai import OpenAI
                self.client = OpenAI(api_key=api_key)
            except Exception:
                self.client = None

    def _chat(self, system_prompt, user_prompt, max_tokens=500):
        if not self.client:
            return self._fallback_response(user_prompt)
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                max_tokens=max_tokens,
                temperature=0.7,
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"AI Error: {str(e)}. Please check your OpenAI API key in .env file."

    def _fallback_response(self, prompt):
        """Smart fallback when no API key is configured"""
        prompt_lower = prompt.lower()
        if 'revenue' in prompt_lower or 'financial' in prompt_lower:
            return "📊 AI Analysis: To get real AI insights, add your OpenAI API key to the .env file (OPENAI_API_KEY). Currently showing placeholder: Your revenue data shows business activity. Monitor monthly trends, focus on converting pending invoices to paid status, and follow up on overdue payments to improve cash flow."
        elif 'project' in prompt_lower or 'delay' in prompt_lower or 'risk' in prompt_lower:
            return "⚠️ AI Analysis: Configure OPENAI_API_KEY in .env for real analysis. Currently: Review projects nearing deadline, ensure tasks are properly assigned, update progress regularly, and flag blockers early to prevent delays."
        elif 'task' in prompt_lower or 'priorit' in prompt_lower:
            return "✅ AI Prioritization: Add OPENAI_API_KEY for smart prioritization. Suggestion: Focus on critical and high-priority overdue items first, then high-priority items due soon, followed by medium-priority ongoing work."
        elif 'customer' in prompt_lower or 'churn' in prompt_lower:
            return "👥 AI CRM: Enable AI with OPENAI_API_KEY. Tip: Monitor customers with no activity in 30+ days, follow up on outstanding balances, and maintain regular touchpoints with VIP customers."
        elif 'ticket' in prompt_lower or 'support' in prompt_lower:
            return "🎫 AI Support: Configure OPENAI_API_KEY for AI replies. Suggestion: Prioritize critical and SLA-breached tickets first, provide clear resolution steps, and escalate complex technical issues promptly."
        else:
            return "🤖 NexusOne AI Copilot is ready! To enable full AI capabilities powered by GPT-4, add your OpenAI API key to the backend .env file:\n\nOPENAI_API_KEY=sk-your-key-here\n\nThen restart the backend server. Once configured, I can analyze your business data, predict trends, generate insights, and answer any business questions."

    def summarize_ticket(self, ticket):
        replies_text = "\n".join([f"Reply: {r.content}" for r in ticket.replies.all()[:10]])
        return self._chat(
            "You are a customer support AI. Summarize this ticket concisely in 2-3 sentences.",
            f"Ticket: {ticket.title}\nDescription: {ticket.description}\nReplies:\n{replies_text}",
            max_tokens=200
        )

    def suggest_ticket_reply(self, ticket):
        return self._chat(
            "You are a professional customer support agent. Write a helpful, empathetic reply to this customer ticket. Be concise and solution-focused.",
            f"Ticket: {ticket.title}\nDescription: {ticket.description}\nPriority: {ticket.priority}",
            max_tokens=300
        )

    def generate_business_insights(self, company_data):
        return self._chat(
            "You are a business intelligence AI analyst. Analyze the business data and provide 3-5 actionable insights with specific recommendations.",
            f"Company Data: {company_data}",
            max_tokens=600
        )

    def predict_customer_churn(self, customer_data):
        return self._chat(
            "You are a CRM AI analyst. Assess churn risk (low/medium/high) with specific reasoning and recommended actions.",
            f"Customer Data: {customer_data}",
            max_tokens=300
        )

    def analyze_revenue(self, financial_data):
        return self._chat(
            "You are a financial AI analyst. Analyze revenue trends and provide specific insights and growth recommendations.",
            f"Financial Data: {financial_data}",
            max_tokens=500
        )

    def detect_delayed_projects(self, projects_data):
        return self._chat(
            "You are a project management AI. Identify at-risk and delayed projects, explain the risks, and recommend specific actions.",
            f"Projects: {projects_data}",
            max_tokens=400
        )

    def smart_task_prioritization(self, tasks_data):
        return self._chat(
            "You are a productivity AI. Analyze tasks and suggest optimal prioritization with brief reasoning for each.",
            f"Tasks: {tasks_data}",
            max_tokens=400
        )

    def answer_business_question(self, question, context_data):
        return self._chat(
            "You are NexusOne AI Copilot, an intelligent business assistant. Answer questions about business operations based on the data provided. Be specific and actionable.",
            f"Question: {question}\n\nBusiness Context:\n{context_data}",
            max_tokens=800
        )

    def generate_report_narrative(self, report_data):
        return self._chat(
            "You are a business report writer. Create a clear, professional narrative summary for this report data.",
            f"Report Data: {report_data}",
            max_tokens=600
        )
