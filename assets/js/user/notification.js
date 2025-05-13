// Function to fetch and display notifications for the user
async function fetchNotifications() {
  const localUser = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = localUser.userId;

  if (!userId) {
    console.error("User ID is missing or invalid.");
    return;
  }

  try {
    const response = await fetch(`http://178.16.137.180:8080/api/notifications/${userId}`);
    if (!response.ok) throw new Error('Network response was not ok');

    const notifications = await response.json();
    console.log("Fetched notifications:", notifications);

    const notificationList = document.getElementById("notificationList");
    if (notificationList) {
      notificationList.innerHTML = ""; // Clear previous notifications
    }

    let unreadCount = 0;

    notifications.forEach(notification => {
      if (!notification.read) unreadCount++;

      if (notificationList) {
        const notificationItem = document.createElement("li");
        notificationItem.classList.add(notification.read ? 'read' : 'unread');
        notificationItem.innerHTML = getNotificationTemplate(notification);

        // Add click event to mark as read
        notificationItem.addEventListener("click", async () => {
          try {
            const response = await fetch(`http://178.16.137.180:8080/api/notifications/${notification.id}/read`, {
              method: 'PUT',
            });

            if (response.ok) {
              notificationItem.classList.remove('unread');
              notificationItem.classList.add('read');
              updateNotificationCount(0); // Reset unread count to 0
            } else {
              console.error("Failed to mark notification as read");
            }
          } catch (error) {
            console.error("Error marking notification as read:", error);
          }
        });

        // 👇 Insert new notification at the top
        notificationList.prepend(notificationItem);
      }
    });

    updateNotificationCount(unreadCount);

  } catch (error) {
    console.error("Error fetching notifications:", error);
  }
}

// Function to generate the notification template
function getNotificationTemplate(notification) {
  if (!notification) return "<li>Error: Notification is undefined</li>";

  // Safe date parsing
  let dateOnly = "Invalid date";
  if (notification.createdAt) {
    const date = new Date(notification.createdAt);
    if (!isNaN(date.getTime())) {
      dateOnly = date.toISOString().split("T")[0];
    }
  }

  return `
    <strong>${!notification.read ? '[New] ' : ''}</strong>${notification.message}
    <br>
    <small>${dateOnly}</small>
  `;
}

// Function to update notification count on the button
function updateNotificationCount(count, shouldReset = false) {
  const button = document.querySelector("button[onclick*='ViewNotification']");
  if (!button) return;

  let badge = button.querySelector(".notification-count");

  if (!badge) {
    badge = document.createElement("span");
    badge.classList.add("notification-count");
    badge.style.cssText = `
      position: absolute;
      top: 5px;
      right: 10px;
      background-color: red;
      color: white;
      border-radius: 50%;
      padding: 2px 6px;
      font-size: 12px;
    `;
    button.style.position = "relative";
    button.appendChild(badge);
  }

  if (shouldReset) {
    badge.textContent = "0";
    badge.style.display = "none";
    return;
  }

  if (count > 0) {
    badge.textContent = count;
    badge.style.display = "inline-block";
  } else {
    badge.style.display = "none";
  }
}

// Run on page load
window.addEventListener("DOMContentLoaded", fetchNotifications);
