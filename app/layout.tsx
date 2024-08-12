import type { Metadata } from "next";
import localFont from "next/font/local";
import { classNames } from "@/lib/classnames";
import "./globals.css";

const berkeleyMono = localFont({
	src: [
		{
			path: "./(fonts)/BerkeleyMonoVariable-Regular.woff2",
			style: "normal",
			weight: "100 150",
		},
		{
			path: "./(fonts)/BerkeleyMonoVariable-Italic.woff2",
			style: "italic",
			weight: "100 150",
		},
	],
	variable: "--font-berkeley",
});
export const metadata: Metadata = {
  title: "leah lundqvist",
  description: "",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={classNames(
					berkeleyMono.className,
					berkeleyMono.variable,
					"flex min-h-screen flex-col bg-white",
				)}>{children}</body>
    </html>
  );
}
