"""Pydantic schemas for appointment request/response validation."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

AppointmentStatus = Literal["scheduled", "completed", "cancelled"]
AppointmentPriority = Literal["low", "normal", "urgent"]


class AppointmentBase(BaseModel):
    patient_name: str = Field(min_length=1, max_length=120)
    doctor_name: str = Field(min_length=1, max_length=120)
    department: str = Field(default="General", max_length=80)
    reason: str = Field(default="", max_length=2000)
    appointment_time: datetime
    status: AppointmentStatus = "scheduled"
    priority: AppointmentPriority = "normal"


class AppointmentCreate(AppointmentBase):
    pass


class AppointmentUpdate(BaseModel):
    patient_name: str | None = Field(default=None, min_length=1, max_length=120)
    doctor_name: str | None = Field(default=None, min_length=1, max_length=120)
    department: str | None = Field(default=None, max_length=80)
    reason: str | None = Field(default=None, max_length=2000)
    appointment_time: datetime | None = None
    status: AppointmentStatus | None = None
    priority: AppointmentPriority | None = None


class AppointmentOut(AppointmentBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime


class StatsOut(BaseModel):
    total: int
    scheduled: int
    completed: int
    cancelled: int
    today: int
