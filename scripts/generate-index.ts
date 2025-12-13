import { compareDesc } from "date-fns";
import matter from "gray-matter";
import fs from "node:fs";
import nodePath from "node:path";

type Post = {
  title: string;
  createdAt: string;
  updatedAt?: string;
  tags: string[];
  path: string[];
  published: boolean;
  thumbnail?: string;
  summary?: string;
};

function getAllMdxFiles(dir: string): string[] {
  const results: string[] = [];
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = nodePath.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // 재귀적으로 하위 폴더 탐색
      results.push(...getAllMdxFiles(fullPath));
    } else if (item.endsWith(".mdx")) {
      results.push(fullPath);
    }
  }

  return results;
}

(() => {
  for (const locale of ["ko", "en", "ja"]) {
    console.log(`Generating ${locale}/index.json...`);
    const postsPath = nodePath.join(process.cwd(), locale);

    const mdxFiles = getAllMdxFiles(postsPath);
    console.log("Found mdx files: ", mdxFiles.length);

    const posts = mdxFiles
      .map((filePath) => {
        const content = fs.readFileSync(filePath, "utf-8");
        const frontmatter = matter(content).data;
        return {
          filePath: filePath.replace(/\.mdx$/, ""),
          frontmatter,
        };
      })
      .map(({ filePath, frontmatter }) => {
        const pathArray = nodePath.relative(postsPath, filePath).split("/");
        const title = pathArray.at(-1) ?? "";
        const path = pathArray.slice(0, -1).concat(title.split(" ").join("-"));

        return {
          title,
          path,
          ...frontmatter,
        } as unknown as Post;
      })
      .sort((a, b) => compareDesc(a.createdAt, b.createdAt));

    if (posts.length > 0) {
      console.log("--> post[0]:", posts[0]);
    }

    // save ${locale}/index.json
    fs.writeFileSync(
      nodePath.join(process.cwd(), `${locale}/index.json`),
      JSON.stringify(posts, null, 2)
    );

    console.log(`✅ ${locale}/index.json created successfully!\n`);
  }
})();
