from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.ai.bedrock import BedrockUnavailable, generate_reply

router = APIRouter(prefix="/api/v1/chat", tags=["AI Assistant"])


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)


class ChatResponse(BaseModel):
    reply: str


@router.post("", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    message = request.message.strip()
    if not message:
        raise HTTPException(status_code=422, detail="Message cannot be empty.")

    try:
        reply = await generate_reply(message)
        return ChatResponse(reply=reply)
    except BedrockUnavailable:
        raise HTTPException(
            status_code=503,
            detail=(
                "The AI assistant is temporarily unavailable. "
                "Check Bedrock model access and AWS permissions."
            ),
        ) from None
