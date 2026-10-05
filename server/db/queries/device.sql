-- name: CreateDevice :one
INSERT INTO devices (
    event_id, name, status
) VALUES (
    $1, $2, $3
)
RETURNING *;

-- name: GetDeviceByID :one
SELECT * FROM devices
WHERE id = $1 LIMIT 1;

-- name: UpdateDeviceStatus :exec
UPDATE devices
SET status = $2, updated_at = CURRENT_TIMESTAMP
WHERE id = $1;

-- name: ListDevicesByEvent :many
SELECT * FROM devices
WHERE event_id = $1
ORDER BY created_at ASC;
