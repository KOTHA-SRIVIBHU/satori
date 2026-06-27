import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv() # Load variables from .env into os.environ

# Initialize the Groq client
# It automatically picks up GROQ_API_KEY from the environment
client = Groq()

def generate_anime_insight(messages: list, watch_history: list, dna_markers: dict, custom_lists: list) -> str:
    """
    RAG Pipeline that uses the user's watch history, DNA, and custom lists to answer questions via Groq (Llama-3).
    """
    
    # 1. Format the user's watch history as context
    history_context = "User's Watch History:\n"
    if not watch_history:
        history_context += "No watch history available.\n"
    else:
        for anime in watch_history:
            title = anime.get('title', 'Unknown')
            score = anime.get('score', 0)
            status = anime.get('status', 'COMPLETED')
            history_context += f"- {title} (Score: {score}/10, Status: {status})\n"

    # 2. Format the user's DNA Markers as context
    dna_context = "User's Anime DNA (Top Genres/Tags they like):\n"
    if not dna_markers:
        dna_context += "No DNA data available.\n"
    else:
        for tag, weight in dna_markers.items():
            dna_context += f"- {tag}: {weight}%\n"
            
    # 3. Format the user's Custom Lists as context
    custom_lists_context = "User's Custom Collections:\n"
    if not custom_lists:
        custom_lists_context += "No custom lists available.\n"
    else:
        for cl in custom_lists:
            custom_lists_context += f"- List '{cl['name']}': {', '.join(cl.get('anime', []))}\n"
            
    # 4. Construct the System Prompt
    system_instruction = f"""You are Satori, an advanced, highly intelligent AI Anime Recommendation Engine.
Your goal is to provide deeply insightful, personalized anime recommendations and answers based on the user's Watch History, Anime DNA, and Custom Lists.

{history_context}
{dna_context}
{custom_lists_context}

CRITICAL RULES:
1. ALWAYS base your recommendations on the user's data context above. 
2. If the user asks for a recommendation, DO NOT suggest anime they have already watched or are currently in their watch history (unless they explicitly ask for re-watch ideas).
3. Always structure your responses properly: When recommending an anime, put the Anime Title FIRST (in bold), and then provide your deep analysis and reasoning.
4. Keep your tone sophisticated, slightly futuristic, and highly knowledgeable about anime.
5. Use markdown formatting to make your responses easy to read (bolding titles, using bullet points).
"""

    try:
        # Build message history starting with the system prompt
        groq_messages = [{"role": "system", "content": system_instruction}]
        
        # Add the conversation history from frontend
        for msg in messages:
            groq_messages.append({"role": msg["role"], "content": msg["content"]})
            
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=groq_messages,
            temperature=0.7,
            max_tokens=2048,
        )
        return completion.choices[0].message.content
    except Exception as e:
        print(f"Groq API Error: {e}")
        return f"Error connecting to the Satori Insight Engine. {str(e)}"
