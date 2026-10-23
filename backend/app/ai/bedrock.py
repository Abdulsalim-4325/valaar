import asyncio
import os

import boto3
from botocore.exceptions import BotoCoreError, ClientError

from app.core.config import get_settings


class BedrockUnavailable(Exception):
    """Raised when Amazon Bedrock cannot complete a chat request."""


async def generate_reply(message: str) -> str:
    settings = get_settings()
    profile = os.getenv("AWS_PROFILE")

    def invoke() -> str:
        session = boto3.Session(
            profile_name=profile if profile else None,
            region_name=settings.bedrock_region,
        )
        client = session.client("bedrock-runtime")
        response = client.converse(
            modelId=settings.bedrock_model_id,
            messages=[
                {
                    "role": "user",
                    "content": [{"text": message}],
                }
            ],
            inferenceConfig={
                "maxTokens": 700,
                "temperature": 0.4,
            },
        )
        return response["output"]["message"]["content"][0]["text"]

    try:
        return await asyncio.to_thread(invoke)
    except (BotoCoreError, ClientError) as exc:
        # Keep provider details in server logs, not in API responses.
        print(f"Bedrock request failed: {type(exc).__name__}")
        raise BedrockUnavailable from exc
