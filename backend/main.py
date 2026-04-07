import os
import uuid
import time
import logging
from collections import defaultdict

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, Response
from fastapi.middleware.cors import CORSMiddleware

from models import RoastRequest, RoastResponse, ErrorResponse
from github_fetcher import fetch_repo_files, RepoNotFoundError
from roaster import get_roast
from card_generator import generate_card

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="AI Roast My Code")

# --- CORS ---
allow_origins = [os.getenv("FRONTEND_URL", "*")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- In-memory stores ---
roast_store: dict[str, RoastResponse] = {}

# NOTE: This rate limiter is in-memory and resets on process restart.
# On Render free tier, cold starts will reset it. This is best-effort,
# not a security guarantee. For real rate limiting, use Redis or Upstash.
rate_limit_store: dict[str, list[float]] = defaultdict(list)
RATE_LIMIT_MAX = 5
RATE_LIMIT_WINDOW = 60  # seconds


def _get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _is_rate_limited(ip: str) -> bool:
    now = time.time()
    timestamps = rate_limit_store[ip]
    rate_limit_store[ip] = [t for t in timestamps if now - t < RATE_LIMIT_WINDOW]
    if len(rate_limit_store[ip]) >= RATE_LIMIT_MAX:
        return True
    rate_limit_store[ip].append(now)
    return False


# --- Routes ---


@app.get("/health")
async def health() -> dict:
    return {"status": "alive", "model": "llama-3.3-70b-versatile"}


@app.post("/api/roast")
async def roast_repo(body: RoastRequest, request: Request) -> JSONResponse:
    client_ip = _get_client_ip(request)
    if _is_rate_limited(client_ip):
        return JSONResponse(
            status_code=429,
            content=ErrorResponse(
                error="rate_limited",
                message="Slow down. Even bad code deserves a moment.",
            ).model_dump(),
        )

    try:
        files = await fetch_repo_files(body.repo_url)
    except ValueError as exc:
        msg = str(exc)
        if "Invalid GitHub URL" in msg:
            return JSONResponse(
                status_code=422,
                content=ErrorResponse(
                    error="invalid_url",
                    message="That's not a GitHub URL. Come on.",
                ).model_dump(),
            )
        if "No source files" in msg:
            return JSONResponse(
                status_code=422,
                content=ErrorResponse(
                    error="no_code_found",
                    message="No source files found. Nothing to roast.",
                ).model_dump(),
            )
        return JSONResponse(
            status_code=422,
            content=ErrorResponse(
                error="invalid_url",
                message=f"Bad request: {msg}",
            ).model_dump(),
        )
    except RepoNotFoundError:
        return JSONResponse(
            status_code=404,
            content=ErrorResponse(
                error="repo_not_found",
                message="Couldn't reach that repo. Is it public?",
            ).model_dump(),
        )
    except Exception as exc:
        logger.error(f"GitHub fetch failed: {exc}")
        return JSONResponse(
            status_code=503,
            content=ErrorResponse(
                error="llm_unavailable",
                message="Something broke while fetching the repo. Try again.",
            ).model_dump(),
        )

    try:
        result = await get_roast(files, body.brutality)
    except Exception as exc:
        logger.error(f"Groq API failed: {exc}")
        return JSONResponse(
            status_code=503,
            content=ErrorResponse(
                error="llm_unavailable",
                message="The roasting engine is down. Try again.",
            ).model_dump(),
        )

    roast_id = str(uuid.uuid4())
    result.roast_id = roast_id
    roast_store[roast_id] = result

    return JSONResponse(status_code=200, content=result.model_dump())


@app.get("/api/card/{roast_id}")
async def get_card(roast_id: str) -> Response:
    roast = roast_store.get(roast_id)
    if not roast:
        return JSONResponse(
            status_code=404,
            content=ErrorResponse(
                error="card_not_found",
                message="That roast has expired or never existed.",
            ).model_dump(),
        )

    png_bytes = generate_card(roast)
    return Response(content=png_bytes, media_type="image/png")
