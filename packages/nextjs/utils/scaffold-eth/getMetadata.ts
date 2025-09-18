import type { Metadata } from "next";

const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : `http://localhost:${process.env.PORT || 3000}`;
const titleTemplate = "%s | Speedrun Lisk";

export const getMetadata = ({
  title,
  description,
  imageRelativePath = "/thumbnail.png",
}: {
  title: string;
  description: string;
  imageRelativePath?: string;
}): Metadata => {
  const imageUrl = `${baseUrl}${imageRelativePath}`;

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: title,
      template: titleTemplate,
    },
    description: description,
    openGraph: {
      title: {
        default: title,
        template: titleTemplate,
      },
      description: description,
      images: [
        {
          url: imageUrl,
        },
      ],
    },
    twitter: {
      title: {
        default: title,
        template: titleTemplate,
      },
      description: description,
      images: [imageUrl],
    },
    icons: {
      icon: [
        { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
        { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      ],
      apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
      other: [
        {
          rel: "icon",
          url: "/favicon.ico",
        },
        {
          rel: "manifest",
          url: "/site.webmanifest",
        },
      ],
    },
  };
};
