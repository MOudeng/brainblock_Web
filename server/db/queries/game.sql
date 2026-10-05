-- name: CreateGameSession :one
INSERT INTO game_sessions (
    participant_id, event_id, device_id, score, level_reached, start_time, end_time
) VALUES (
    $1, $2, $3, $4, $5, $6, $7
)
RETURNING *;

-- name: ListLeaderboardByEvent :many
SELECT p.uid, p.name, gs.score, gs.level_reached, gs.start_time, gs.end_time
FROM game_sessions gs
JOIN participants p ON gs.participant_id = p.id
WHERE gs.event_id = $1
ORDER BY gs.score DESC, (gs.end_time - gs.start_time) ASC;
