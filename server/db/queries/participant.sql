-- name: CreateParticipant :one
INSERT INTO participants (
    uid, event_id, name, age, gender
) VALUES (
    $1, $2, $3, $4, $5
)
RETURNING *;

-- name: GetParticipantByUID :one
SELECT * FROM participants
WHERE uid = $1 AND event_id = $2 LIMIT 1;

-- name: ListParticipantsByEvent :many
SELECT * FROM participants
WHERE event_id = $1
ORDER BY created_at DESC;
