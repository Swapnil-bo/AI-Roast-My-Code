from pydantic import BaseModel, Field
from typing import Literal


class RoastRequest(BaseModel):
    repo_url: str
    brutality: int = Field(ge=1, le=5)


class CategoryScore(BaseModel):
    score: int = Field(ge=0, le=100)
    comment: str


class RoastResponse(BaseModel):
    roast_id: str
    overall_score: int = Field(ge=0, le=100)
    grade: Literal[
        "S", "A", "A-", "B+", "B", "B-",
        "C+", "C", "C-", "D+", "D", "D-", "F"
    ]
    headline: str
    roast: str
    categories: dict[str, CategoryScore]
    savage_quote: str
    one_good_thing: str


class ErrorResponse(BaseModel):
    error: str
    message: str
