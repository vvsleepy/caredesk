"""Seed rows so the CareDesk dashboard is never empty on first boot."""

from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Appointment

SEED = [
    ("Aarav Sharma", "Dr. Nisha Rao", "Cardiology", "Chest pain follow-up", 1, "scheduled", "urgent"),
    ("Priya Menon", "Dr. Arjun Patel", "Dermatology", "Skin rash consultation", 1, "scheduled", "normal"),
    ("Rahul Verma", "Dr. Kavya Iyer", "Orthopedics", "Knee pain evaluation", 2, "scheduled", "normal"),
    ("Sneha Kulkarni", "Dr. Vikram Nair", "Pediatrics", "Child vaccination", 0, "completed", "low"),
    ("Amit Joshi", "Dr. Nisha Rao", "Cardiology", "ECG review", 0, "completed", "normal"),
    ("Divya Reddy", "Dr. Sara Khan", "Ophthalmology", "Eye checkup", 3, "scheduled", "low"),
    ("Karan Malhotra", "Dr. Arjun Patel", "General", "Annual physical exam", 5, "scheduled", "low"),
    ("Meera Nair", "Dr. Kavya Iyer", "Orthopedics", "Post-surgery review", 1, "cancelled", "normal"),
]


def seed_if_empty(db: Session) -> int:
    existing = db.scalar(select(func.count(Appointment.id)))
    if existing:
        return 0
    now = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)
    for patient, doctor, dept, reason, day_offset, st, pri in SEED:
        db.add(
            Appointment(
                patient_name=patient,
                doctor_name=doctor,
                department=dept,
                reason=reason,
                appointment_time=now + timedelta(days=day_offset, hours=9),
                status=st,
                priority=pri,
            )
        )
    db.commit()
    return len(SEED)
