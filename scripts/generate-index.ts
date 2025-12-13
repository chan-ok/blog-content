import { compareDesc } from "date-fns";
import matter from "gray-matter";
import fs from "node:fs";
import nodePath from "node:path";

type Post = {
  id: string;
  title: string;
  thumbnail?: string;
  summary?: string;
  createdAt: string;
  updatedAt?: string;
  tags: string[];
  path: string[];
  published: boolean;
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
    } else if (item.endsWith(".mdx") || item.endsWith(".md")) {
      results.push(fullPath);
    }
  }

  return results;
}

(() => {
  for (const locale of ["ko", "en", "ja"]) {
    console.log(`Generating ${locale}/index/.json...`);
    const postsPath = nodePath.join(process.cwd(), locale, "posts");

    const mdxFiles = getAllMdxFiles(postsPath);
    console.log("Found mdx files: ", mdxFiles.length);

    const posts = mdxFiles
      .map((filePath) => {
        const content = fs.readFileSync(filePath, "utf-8");
        const frontmatter = matter(content).data;
        return {
          filePath,
          frontmatter,
        };
      })
      .filter(({ frontmatter }) => !!frontmatter.id)
      .map(({ filePath, frontmatter }) => {
        const pathArray = nodePath.relative(postsPath, filePath).split("/");
        const title = pathArray.at(-1)?.replace(/\.md(x)?$/, "") ?? "";
        const id = title.split(" ").join("-");

        // 파일명을 제외한 폴더까지의 경로 + 파일 frontmatter-id

        return {
          ...frontmatter,
          id,
          title,
          path: pathArray.join("/"),
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
