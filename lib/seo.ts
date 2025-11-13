export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 30);
}

export function extractMetadataFromMarkdown(markdown: string): {
  title: string;
  description: string;
} {
  if (!markdown || markdown.trim().length === 0) {
    return {
      title: "",
      description: "",
    };
  }

  let title = "";
  const headingMatch = markdown.match(/^#\s+(.+)$/m);
  if (headingMatch) {
    title = headingMatch[1].trim();
  }

  let description = "";

  const lines = markdown.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (
      trimmed &&
      !trimmed.startsWith("#") &&
      !trimmed.startsWith("-") &&
      !trimmed.startsWith("*") &&
      !trimmed.startsWith("`") &&
      !trimmed.startsWith(">") &&
      !trimmed.match(/^\d+\./)
    ) {
      description = trimmed
        .replace(/\*\*(.+?)\*\*/g, "$1")
        .replace(/\*(.+?)\*/g, "$1")
        .replace(/\[(.+?)\]\(.+?\)/g, "$1")
        .replace(/`(.+?)`/g, "$1")
        .trim();

      if (description.length > 160) {
        description = description.substring(0, 157) + "...";
      }
      break;
    }
  }

  if (!description && title && title.length > 50) {
    description = title.substring(0, 157) + "...";
  }

  return {
    title: title || "",
    description: description || "",
  };
}

export function extractTitleAndSlug(markdown: string): {
  title: string;
  slug: string;
} {
  const { title } = extractMetadataFromMarkdown(markdown);
  const slug = title ? slugify(title) : "";
  return { title, slug };
}
