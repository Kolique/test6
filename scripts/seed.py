"""Seed script: creates a test tenant and user for development.

Usage:
    cd backend
    python -m scripts.seed

Or from project root:
    python scripts/seed.py
"""

import asyncio
import sys
import os

# Add backend to path so imports work from project root
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.core.security import hash_password
from app.models.database import async_session, Tenant, User


async def seed():
    async with async_session() as db:
        # Create test tenant
        tenant = Tenant(
            name="Mairie de Saint-Exemple",
            slug="saint-exemple",
            primary_color="#0055A4",
            contact_email="contact@saint-exemple.fr",
            contact_phone="01 23 45 67 89",
            website_url="https://www.saint-exemple.fr",
            log_conversations=False,
        )
        db.add(tenant)
        await db.flush()

        # Create test user
        user = User(
            tenant_id=tenant.id,
            email="admin@saint-exemple.fr",
            hashed_password=hash_password("mairia2024"),
            full_name="Jean Dupont",
        )
        db.add(user)
        await db.commit()

        print(f"Tenant cree : {tenant.name} (id: {tenant.id})")
        print(f"User cree   : {user.email} (id: {user.id})")
        print(f"Mot de passe: mairia2024")
        print(f"Tenant ID   : {tenant.id}")


if __name__ == "__main__":
    asyncio.run(seed())
