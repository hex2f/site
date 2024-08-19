import { Markdown } from "@/components/Markdown";
import { H1 } from "@/components/md/Heading";
import { getCachedPost, getCachedPostList } from "@/lib/content";
import { getSlug } from "@/lib/slug";
import { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-static";

export async function generateMetadata({
	params,
}: {
	params: { slug: string };
}): Promise<Metadata> {
	const { frontmatter } = await getCachedPost(params.slug);

	return {
		title: frontmatter.title,
		description: frontmatter.excerpt ?? "",
	};
}

export async function generateStaticParams() {
	const files = getCachedPostList();

	return files.map((file: any) => ({
		slug: getSlug(file),
	}));
}

export default async function BlogPost({
	params,
}: {
	params: { slug: string };
}) {
	const { content, frontmatter } = await getCachedPost(params.slug);

	return (
		<main className="p-8 sm:p-16 flex flex-col gap-2 max-w-6xl">
			<Link href="/" className="text-link hover:opacity-70 absolute left-8 sm:left-16">
				<span className="">&lt;- home</span>
			</Link>
			<article className="mt-8 text-justify">
				<H1 className="mb-8">
					{frontmatter.layout === "link" ? (
						<a
							href={frontmatter.href}
							target="_blank"
							className="text-link underline-offset-2 hover:opacity-70 decoration-2 underline flex gap-4 items-center"
						>
							{frontmatter.title}
							{/* <ExternalLink className="size-6" /> */}
						</a>
					) : (
						frontmatter.title ?? ""
					)}
				</H1>
				<Markdown>{content}</Markdown>
			</article>
		</main>
	);
}
