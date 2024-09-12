export const friendRequestReceived = (contactUserName: string) => ({
  title: `New Friend Request Received`,
  body: `You have received a friend request from ${contactUserName}. Click to view and accept.`,
});

export const friendRequestAccepted = (contactUserName: string) => ({
  title: `Friend Request Accepted`,
  body: `Great news! ${contactUserName} has accepted your friend request. Now you can stay connected!`,
});

export const friendRequestRejected = (contactUserName: string) => ({
  title: `Friend Request Rejected`,
  body: `Sorry, ${contactUserName} has declined your friend request. Don't worry, there are plenty of connections to make!`,
});

export const textMessageReceived = (contactUserName: string, message: string) => ({
  title: contactUserName,
  body: message,
});

export const friendRequestSent = (contactUserName: string) => `Hey there! You've sent a friend request to ${contactUserName}. Stay tuned for their response!`;

