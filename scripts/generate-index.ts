import matter from "gray-matter";
import fs from "node:fs";
import path from "node:path";

type Post = {
  id: number;
  title: string;
  summary: string;
  createdAt: string;
  tags: string[];
  path: string[];
  published: boolean;
  updatedAt?: string | undefined;
};

function getAllMdxFiles(dir: string): string[] {
  const results: string[] = [];
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // 재귀적으로 하위 폴더 탐색
      results.push(...getAllMdxFiles(fullPath));
    } else if (item.endsWith(".mdx") || item.endsWith(".md")) {
      results.push(fullPath);
    }
  }

  return results;
}

export default function generateIndexJson(locale: "ko" | "en" | "ja") {
  console.log(`Generating ${locale}/index/.json...`);
  const postsPath = path.join(process.cwd(), locale);

  const mdxFiles = getAllMdxFiles(postsPath);
  console.log("Found mdx files: ", mdxFiles.length);

  const posts = mdxFiles
    .map((filePath) => {
      const content = fs.readFileSync(filePath, "utf-8");
      const frontmatter = matter(content).data;
      const pathArray = path
        .relative(postsPath, filePath)
        .replace(/\.md(x)?$/, "")
        .split("/");

      return {
        id: pathArray.join("_"),
        ...frontmatter,
        path: pathArray,
      } as unknown as Post;
    })
    .toSorted(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  console.log("Generated posts:", posts);

  // save ${locale}/index.json
  fs.writeFileSync(
    path.join(process.cwd(), `${locale}/index.json`),
    JSON.stringify(posts, null, 2)
  );

  console.log(`✅ ${locale}/index.json created successfully!\n`);
}

generateIndexJson("ko");
generateIndexJson("en");
generateIndexJson("ja");
