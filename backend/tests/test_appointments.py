"""CareDesk API tests: health, CRUD, filtering, stats and error paths."""


def test_root_returns_service_info(client):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["service"] == "CareDesk API"


def test_health_is_cheap_liveness(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_ready_reports_database_status(client):
    response = client.get("/ready")
    assert response.status_code == 200
    assert response.json()["status"] == "READY"


def test_create_appointment(client, sample_payload):
    response = client.post("/api/appointments", json=sample_payload)
    assert response.status_code == 201
    body = response.json()
    assert body["patient_name"] == "Test Patient"
    assert body["status"] == "scheduled"
    assert body["id"] > 0


def test_list_appointments_includes_created(client, sample_payload):
    client.post("/api/appointments", json=sample_payload)
    response = client.get("/api/appointments")
    assert response.status_code == 200
    assert len(response.json()) >= 1


def test_filter_appointments_by_status(client, sample_payload):
    client.post("/api/appointments", json=sample_payload)
    done = dict(sample_payload, status="completed", patient_name="Done Patient")
    client.post("/api/appointments", json=done)
    response = client.get("/api/appointments", params={"status": "completed"})
    assert response.status_code == 200
    assert all(item["status"] == "completed" for item in response.json())


def test_get_appointment_by_id(client, sample_payload):
    created = client.post("/api/appointments", json=sample_payload).json()
    response = client.get(f"/api/appointments/{created['id']}")
    assert response.status_code == 200
    assert response.json()["doctor_name"] == "Dr. Test Doctor"


def test_update_appointment_status(client, sample_payload):
    created = client.post("/api/appointments", json=sample_payload).json()
    response = client.put(
        f"/api/appointments/{created['id']}", json={"status": "completed", "priority": "urgent"}
    )
    assert response.status_code == 200
    assert response.json()["status"] == "completed"
    assert response.json()["priority"] == "urgent"


def test_delete_appointment(client, sample_payload):
    created = client.post("/api/appointments", json=sample_payload).json()
    response = client.delete(f"/api/appointments/{created['id']}")
    assert response.status_code == 204
    assert client.get(f"/api/appointments/{created['id']}").status_code == 404


def test_get_missing_appointment_returns_404(client):
    response = client.get("/api/appointments/999999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Appointment not found"


def test_create_rejects_invalid_status(client, sample_payload):
    bad = dict(sample_payload, status="someday")
    response = client.post("/api/appointments", json=bad)
    assert response.status_code == 422


def test_stats_counts_by_status(client, sample_payload):
    client.post("/api/appointments", json=sample_payload)
    client.post("/api/appointments", json=dict(sample_payload, status="completed"))
    response = client.get("/api/appointments/stats")
    assert response.status_code == 200
    body = response.json()
    assert body["total"] >= 2
    assert body["scheduled"] >= 1
    assert body["completed"] >= 1
