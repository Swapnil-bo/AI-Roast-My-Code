import re
import os
import logging
import asyncio

import httpx

logger = logging.getLogger(__name__)

MAX_FILES = 8
MAX_LINES = 300
PER_FILE_TIMEOUT = 15.0

INCLUDE_EXTENSIONS: set[str] = {
    ".py", ".js", ".ts", ".jsx", ".tsx", ".go", ".java",
    ".cpp", ".c", ".cs", ".rs", ".rb", ".swift", ".kt", ".php",
}

EXCLUDE_PATTERNS: set[str] = {
    "node_modules", ".git", "dist", "build", "__pycache__",
    "venv", ".venv", "vendor", "target",
}

EXCLUDE_FILENAMES: set[str] = {
    "package-lock.json",
}

PRIORITY_NAMES: set[str] = {
    "main", "index", "app", "server", "router",
}

_GITHUB_URL_RE = re.compile(
    r"^https?://github\.com/(?P<owner>[^/]+)/(?P<repo>[^/.]+)(?:\.git)?/?$"
)


class RepoNotFoundError(Exception):
    pass


def _build_headers() -> dict[str, str]:
    headers: dict[str, str] = {"Accept": "application/vnd.github+json"}
    token = os.getenv("GITHUB_TOKEN")
    if token:
        headers["Authorization"] = f"Bearer {token}"
    else:
        logger.warning(
            "WARNING: No GITHUB_TOKEN set. "
            "Rate limit is 60 req/hr shared across ALL users."
        )
    return headers


def parse_github_url(url: str) -> tuple[str, str]:
    match = _GITHUB_URL_RE.match(url.strip())
    if not match:
        raise ValueError(
            f"Invalid GitHub URL: {url}. "
            "Expected https://github.com/owner/repo"
        )
    return match.group("owner"), match.group("repo")


async def _fetch_default_branch(
    client: httpx.AsyncClient,
    owner: str,
    repo: str,
    headers: dict[str, str],
) -> str:
    resp = await client.get(
        f"https://api.github.com/repos/{owner}/{repo}",
        headers=headers,
    )
    if resp.status_code == 404:
        raise RepoNotFoundError(f"Repository {owner}/{repo} not found or is private.")
    resp.raise_for_status()
    return resp.json()["default_branch"]


async def _fetch_tree(
    client: httpx.AsyncClient,
    owner: str,
    repo: str,
    branch: str,
    headers: dict[str, str],
) -> list[dict]:
    resp = await client.get(
        f"https://api.github.com/repos/{owner}/{repo}/git/trees/{branch}?recursive=1",
        headers=headers,
    )
    if resp.status_code == 404:
        raise RepoNotFoundError(f"Repository {owner}/{repo} not found or is private.")
    resp.raise_for_status()
    data = resp.json()
    if data.get("truncated"):
        logger.warning(f"Tree for {owner}/{repo} was truncated. Continuing with partial results.")
    return data.get("tree", [])


def _should_exclude(path: str) -> bool:
    if os.path.basename(path) in EXCLUDE_FILENAMES:
        return True
    if path.endswith((".lock", ".min.js", ".min.css")):
        return True
    parts = path.split("/")
    for part in parts:
        if part in EXCLUDE_PATTERNS:
            return True
    return False


def _has_valid_extension(path: str) -> bool:
    _, ext = os.path.splitext(path)
    return ext.lower() in INCLUDE_EXTENSIONS


def _priority_key(path: str) -> tuple[int, str]:
    is_root = 0 if "/" not in path else 1
    stem = os.path.splitext(os.path.basename(path))[0].lower()
    is_priority_name = 0 if stem in PRIORITY_NAMES else 1
    is_test_or_config = 1 if any(
        marker in path.lower()
        for marker in ("test", "spec", "config", "conf", ".config")
    ) else 0
    return (is_root, is_priority_name, is_test_or_config, path)


def _select_files(tree: list[dict]) -> list[str]:
    candidates: list[str] = []
    for item in tree:
        if item.get("type") != "blob":
            continue
        path = item["path"]
        if _should_exclude(path):
            continue
        if not _has_valid_extension(path):
            continue
        candidates.append(path)

    candidates.sort(key=_priority_key)
    return candidates[:MAX_FILES]


def _truncate_content(content: str) -> str:
    lines = content.split("\n")
    if len(lines) > MAX_LINES:
        lines = lines[:MAX_LINES]
        lines.append("# [TRUNCATED]")
    return "\n".join(lines)


async def _fetch_single_file(
    client: httpx.AsyncClient,
    owner: str,
    repo: str,
    branch: str,
    path: str,
) -> str:
    resp = await client.get(
        f"https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}",
        timeout=PER_FILE_TIMEOUT,
    )
    resp.raise_for_status()
    return _truncate_content(resp.text)


async def _fetch_all_files(
    client: httpx.AsyncClient,
    owner: str,
    repo: str,
    branch: str,
    file_paths: list[str],
) -> list[tuple[str, str]]:
    tasks = [
        _fetch_single_file(client, owner, repo, branch, path)
        for path in file_paths
    ]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    files: list[tuple[str, str]] = []
    for path, result in zip(file_paths, results):
        if isinstance(result, Exception):
            logger.warning(f"Failed to fetch {path}: {result}")
            continue
        files.append((path, result))
    return files


async def fetch_repo_files(repo_url: str) -> list[tuple[str, str]]:
    owner, repo = parse_github_url(repo_url)
    headers = _build_headers()

    async with httpx.AsyncClient(timeout=15.0) as client:
        branch = await _fetch_default_branch(client, owner, repo, headers)
        tree = await _fetch_tree(client, owner, repo, branch, headers)
        selected = _select_files(tree)

        if not selected:
            raise ValueError("No source files found in repository.")

        files = await _fetch_all_files(client, owner, repo, branch, selected)

    if not files:
        raise ValueError("No source files could be fetched from repository.")

    return files
