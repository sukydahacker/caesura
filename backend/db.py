"""
Async PostgreSQL helper for Caesura backend (Supabase-hosted).

Wraps asyncpg to provide a MongoDB-like interface so the migration
from motor is as painless as possible.
"""

import os
import json
import asyncpg
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any

_pool: Optional[asyncpg.Pool] = None


async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        database_url = os.environ["DATABASE_URL"]
        _pool = await asyncpg.create_pool(database_url, min_size=2, max_size=10)
    return _pool


async def close_pool():
    global _pool
    if _pool:
        await _pool.close()
        _pool = None


def _row_to_dict(row: asyncpg.Record) -> dict:
    """Convert asyncpg Record to plain dict, serialising special types."""
    d = dict(row)
    for k, v in d.items():
        if isinstance(v, datetime):
            # keep as datetime — FastAPI/Pydantic handle serialisation
            pass
    return d


# ─── Generic helpers ──────────────────────────────────────────────────────────

async def fetch_one(query: str, *args) -> Optional[dict]:
    pool = await get_pool()
    row = await pool.fetchrow(query, *args)
    return _row_to_dict(row) if row else None


async def fetch_all(query: str, *args) -> List[dict]:
    pool = await get_pool()
    rows = await pool.fetch(query, *args)
    return [_row_to_dict(r) for r in rows]


async def fetch_val(query: str, *args):
    pool = await get_pool()
    return await pool.fetchval(query, *args)


async def execute(query: str, *args) -> str:
    pool = await get_pool()
    return await pool.execute(query, *args)


def to_jsonb(obj) -> str:
    """Serialise a Python object to a JSON string for JSONB columns."""
    if obj is None:
        return None
    if isinstance(obj, str):
        return obj
    return json.dumps(obj, default=str)
