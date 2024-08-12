import remarkGfm from "remark-gfm";
import rehypePrettyCode, { Options } from "rehype-pretty-code";
import { getHighlighter, bundledLanguages } from "shikiji";
import { transformerNotationDiff } from "shikiji-transformers";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import { unified } from "unified";
import { VFile } from "vfile";
import "server-only";

const highlighterOptions: Options = {
	// @ts-expect-error ???
	getHighlighter: (options) =>
		getHighlighter({
			...options,
			langs: [...Object.keys(bundledLanguages)],
		}),
	theme: "github-light",
	// @ts-expect-error
	transformers: [transformerNotationDiff()],
};

export const processor = unified()
	.use(remarkParse)
	.use(remarkGfm, { singleTilde: false })
	.use(remarkRehype, { allowDangerousHtml: true })
	.use(rehypePrettyCode, highlighterOptions)
	.use(rehypeRaw);

export async function convert(value: string) {
	const file = new VFile();
	file.value = value;

	const mdastTree = processor.parse(file);
	return processor.run(mdastTree, file);
}
