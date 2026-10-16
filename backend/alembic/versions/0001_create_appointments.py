"""Initial CareDesk migration: creates the appointments table with seed rows.

Uses plain INSERT ... VALUES with bound parameters (no date-interval casting)
so the same migration runs on PostgreSQL (production) and SQLite (tests).
"""

from collections.abc import Sequence
from datetime import datetime, timedelta, timezone

from alembic import op
import sqlalchemy as sa

revision: str = "0001_create_appointments"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

SEED_ROWS = [
    ("Aarav Sharma", "Dr. Nisha Rao", "Cardiology", "Chest pain follow-up", 1, "scheduled", "urgent"),
    ("Priya Menon", "Dr. Arjun Patel", "Dermatology", "Skin rash review", 1, "scheduled", "normal"),
    ("Rahul Verma", "Dr. Kavya Iyer", "Orthopedics", "Knee pain evaluation", 2, "scheduled", "normal"),
    ("Sneha Kulkarni", "Dr. Vikram Nair", "Pediatrics", "Child vaccination", 0, "completed", "low"),
    ("Amit Joshi", "Dr. Nisha Rao", "Cardiology", "ECG review", 0, "completed", "normal"),
    ("Divya Reddy", "Dr. Sara Khan", "Ophthalmology", "Annual eye checkup", 3, "scheduled", "low"),
    ("Karan Malhotra", "Dr. Arjun Patel", "General", "Annual physical exam", 5, "scheduled", "low"),
    ("Meera Nair", "Dr. Kavya Iyer", "Orthopedics", "Post-surgery review", 1, "cancelled", "normal"),
]


def upgrade() -> None:
    op.create_table(
        "appointments",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("patient_name", sa.String(length=120), nullable=False),
        sa.Column("doctor_name", sa.String(length=120), nullable=False),
        sa.Column("department", sa.String(length=80), nullable=False, server_default="General"),
        sa.Column("reason", sa.Text(), nullable=False, server_default=""),
        sa.Column("appointment_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="scheduled"),
        sa.Column("priority", sa.String(length=20), nullable=False, server_default="normal"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_appointments_status", "appointments", ["status"])
    # Seed clinic demo data so the dashboard renders immediately after deploy.
    now = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)
    conn = op.get_bind()
    for patient, doctor, dept, reason, day_offset, st, pri in SEED_ROWS:
        visit = now + timedelta(days=day_offset, hours=9)
        conn.execute(
            sa.text(
                "INSERT INTO appointments "
                "(patient_name, doctor_name, department, reason, appointment_time, "
                " status, priority, created_at) "
                "VALUES (:patient, :doctor, :dept, :reason, "
                "        :visit, :status, :priority, :now)"
            ).bindparams(
                patient=patient,
                doctor=doctor,
                dept=dept,
                reason=reason,
                visit=visit,
                status=st,
                priority=pri,
                now=now,
            )
        )


def downgrade() -> None:
    op.drop_index("ix_appointments_status", table_name="appointments")
    op.drop_table("appointments")
