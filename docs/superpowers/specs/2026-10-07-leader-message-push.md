# Leader message notifications

Approved in chat: active admins and coaches of the player's team may opt into notifications for new player messages. Every recipient has independent read status and app badge. One leader reading or replying never clears another leader's unread state. Leader messages notify the player only, never other leaders. Notifications contain generic text and open the correct player's chat after authentication and RLS validation.

Reuse device ownership, activation, preference timestamps and existing read receipts. Leaders get message notifications only; player post preferences stay unchanged. Do not enable general player delivery. Introduce an independent disabled-by-default leader delivery switch, activated only after frontend publication. Pending/readable eligibility is rechecked at delivery against current active roles, player roster and team. Account switching must remain safe.
