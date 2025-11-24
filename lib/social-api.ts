// This file handles the actual HTTP calls to Facebook and Google APIs

export async function deleteFromSocialMedia(
  platform: 'facebook' | 'youtube',
  externalId: string,
  accessToken: string
) {
  if (!accessToken) {
    console.warn(`[${platform}] No access token provided. Skipping DELETE action.`);
    return;
  }

  try {
    if (platform === 'facebook') {
      // Facebook Graph API: DELETE /{comment-id}
      const response = await fetch(`https://graph.facebook.com/v19.0/${externalId}?access_token=${accessToken}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error(await response.text());
    } 
    
    else if (platform === 'youtube') {
      // YouTube Data API: DELETE /comments?id={id}
      // Note: "externalId" must be the specific comment ID
      const response = await fetch(`https://www.googleapis.com/youtube/v3/comments?id=${externalId}&key=${process.env.YOUTUBE_API_KEY}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`, // OAuth token required for deletion
        }
      });
      if (!response.ok) throw new Error(await response.text());
    }

    console.log(`[${platform}] Successfully DELETED comment ${externalId}`);
  } catch (error) {
    console.error(`[${platform}] Failed to DELETE comment:`, error);
    // We don't throw here because we don't want to crash the whole webhook if external API fails
  }
}

export async function replyToSocialMedia(
  platform: 'facebook' | 'youtube',
  externalId: string,
  message: string,
  accessToken: string
) {
  if (!accessToken) {
    console.warn(`[${platform}] No access token provided. Skipping REPLY action.`);
    return;
  }

  try {
    if (platform === 'facebook') {
      // Facebook Graph API: POST /{comment-id}/comments
      const response = await fetch(`https://graph.facebook.com/v19.0/${externalId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message,
          access_token: accessToken,
        }),
      });
      if (!response.ok) throw new Error(await response.text());
    } 
    
    else if (platform === 'youtube') {
      // YouTube Data API: POST /comments (Reply to a comment thread)
      // Note: YouTube replies are "inserts" into a parent comment
      const response = await fetch(`https://www.googleapis.com/youtube/v3/comments?part=snippet`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          snippet: {
            parentId: externalId,
            textOriginal: message,
          },
        }),
      });
      if (!response.ok) throw new Error(await response.text());
    }

    console.log(`[${platform}] Successfully REPLIED to ${externalId}`);
  } catch (error) {
    console.error(`[${platform}] Failed to REPLY:`, error);
  }
}