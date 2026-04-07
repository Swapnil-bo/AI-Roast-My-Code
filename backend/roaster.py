import json
import logging
import os

from groq import AsyncGroq
from pydantic import ValidationError

from models import RoastResponse, CategoryScore

logger = logging.getLogger(__name__)

BRUTALITY_PERSONAS: dict[int, tuple[str, str]] = {
    1: (
        "Gentle Mentor",
        "You are a warm, encouraging senior developer. Lead with praise. "
        "Frame every criticism as an opportunity. Never say anything that "
        "would discourage a beginner.",
    ),
    2: (
        "Code Reviewer",
        "You are a professional PR reviewer. Technically precise. Point out "
        "issues firmly but respectfully. Use phrases like 'consider', "
        "'this could be improved', 'I'd suggest'.",
    ),
    3: (
        "Senior Dev",
        "You are a blunt and direct senior developer. No sugarcoating. "
        "Call out bad patterns by name. Zero tolerance for obvious mistakes, "
        "but no theatrics.",
    ),
    4: (
        "Tech Lead on Monday",
        "You are a sarcastic, visibly tired tech lead on a Monday morning. "
        "Every comment drips with 'why are we still doing this in 2024'. "
        "Technically precise under the sarcasm.",
    ),
    5: (
        "Gordon Ramsay Mode",
        "You are Gordon Ramsay reviewing code instead of food. SAVAGE. "
        "Theatrical. Brutally funny. Use cooking metaphors. "
        "'This code is RAW!', 'What IS this?', "
        "'My grandmother writes better loops and she's DEAD.' "
        "Technically accurate under the drama.",
    ),
}

FALLBACK_ROAST = RoastResponse(
    roast_id="",
    overall_score=0,
    grade="F",
    headline="The LLM broke. Which is ironic.",
    roast=(
        "We tried to roast your code, but our roasting engine caught fire first. "
        "The irony is not lost on us. Your code might actually be so bad it broke "
        "the AI — or maybe the AI just couldn't handle the truth. Either way, "
        "try again in a moment. If it keeps failing, your code has achieved "
        "something remarkable: it's un-roastable. Not because it's good."
    ),
    categories={
        "code_quality": CategoryScore(score=0, comment="Could not evaluate. The AI fainted."),
        "naming_conventions": CategoryScore(score=0, comment="Unknown. The AI refused to look."),
        "error_handling": CategoryScore(score=0, comment="Ironic, given our error right now."),
        "architecture": CategoryScore(score=0, comment="A mystery wrapped in a stack trace."),
        "documentation": CategoryScore(score=0, comment="At least document your apology."),
    },
    savage_quote="Even the AI gave up. Let that sink in.",
    one_good_thing="You broke an AI. That takes talent.",
)


def _build_system_prompt(brutality: int) -> str:
    name, persona = BRUTALITY_PERSONAS[brutality]
    return (
        f"You are '{name}', a code roaster.\n\n"
        f"Persona: {persona}\n\n"
        "You will receive source code files from a GitHub repository. "
        "Analyze the code and produce a roast.\n\n"
        "CRITICAL INSTRUCTIONS:\n"
        "1. Respond with ONLY valid JSON. No markdown fences. No preamble. No trailing text.\n"
        "2. The JSON must match this exact schema:\n"
        "{\n"
        '  "overall_score": <int 0-100>,\n'
        '  "grade": <one of: "S","A","A-","B+","B","B-","C+","C","C-","D+","D","D-","F">,\n'
        '  "headline": "<one-liner under 12 words>",\n'
        '  "roast": "<full roast, 3 to 5 paragraphs, technically grounded, persona-accurate>",\n'
        '  "categories": {\n'
        '    "code_quality":       {"score": <0-100>, "comment": "<one punchy sentence>"},\n'
        '    "naming_conventions": {"score": <0-100>, "comment": "<one punchy sentence>"},\n'
        '    "error_handling":     {"score": <0-100>, "comment": "<one punchy sentence>"},\n'
        '    "architecture":       {"score": <0-100>, "comment": "<one punchy sentence>"},\n'
        '    "documentation":      {"score": <0-100>, "comment": "<one punchy sentence>"}\n'
        "  },\n"
        '  "savage_quote": "<the single most brutal tweetable line, under 140 chars>",\n'
        '  "one_good_thing": "<one genuine compliment>"\n'
        "}\n\n"
        "3. overall_score and grade must be consistent with the grading scale:\n"
        "   S=95-100, A=90-94, A-=80-89, B+=75-79, B=70-74, B-=65-69,\n"
        "   C+=60-64, C=55-59, C-=50-54, D+=45-49, D=40-44, D-=35-39, F=0-34\n"
        "4. All five categories must be present with exactly those keys.\n"
        "5. Output raw JSON only. No explanation before or after."
    )


def _build_user_prompt(files: list[tuple[str, str]]) -> str:
    parts: list[str] = ["Here are the source files from the repository:\n"]
    for filename, content in files:
        parts.append(f"--- FILE: {filename} ---")
        parts.append(content)
        parts.append("")
    parts.append("Now roast this code. Respond with JSON only.")
    return "\n".join(parts)


async def _call_groq(
    files: list[tuple[str, str]],
    brutality: int,
) -> str:
    client = AsyncGroq(api_key=os.getenv("GROQ_API_KEY"))
    response = await client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": _build_system_prompt(brutality)},
            {"role": "user", "content": _build_user_prompt(files)},
        ],
        temperature=0.8,
        max_tokens=4096,
        response_format={"type": "json_object"},
    )
    return response.choices[0].message.content


async def get_roast(
    files: list[tuple[str, str]],
    brutality: int,
) -> RoastResponse:
    for attempt in range(2):
        try:
            raw = await _call_groq(files, brutality)
            data = json.loads(raw)
            data["roast_id"] = ""
            return RoastResponse(**data)
        except (json.JSONDecodeError, ValidationError) as exc:
            logger.warning(f"Roast attempt {attempt + 1} failed parsing: {exc}")
            if attempt == 1:
                return FALLBACK_ROAST
        except Exception as exc:
            logger.error(f"Roast attempt {attempt + 1} failed with error: {exc}")
            if attempt == 1:
                raise
    return FALLBACK_ROAST
