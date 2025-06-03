"""
Revision ID: c9a12345b678
Revises: d5fed7afe023
Create Date: 2025-06-02 00:00:00.000000
"""
from alembic import op

down_revision = 'd5fed7afe023'
revision = 'c9a12345b678'
branch_labels = None
depends_on = None

def upgrade():
    # Convert existing lowercase statuses to uppercase to match the new enum values
    op.execute(
        "UPDATE evaluations SET status = UPPER(status) WHERE status IN ('in_progress','completed','on_hold');"
    )

def downgrade():
    # Revert uppercase statuses back to lowercase
    op.execute(
        "UPDATE evaluations SET status = LOWER(status) WHERE status IN ('IN_PROGRESS','COMPLETED','ON_HOLD');"
    ) 