#!/bin/bash
sed -i '414,414d' components/Layout.tsx
sed -i '425i\
                  {!isAdmin && !isOperator && !isHeadmaster && (notifications.length > 0 || waliNotifications.length > 0) && (\
' components/Layout.tsx
