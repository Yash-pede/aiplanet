"use client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Image from "next/image";

export function WebSearchSection({ web }: { web: any }) {
  if (!web) return null;

  const videos = web.videos ?? [];
  const articles = web.articles ?? [];

  if (videos.length === 0 && articles.length === 0) return null;

  return (
    <Accordion type="single" collapsible className="mt-4">
      <AccordionItem value="web">
        <AccordionTrigger className="text-sm">
          🌐 Web results
        </AccordionTrigger>

        <AccordionContent>
          <div className="space-y-4">
            {/* Videos */}
            {videos.length > 0 && (
              <div>
                <h4 className="mb-2 text-sm font-medium text-muted-foreground">
                  Videos
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {videos.map((v: any, idx: number) => (
                    <a
                      key={idx}
                      href={v.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex gap-3 rounded-lg border p-2 hover:bg-muted transition"
                    >
                      <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-md bg-muted">
                        {v.thumbnail && (
                          <img
                            src={v.thumbnail}
                            alt={v.title}
                            className="object-cover"
                          />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium line-clamp-2">
                          {v.title}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {v.source} · {v.duration}
                        </span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Articles */}
            {articles.length > 0 && (
              <div>
                <h4 className="mb-2 text-sm font-medium text-muted-foreground">
                  Articles
                </h4>
                <ul className="space-y-2">
                  {articles.map((a: any, idx: number) => (
                    <li key={idx}>
                      <a
                        href={a.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm underline-offset-4 hover:underline"
                      >
                        {a.title}
                      </a>
                      <p className="text-xs text-muted-foreground">
                        {a.source}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

export function RagContextSection({ rag }: { rag?: string }) {
  if (!rag) return null;

  return (
    <Accordion type="single" collapsible className="mt-3">
      <AccordionItem value="rag">
        <AccordionTrigger className="text-sm">
          📄 Document context
        </AccordionTrigger>
        <AccordionContent>
          <pre className="max-h-64 whitespace-pre-wrap rounded-md bg-muted p-3 text-xs overflow-auto">
            {rag}
          </pre>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
