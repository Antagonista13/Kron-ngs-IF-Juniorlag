# Utveckling 2.0 execution note

This branch implements the first green slice of Juniorlag 2.0: bidirectional development unread state.

Scope:
- player-originated goal, focus and self-assessment changes notify active Admin/Coach recipients;
- existing Coach-to-player visible follow-ups and goal proposals keep notifying the player;
- bottom navigation shows unread state for either direction;
- Coach worklist marks the affected player with `NYTT`;
- exact goal, focus, follow-up or proposal content is highlighted until that recipient reads the exact item;
- Parent accounts remain outside personal development notifications;
- leader-only notes remain private and create no player notification.

The implementation deliberately does not include push notifications, statistics, staff management, news editing or calendar management; those remain later Juniorlag 2.0 slices.
