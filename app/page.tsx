import { getCachedPost, getCachedPostList } from "@/lib/content";
import { getSlug } from "@/lib/slug";
import Image from "next/image";
import Link from "next/link";

export default async function Home() {
  const slugs = await getCachedPostList();
  const posts = slugs.map((slug: string) => getCachedPost(getSlug(slug)));
  console.log(posts);
  return (
    <main className="px-16 py-32 flex flex-col gap-2 text-balance">
      <h1 className="font-bold text-lg"># leah lundqvist</h1>
      <p className="max-w-2xl">a multi-disciplinary software engineer with a passion for building wonderful user experiences backed by solid engineering practices.</p>
    
      <h2 className="font-bold mt-4">experience</h2>
      <ul className="list-disc list-inside">
        <Experience years={[2023, -1]} title="founding engineer" at={{ name: "0x57", url: "https://0x57.dev" }} />
        <Experience years={[2021, -1]} title="head of infrastructure" at={{ name: "mainly.ai", url: "https://mainly.ai" }} />
        <Experience years={[2020, 2022]} title="contractor" at={{ name: "discord", url: "https://discord.com" }} />
        <Experience years={[2020, 2021]} title="core maintainer" at={{ name: "vlang", url: "https://vlang.io" }} />
      </ul>

      <h2 className="font-bold mt-4">blog posts</h2>
      <ul className="list-disc list-inside">
        {posts.map((post: any) => (
          <BlogPost key={post.frontmatter.title} title={post.frontmatter.title} date={post.frontmatter.date.toLocaleDateString()} />
        ))}
      </ul>
    </main>
  );
}

function getYearDisplay(year: number) {
  if (year < 0) {
    return "present";
  }
  return year;
}

function Experience({ years, title, at }: { years: [number, number], title: string, at: { name: string, url: string } }) {
  return (
    <li>
      <div className="inline-flex gap-2">
        <a href={`/experience/${at.name}`} className="text-blue-500">{title}</a>
        <span className="opacity-75">at</span>
        <a href={at.url} className="text-blue-500">{at.name}</a>
        <span className="opacity-75">during</span>
        <span>{getYearDisplay(years[0])} -&gt; {getYearDisplay(years[1])}</span>
      </div>
    </li>
  );
}

function BlogPost({ title, date }: { title: string, date: string }) {
  return (
    <li>
      <div className="inline-flex gap-2">
        <Link href={`/blog/${getSlug(title)}`} className="text-blue-500">{title}</Link>
        <span className="opacity-75">on</span>
        <span>{date}</span>
      </div>
    </li>
  );
}