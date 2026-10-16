"""Appointments CRUD router: list/filter, stats, get, create, update, delete."""

from datetime import datetime, time, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Appointment
from app.schemas import AppointmentCreate, AppointmentOut, AppointmentUpdate, StatsOut

router = APIRouter(prefix="/api/appointments", tags=["appointments"])

VALID_STATUSES = ("scheduled", "completed", "cancelled")


@router.get("", response_model=list[AppointmentOut])
def list_appointments(
    status_filter: str | None = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
) -> list[Appointment]:
    query = select(Appointment).order_by(Appointment.appointment_time.asc())
    if status_filter:
        if status_filter not in VALID_STATUSES:
            raise HTTPException(status_code=422, detail=f"Invalid status '{status_filter}'")
        query = query.where(Appointment.status == status_filter)
    return list(db.scalars(query).all())


@router.get("/stats", response_model=StatsOut)
def appointment_stats(db: Session = Depends(get_db)) -> StatsOut:
    rows = db.execute(
        select(Appointment.status, func.count(Appointment.id)).group_by(Appointment.status)
    ).all()
    counts = {row[0]: row[1] for row in rows}
    total = sum(counts.values())
    start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    end = datetime.combine(start.date(), time.max, tzinfo=timezone.utc)
    today = db.scalar(
        select(func.count(Appointment.id)).where(
            Appointment.appointment_time >= start, Appointment.appointment_time <= end
        )
    ) or 0
    return StatsOut(
        total=total,
        scheduled=counts.get("scheduled", 0),
        completed=counts.get("completed", 0),
        cancelled=counts.get("cancelled", 0),
        today=today,
    )


@router.get("/{appointment_id}", response_model=AppointmentOut)
def get_appointment(appointment_id: int, db: Session = Depends(get_db)) -> Appointment:
    appointment = db.get(Appointment, appointment_id)
    if appointment is None:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return appointment


@router.post("", response_model=AppointmentOut, status_code=status.HTTP_201_CREATED)
def create_appointment(payload: AppointmentCreate, db: Session = Depends(get_db)) -> Appointment:
    appointment = Appointment(**payload.model_dump())
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    return appointment


@router.put("/{appointment_id}", response_model=AppointmentOut)
def update_appointment(
    appointment_id: int, payload: AppointmentUpdate, db: Session = Depends(get_db)
) -> Appointment:
    appointment = db.get(Appointment, appointment_id)
    if appointment is None:
        raise HTTPException(status_code=404, detail="Appointment not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(appointment, field, value)
    db.commit()
    db.refresh(appointment)
    return appointment


@router.delete("/{appointment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_appointment(appointment_id: int, db: Session = Depends(get_db)) -> Response:
    appointment = db.get(Appointment, appointment_id)
    if appointment is None:
        raise HTTPException(status_code=404, detail="Appointment not found")
    db.delete(appointment)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
