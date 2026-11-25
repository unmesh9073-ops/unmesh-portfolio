import { ArrowUpRight } from 'lucide-react';
import { profileConfig } from '../config/profile.config';

export function NotesSection() {
  if (!profileConfig.modules.showResearchNotes) {
    return null;
  }

  return (
    <section
      id="notes"
      aria-labelledby="notes-heading"
      className="mx-auto w-full max-w-[1120px] scroll-mt-24 px-6 py-20 sm:px-8 lg:px-10 lg:py-24"
    >
      <div>
        <h2 id="notes-heading" className="section-heading text-ink">
          Research Notes
        </h2>
        <p className="mt-2 max-w-[54ch] text-[15px] leading-relaxed text-muted">
          Technical essays, architecture write-ups, and study logs.
        </p>
      </div>

      {profileConfig.notes.length === 0 ? (
        <div className="quiet-surface mt-8 rounded-2xl p-6 text-sm text-muted">
          Add entries to <code className="font-mono text-ink">profileConfig.notes</code> in{' '}
          <code className="font-mono text-ink">src/config/profile.config.ts</code> to publish notes here.
        </div>
      ) : (
        <div className="quiet-surface mt-10 divide-y divide-[var(--border-hairline)] rounded-2xl">
          {profileConfig.notes.map((note) => (
            <article
              key={note.id}
              className="flex flex-col justify-between gap-4 p-6 sm:flex-row sm:items-center sm:p-7"
            >
              <div className="max-w-[60ch]">
                <div className="flex flex-wrap items-center gap-2.5 font-mono text-xs text-muted">
                  <span>{note.publishedAt}</span>
                  <span>·</span>
                  <span className="text-accent">{note.topic}</span>
                  <span>·</span>
                  <span>{note.readingTime}</span>
                </div>
                <h3 className="mt-2 text-base font-semibold tracking-[-0.015em] text-ink sm:text-lg">
                  {note.title}
                </h3>
                <p className="mt-1.5 text-[15px] leading-[1.6] text-muted">
                  {note.summary}
                </p>
              </div>

              {note.url && (
                <a
                  href={note.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-ink transition-opacity duration-150 hover:opacity-75"
                >
                  Read note
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </a>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
