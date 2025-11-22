export async function addVercelDomain(
  domain: string,
  projectId: string,
  teamId?: string
): Promise<{ success: boolean; error?: string }> {
  const vercelToken = process.env.VERCEL_TOKEN;
  if (!vercelToken) {
    return { success: false, error: "VERCEL_TOKEN not configured" };
  }

  try {
    const url = teamId
      ? `https://api.vercel.com/v10/projects/${projectId}/domains?teamId=${teamId}`
      : `https://api.vercel.com/v10/projects/${projectId}/domains`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${vercelToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: domain,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (response.ok) {
      return { success: true };
    }

    if (
      response.status === 409 ||
      data.error?.code === "domain_already_in_use"
    ) {
      return { success: true };
    }

    return {
      success: false,
      error:
        data.error?.message || `Failed to add domain: ${response.statusText}`,
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Error adding domain: ${err.message}`,
    };
  }
}

export async function removeVercelDomain(
  domain: string,
  projectId: string,
  teamId?: string
): Promise<{ success: boolean; error?: string }> {
  const vercelToken = process.env.VERCEL_TOKEN;
  if (!vercelToken) {
    return { success: false, error: "VERCEL_TOKEN not configured" };
  }

  try {
    const url = teamId
      ? `https://api.vercel.com/v9/projects/${projectId}/domains/${domain}?teamId=${teamId}`
      : `https://api.vercel.com/v9/projects/${projectId}/domains/${domain}`;

    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${vercelToken}`,
      },
    });

    if (response.ok || response.status === 404) {
      return { success: true };
    }

    const data = await response.json().catch(() => ({}));
    return {
      success: false,
      error:
        data.error?.message ||
        `Failed to remove domain: ${response.statusText}`,
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Error removing domain: ${err.message}`,
    };
  }
}
