-- name: CreateEvent :one
INSERT INTO events (
    name, date, venue, organizer_id, device_count, is_private, password
) VALUES (
    $1, $2, $3, $4, $5, $6, $7
)
RETURNING *;

-- name: GetEventByID :one
SELECT * FROM events
WHERE id = $1 LIMIT 1;

-- name: ListEvents :many
SELECT * FROM events
ORDER BY date DESC;

-- name: UpdateEvent :one
UPDATE events
SET name = $2, date = $3, venue = $4, device_count = $5, is_private = $6, password = $7, updated_at = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING *;

-- name: DeleteEvent :exec
DELETE FROM events
WHERE id = $1;
