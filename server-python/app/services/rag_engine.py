import os
from groq import Groq
from dotenv import load_dotenv
from collections import defaultdict

load_dotenv()  # Load variables from .env into os.environ

# Initialize the Groq client
# It automatically picks up GROQ_API_KEY from the environment
client = Groq()

# Status display labels and priority order
STATUS_ORDER = ["CURRENT", "COMPLETED", "REPEATING", "PAUSED", "DROPPED", "PLANNING"]
STATUS_LABELS = {
    "CURRENT": "Currently Watching",
    "COMPLETED": "Completed",
    "REPEATING": "Re-watching",
    "PAUSED": "On Hold",
    "DROPPED": "Dropped",
    "PLANNING": "Plan to Watch",
}


def _format_watch_history(watch_history: list) -> str:
    """
    Organize watch history into status groups and build a rich context string.
    Includes a score distribution summary for taste profiling.
    """
    if not watch_history:
        return "Watch History: User has not logged any anime yet.\n"

    # --- Score Distribution Summary ---
    scored = [a for a in watch_history if a.get("score") and a["score"] > 0]
    total_watched = len(watch_history)
    total_scored = len(scored)

    score_buckets = {"9-10 (Masterpiece)": 0, "7-8 (Great)": 0, "5-6 (Average)": 0, "3-4 (Below Average)": 0, "1-2 (Disliked)": 0}
    for a in scored:
        s = a["score"]
        if s >= 9:
            score_buckets["9-10 (Masterpiece)"] += 1
        elif s >= 7:
            score_buckets["7-8 (Great)"] += 1
        elif s >= 5:
            score_buckets["5-6 (Average)"] += 1
        elif s >= 3:
            score_buckets["3-4 (Below Average)"] += 1
        else:
            score_buckets["1-2 (Disliked)"] += 1

    avg_score = round(sum(a["score"] for a in scored) / total_scored, 1) if total_scored else "N/A"

    summary = f"📊 Watch Stats: {total_watched} anime logged, {total_scored} rated, average score: {avg_score}/10\n"
    summary += "Score Distribution: " + " | ".join(f"{k}: {v}" for k, v in score_buckets.items() if v > 0) + "\n\n"

    # --- Group by Status ---
    groups = defaultdict(list)
    for anime in watch_history:
        status = anime.get("status", "COMPLETED")
        groups[status].append(anime)

    history_lines = [summary, "═══ WATCH HISTORY BY STATUS ═══\n"]

    for status_key in STATUS_ORDER:
        if status_key not in groups:
            continue
        label = STATUS_LABELS.get(status_key, status_key)
        entries = groups[status_key]
        history_lines.append(f"▸ {label} ({len(entries)}):")
        for anime in entries:
            title = anime.get("title", "Unknown")
            score = anime.get("score", 0)
            genres = ", ".join(anime.get("genres", [])) if anime.get("genres") else ""
            score_str = f" — rated {score}/10" if score and score > 0 else ""
            genre_str = f" [{genres}]" if genres else ""
            history_lines.append(f"  • {title}{score_str}{genre_str}")
        history_lines.append("")  # blank line between groups

    return "\n".join(history_lines)


def _format_dna_markers(dna_markers: dict) -> str:
    """Format DNA markers with tiered importance."""
    if not dna_markers:
        return "Anime DNA: No taste profile data available yet.\n"

    sorted_markers = sorted(dna_markers.items(), key=lambda x: x[1], reverse=True)

    # Tier the markers for better LLM comprehension
    core = [(k, v) for k, v in sorted_markers if v >= 15]
    strong = [(k, v) for k, v in sorted_markers if 8 <= v < 15]
    minor = [(k, v) for k, v in sorted_markers if v < 8]

    lines = ["═══ ANIME DNA PROFILE ═══\n"]
    if core:
        lines.append("🧬 Core Identity (defines their taste):")
        for tag, weight in core:
            lines.append(f"  ★ {tag} — {weight}%")
    if strong:
        lines.append("⚡ Strong Affinities:")
        for tag, weight in strong:
            lines.append(f"  ▸ {tag} — {weight}%")
    if minor:
        lines.append("◦ Secondary Interests:")
        for tag, weight in minor:
            lines.append(f"  · {tag} — {weight}%")
    lines.append("")
    return "\n".join(lines)


def _format_custom_lists(custom_lists: list) -> str:
    """Format custom lists as curated context."""
    if not custom_lists:
        return "Custom Collections: None created.\n"

    lines = ["═══ CUSTOM COLLECTIONS ═══\n"]
    for cl in custom_lists:
        name = cl.get("name", "Untitled")
        anime_list = cl.get("anime", [])
        if anime_list:
            lines.append(f"📁 \"{name}\" ({len(anime_list)} titles): {', '.join(anime_list)}")
        else:
            lines.append(f"📁 \"{name}\" (empty)")
    lines.append("")
    return "\n".join(lines)


def _extract_previous_recommendations(messages: list) -> str:
    """
    Scan previous assistant messages to extract any anime titles that were
    already recommended, so the LLM avoids repeating them.
    """
    if len(messages) <= 1:
        return ""

    prev_assistant_msgs = [m["content"] for m in messages if m["role"] == "assistant"]
    if not prev_assistant_msgs:
        return ""

    return (
        "═══ CONVERSATION MEMORY ═══\n"
        "The following are your previous responses in this conversation. "
        "Do NOT re-recommend the same anime titles unless the user explicitly asks. "
        "Build on the conversation — reference what you said before if relevant.\n"
        "Previous responses summary (most recent last):\n"
        + "\n---\n".join(prev_assistant_msgs[-3:])  # last 3 assistant messages for context
        + "\n\n"
    )


def generate_anime_insight(messages: list, watch_history: list, dna_markers: dict, custom_lists: list) -> str:
    """
    RAG Pipeline that uses the user's watch history, DNA, and custom lists
    to answer questions via Groq (Llama 3.3 70B).
    """

    # Build structured context blocks
    history_context = _format_watch_history(watch_history)
    dna_context = _format_dna_markers(dna_markers)
    lists_context = _format_custom_lists(custom_lists)
    memory_context = _extract_previous_recommendations(messages)

    # Construct the system prompt
    system_instruction = f"""You are **Satori** — a world-class AI anime analyst and recommendation engine with encyclopedic knowledge of anime spanning all eras, studios, and genres. You combine deep cultural understanding with data-driven personalization.

You have access to the user's complete anime profile below. Study it carefully before every response.

{history_context}
{dna_context}
{lists_context}
{memory_context}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BEHAVIORAL DIRECTIVES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. PERSONALIZATION IS PARAMOUNT
   - Every recommendation MUST be grounded in the user's DNA, scores, and watch patterns.
   - Reference specific anime from their history to justify your suggestions (e.g., "Since you gave Steins;Gate a 9/10 and your DNA shows 78% Psychological...").
   - Adapt your suggestions to their scoring patterns — if they rate harshly, acknowledge that.

2. NEVER RECOMMEND ALREADY-WATCHED ANIME
   - Cross-check every suggestion against the full watch history above, including all statuses.
   - If the anime appears anywhere in their history (Completed, Dropped, Planning, etc.), do NOT suggest it — unless the user explicitly asks for re-watch ideas.

3. CONVERSATION CONTINUITY
   - Remember what you recommended earlier in this conversation. Do not repeat titles.
   - Build on prior exchanges — if the user liked your last suggestion's direction, lean into it.
   - If the user rejects a suggestion, pivot meaningfully — don't just offer a slight variation.

4. RESPONSE FORMATTING (STRICTLY FOLLOW)
   When recommending anime, use this exact structure for each recommendation:

   **[Number]. [Anime Title]**
   *[Genre1, Genre2, Genre3]*
   [1-2 sentence synopsis — vivid but spoiler-free]
   **Why for you:** [Personalized reason tied to their DNA/history/scores]

   Example:
   **1. Monster**
   *Psychological Thriller, Mystery, Drama*
   A brilliant neurosurgeon hunts a former patient who has become a serial killer, unraveling a conspiracy that spans decades across Cold War Europe.
   **Why for you:** Your DNA shows 78% Psychological and you rated Death Note 9/10 — Monster delivers the same cat-and-mouse tension but with more moral complexity and a slower, more rewarding burn.

5. DEPTH & KNOWLEDGE
   - Go beyond surface-level synopses. Reference directors, studios, animation quality, OSTs, cultural impact.
   - Offer comparisons: "If X was [quality], then Y is [quality]."
   - For taste analysis, be specific — don't just list genres. Explain the *patterns* in their preferences.

6. TONE & PERSONALITY
   - Sophisticated, knowledgeable, and passionate about anime — like talking to a well-read friend.
   - Confident but not arrogant. Show genuine enthusiasm for great anime.
   - Use markdown formatting: bold titles, italic genres, bullet points, and clear structure.
   - Keep responses focused and well-organized — quality over quantity.

7. NON-RECOMMENDATION QUERIES
   - For questions about specific anime, provide rich analysis drawing from your knowledge.
   - For taste analysis, identify non-obvious patterns (e.g., "You seem drawn to protagonists who carry moral burdens").
   - For comparisons, be nuanced — acknowledge both similarities and differences.
"""

    try:
        # Build message history starting with the system prompt
        groq_messages = [{"role": "system", "content": system_instruction}]

        # Add the conversation history from the frontend
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
